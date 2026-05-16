const { Router } = require('express');
const supabase = require('../utils/supabase');
const { apiLimiter } = require('../middleware/rateLimiter');
const { validate, queueSettingsSchema } = require('../middleware/validate');
const logger = require('../utils/logger');

const router = Router();

// GET /api/queue/settings — list all queue time slots
router.get('/settings', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('queue_settings')
      .select('*')
      .order('platform')
      .order('day_of_week')
      .order('time_slot');

    if (error) throw error;
    res.json({ settings: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/queue/settings — add a queue time slot
router.post('/settings', apiLimiter, validate(queueSettingsSchema), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('queue_settings')
      .insert(req.validatedBody)
      .select()
      .single();

    if (error) throw error;
    logger.info(`Queue slot added: ${data.platform} ${data.day_of_week} ${data.time_slot}`);
    res.status(201).json({ setting: data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/queue/settings/:id — remove a queue time slot
router.delete('/settings/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('queue_settings')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    logger.info(`Queue slot deleted: ${req.params.id}`);
    res.json({ message: 'Queue slot deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/queue/posts — list queued posts in order
router.get('/posts', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, caption_variants(*)')
      .not('queue_position', 'is', null)
      .in('status', ['draft', 'scheduled'])
      .order('queue_position', { ascending: true });

    if (error) throw error;
    res.json({ posts: data || [] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/queue/reorder — reorder queued posts
router.put('/reorder', apiLimiter, async (req, res, next) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'order must be an array of post IDs' });
    }

    for (let i = 0; i < order.length; i++) {
      const { error } = await supabase
        .from('posts')
        .update({ queue_position: i + 1 })
        .eq('id', order[i]);

      if (error) throw error;
    }

    logger.info(`Queue reordered: ${order.length} posts`);
    res.json({ message: 'Queue reordered' });
  } catch (err) {
    next(err);
  }
});

// POST /api/queue/pause — toggle queue pause
router.post('/pause', apiLimiter, async (req, res, next) => {
  try {
    const { paused } = req.body;
    // We store queue pause state as a simple approach: set all queued posts to draft/scheduled
    if (paused) {
      await supabase
        .from('posts')
        .update({ status: 'draft' })
        .not('queue_position', 'is', null)
        .eq('status', 'scheduled');

      logger.info('Queue paused — all queued posts set to draft');
    } else {
      await supabase
        .from('posts')
        .update({ status: 'scheduled' })
        .not('queue_position', 'is', null)
        .eq('status', 'draft');

      logger.info('Queue resumed — all queued posts set to scheduled');
    }

    res.json({ message: paused ? 'Queue paused' : 'Queue resumed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
