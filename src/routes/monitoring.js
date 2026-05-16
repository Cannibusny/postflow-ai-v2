const { Router } = require('express');
const supabase = require('../utils/supabase');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = Router();

// ---- Keywords ----

// GET /api/monitoring/keywords
router.get('/keywords', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('monitoring_keywords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ keywords: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/monitoring/keywords
router.post('/keywords', apiLimiter, async (req, res, next) => {
  try {
    const { keyword, type } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: 'keyword is required' });
    }
    const validTypes = ['keyword', 'hashtag', 'brand', 'competitor'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    }

    const { data, error } = await supabase
      .from('monitoring_keywords')
      .insert({ keyword, type: type || 'keyword' })
      .select()
      .single();

    if (error) throw error;
    logger.info(`Monitoring keyword added: ${keyword} (${type || 'keyword'})`);
    res.status(201).json({ keyword: data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/monitoring/keywords/:id
router.delete('/keywords/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('monitoring_keywords')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    logger.info(`Monitoring keyword deleted: ${req.params.id}`);
    res.json({ message: 'Keyword deleted' });
  } catch (err) {
    next(err);
  }
});

// ---- Mentions ----

// GET /api/monitoring/mentions
router.get('/mentions', async (req, res, next) => {
  try {
    const { sentiment, is_read, is_archived, platform } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    let query = supabase
      .from('mentions')
      .select('*, assigned:assigned_to(name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sentiment) query = query.eq('sentiment', sentiment);
    if (is_read !== undefined) query = query.eq('is_read', is_read === 'true');
    if (is_archived !== undefined) query = query.eq('is_archived', is_archived === 'true');
    if (platform) query = query.eq('platform', platform);

    // Default: don't show archived
    if (is_archived === undefined) query = query.eq('is_archived', false);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ mentions: data || [] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/monitoring/mentions/:id — update mention (read, archive, assign, tag)
router.put('/mentions/:id', apiLimiter, async (req, res, next) => {
  try {
    const { is_read, is_archived, assigned_to, tags } = req.body;
    const updates = {};
    if (is_read !== undefined) updates.is_read = is_read;
    if (is_archived !== undefined) updates.is_archived = is_archived;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (tags !== undefined) updates.tags = tags;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('mentions')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ mention: data });
  } catch (err) {
    next(err);
  }
});

// POST /api/monitoring/mentions — create mention (for testing / webhook ingestion)
router.post('/mentions', apiLimiter, async (req, res, next) => {
  try {
    const { platform, author_name, author_handle, author_avatar, content, source_url, matched_keyword } = req.body;
    if (!platform || !author_name || !content) {
      return res.status(400).json({ error: 'platform, author_name, and content are required' });
    }

    // Basic sentiment detection
    const sentiment = detectSentiment(content);

    const { data, error } = await supabase
      .from('mentions')
      .insert({
        platform, author_name, author_handle, author_avatar,
        content, source_url, sentiment, matched_keyword,
      })
      .select()
      .single();

    if (error) throw error;
    logger.info(`Mention created: ${author_name} on ${platform} (${sentiment})`);
    res.status(201).json({ mention: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/monitoring/stats — sentiment & mention statistics
router.get('/stats', async (_req, res, next) => {
  try {
    const { data: mentions, error } = await supabase
      .from('mentions')
      .select('sentiment, is_read, platform')
      .eq('is_archived', false);

    if (error) throw error;

    const stats = {
      total: mentions.length,
      unread: mentions.filter((m) => !m.is_read).length,
      positive: mentions.filter((m) => m.sentiment === 'positive').length,
      neutral: mentions.filter((m) => m.sentiment === 'neutral').length,
      negative: mentions.filter((m) => m.sentiment === 'negative').length,
      by_platform: {},
    };

    for (const m of mentions) {
      stats.by_platform[m.platform] = (stats.by_platform[m.platform] || 0) + 1;
    }

    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

// Simple keyword-based sentiment detection
function detectSentiment(text) {
  const lower = text.toLowerCase();
  const positiveWords = ['love', 'great', 'amazing', 'awesome', 'excellent', 'fantastic', 'wonderful', 'best', 'perfect', 'thank', 'beautiful', 'happy', 'excited', 'brilliant', 'outstanding'];
  const negativeWords = ['hate', 'terrible', 'worst', 'awful', 'horrible', 'disgusting', 'scam', 'fraud', 'refund', 'lawsuit', 'complaint', 'disappointed', 'angry', 'furious', 'unacceptable'];

  const posCount = positiveWords.filter((w) => lower.includes(w)).length;
  const negCount = negativeWords.filter((w) => lower.includes(w)).length;

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}

module.exports = router;
