const cron = require('node-cron');
const supabase = require('../utils/supabase');
const publisher = require('../services/publisher');
const instagram = require('../services/instagram');
const logger = require('../utils/logger');

class Scheduler {
  constructor() {
    this.task = null;
  }

  start() {
    // Run every 5 minutes
    this.task = cron.schedule('*/5 * * * *', () => this._tick());
    logger.info('Scheduler registered — cron: */5 * * * *');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      logger.info('Scheduler stopped');
    }
  }

  async _tick() {
    logger.info('Scheduler tick — checking for due posts…');

    try {
      // Find posts that are scheduled and due
      const now = new Date().toISOString();
      const { data: duePosts, error } = await supabase
        .from('posts')
        .select('id, title, retry_count')
        .eq('status', 'scheduled')
        .lte('scheduled_date', now)
        .lt('retry_count', 3)
        .order('scheduled_date');

      if (error) {
        logger.error(`Scheduler query error: ${error.message}`);
        return;
      }

      if (!duePosts || duePosts.length === 0) {
        logger.info('No posts due for publishing');
        return;
      }

      logger.info(`Found ${duePosts.length} post(s) due for publishing`);

      for (const post of duePosts) {
        try {
          // Exponential backoff for retries
          if (post.retry_count > 0) {
            const delayMs = Math.pow(2, post.retry_count) * 60 * 1000; // 2^n minutes
            const lastAttempt = await this._getLastAttemptTime(post.id);
            if (lastAttempt && Date.now() - lastAttempt.getTime() < delayMs) {
              logger.info(`Skipping ${post.id} — retry backoff (${post.retry_count})`);
              continue;
            }
          }

          await publisher.publishPost(post.id);
        } catch (err) {
          logger.error(`Failed to publish post ${post.id}: ${err.message}`);
        }
      }

      // Also fetch analytics for recently posted content
      await this._fetchRecentAnalytics();
    } catch (err) {
      logger.error(`Scheduler tick error: ${err.message}`);
    }
  }

  async _fetchRecentAnalytics() {
    if (!instagram.configured) return;

    try {
      // Fetch analytics for posts posted in the last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('id, instagram_post_id')
        .eq('status', 'posted')
        .not('instagram_post_id', 'is', null)
        .gte('posted_at', weekAgo);

      if (!recentPosts || recentPosts.length === 0) return;

      for (const post of recentPosts) {
        try {
          await publisher.fetchAnalytics(post.id);
        } catch (err) {
          logger.warn(`Analytics fetch failed for ${post.id}: ${err.message}`);
        }
      }
    } catch (err) {
      logger.warn(`Analytics batch fetch error: ${err.message}`);
    }
  }

  async _getLastAttemptTime(postId) {
    const { data } = await supabase
      .from('posting_log')
      .select('created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data ? new Date(data.created_at) : null;
  }
}

module.exports = new Scheduler();
