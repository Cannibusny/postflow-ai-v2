const axios = require('axios');
const logger = require('../utils/logger');

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

class InstagramService {
  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.igAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    this.pageId = process.env.FACEBOOK_PAGE_ID;
  }

  get configured() {
    return !!(this.accessToken && this.igAccountId);
  }

  /**
   * Publish a single image post to Instagram Business account.
   * Step 1: Create media container
   * Step 2: Publish the container
   */
  async publishSingleImage(imageUrl, caption) {
    if (!this.configured) {
      throw new Error('Instagram API not configured — missing access token or account ID');
    }

    logger.info('Creating Instagram media container…');

    // Step 1 — create media container
    const containerRes = await axios.post(
      `${GRAPH_API_BASE}/${this.igAccountId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption,
          access_token: this.accessToken,
        },
      }
    );

    const containerId = containerRes.data.id;
    logger.info(`Media container created: ${containerId}`);

    // Wait for container to be ready (Meta recommends polling)
    await this._waitForContainer(containerId);

    // Step 2 — publish
    const publishRes = await axios.post(
      `${GRAPH_API_BASE}/${this.igAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: this.accessToken,
        },
      }
    );

    const postId = publishRes.data.id;
    logger.info(`Post published: ${postId}`);
    return postId;
  }

  /**
   * Publish a carousel (multiple images) to Instagram Business account.
   */
  async publishCarousel(imageUrls, caption) {
    if (!this.configured) {
      throw new Error('Instagram API not configured');
    }

    // Create child containers
    const childIds = [];
    for (const url of imageUrls) {
      const res = await axios.post(
        `${GRAPH_API_BASE}/${this.igAccountId}/media`,
        null,
        {
          params: {
            image_url: url,
            is_carousel_item: true,
            access_token: this.accessToken,
          },
        }
      );
      childIds.push(res.data.id);
    }

    // Create carousel container
    const carouselRes = await axios.post(
      `${GRAPH_API_BASE}/${this.igAccountId}/media`,
      null,
      {
        params: {
          media_type: 'CAROUSEL',
          children: childIds.join(','),
          caption,
          access_token: this.accessToken,
        },
      }
    );

    const containerId = carouselRes.data.id;
    await this._waitForContainer(containerId);

    // Publish
    const publishRes = await axios.post(
      `${GRAPH_API_BASE}/${this.igAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: this.accessToken,
        },
      }
    );

    return publishRes.data.id;
  }

  /**
   * Fetch insights for a given Instagram media post.
   */
  async getMediaInsights(instagramPostId) {
    if (!this.configured) {
      throw new Error('Instagram API not configured');
    }

    const res = await axios.get(
      `${GRAPH_API_BASE}/${instagramPostId}/insights`,
      {
        params: {
          metric: 'reach,impressions,saved,shares,comments,likes',
          access_token: this.accessToken,
        },
      }
    );

    const metrics = {};
    for (const item of res.data.data) {
      metrics[item.name] = item.values?.[0]?.value ?? 0;
    }

    return {
      reach: metrics.reach || 0,
      impressions: metrics.impressions || 0,
      saves: metrics.saved || 0,
      shares: metrics.shares || 0,
      comments: metrics.comments || 0,
      likes: metrics.likes || 0,
    };
  }

  /**
   * Poll container status until FINISHED (or timeout).
   */
  async _waitForContainer(containerId, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await axios.get(`${GRAPH_API_BASE}/${containerId}`, {
        params: {
          fields: 'status_code',
          access_token: this.accessToken,
        },
      });

      const status = res.data.status_code;
      if (status === 'FINISHED') return;
      if (status === 'ERROR') {
        throw new Error(`Container ${containerId} failed processing`);
      }

      // Wait 2 seconds between polls
      await new Promise((r) => setTimeout(r, 2000));
    }

    throw new Error(`Container ${containerId} timed out waiting for FINISHED status`);
  }
}

module.exports = new InstagramService();
