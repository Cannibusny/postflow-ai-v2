const supabase = require('../utils/supabase');
const instagram = require('./instagram');
const logger = require('../utils/logger');
const axios = require('axios');

const MAX_RETRIES = 3;

class PublisherService {
  /**
   * Publish a single post by ID. Fetches the selected caption variant,
   * calls Instagram API, updates status, and logs the attempt.
   */
  async publishPost(postId) {
    // Fetch post
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();

    if (postErr || !post) {
      throw new Error(`Post not found: ${postId}`);
    }

    // Fetch caption variants
    const { data: variants } = await supabase
      .from('caption_variants')
      .select('*')
      .eq('post_id', postId)
      .order('created_at');

    const selectedIdx = post.selected_variant ?? 0;
    const caption = variants?.[selectedIdx]?.caption_text || post.title;

    await this._logAttempt(postId, 'publish_start', 'in_progress', { caption });

    try {
      if (!instagram.configured) {
        throw new Error(
          'Instagram API not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID.'
        );
      }

      const instagramPostId = await instagram.publishSingleImage(
        post.image_url,
        caption
      );

      // Mark as posted
      await supabase
        .from('posts')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          instagram_post_id: instagramPostId,
          retry_count: 0,
          last_error: null,
        })
        .eq('id', postId);

      await this._logAttempt(postId, 'publish_success', 'success', {
        instagram_post_id: instagramPostId,
      });

      // Send webhook notification
      await this._sendWebhook('post_published', { postId, instagramPostId });

      logger.info(`Post ${postId} published → ${instagramPostId}`);
      return instagramPostId;
    } catch (err) {
      const retryCount = (post.retry_count || 0) + 1;
      const newStatus = retryCount >= MAX_RETRIES ? 'failed' : 'scheduled';

      await supabase
        .from('posts')
        .update({
          status: newStatus,
          retry_count: retryCount,
          last_error: err.message,
        })
        .eq('id', postId);

      await this._logAttempt(postId, 'publish_failed', 'error', {
        error: err.message,
        retry_count: retryCount,
      });

      if (newStatus === 'failed') {
        await this._sendWebhook('post_failed', {
          postId,
          error: err.message,
          retries: retryCount,
        });
      }

      logger.error(`Publish failed for ${postId}: ${err.message} (attempt ${retryCount}/${MAX_RETRIES})`);
      throw err;
    }
  }

  /**
   * Fetch analytics for a posted post and store in analytics table.
   */
  async fetchAnalytics(postId) {
    const { data: post } = await supabase
      .from('posts')
      .select('instagram_post_id')
      .eq('id', postId)
      .maybeSingle();

    if (!post?.instagram_post_id) {
      throw new Error('Post has no Instagram ID — not yet published');
    }

    const insights = await instagram.getMediaInsights(post.instagram_post_id);

    const { error } = await supabase.from('analytics').insert({
      post_id: postId,
      instagram_post_id: post.instagram_post_id,
      ...insights,
    });

    if (error) throw error;

    // Also update actual_engagement on the post
    await supabase
      .from('posts')
      .update({ actual_engagement: insights })
      .eq('id', postId);

    logger.info(`Analytics fetched for post ${postId}`);
    return insights;
  }

  async _logAttempt(postId, action, status, details) {
    await supabase.from('posting_log').insert({
      post_id: postId,
      action,
      status,
      details,
    });
  }

  async _sendWebhook(event, payload) {
    const url = process.env.WEBHOOK_URL;
    if (!url) return;

    try {
      await axios.post(url, { event, ...payload }, { timeout: 5000 });
    } catch (err) {
      logger.warn(`Webhook delivery failed: ${err.message}`);
    }
  }
}

module.exports = new PublisherService();
