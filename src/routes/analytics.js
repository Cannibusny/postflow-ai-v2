const { Router } = require('express');
const supabase = require('../utils/supabase');
const publisher = require('../services/publisher');
const logger = require('../utils/logger');

const router = Router();

// GET /api/analytics — all analytics
router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*, posts(title, scheduled_date, engagement_prediction)')
      .order('fetched_at', { ascending: false });

    if (error) throw error;

    res.json({ analytics: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/:id — analytics for a specific post
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('post_id', req.params.id)
      .order('fetched_at', { ascending: false });

    if (error) throw error;

    res.json({ analytics: data });
  } catch (err) {
    next(err);
  }
});

// POST /api/analytics/:id/refresh — manually refresh analytics for a post
router.post('/:id/refresh', async (req, res, next) => {
  try {
    const insights = await publisher.fetchAnalytics(req.params.id);
    res.json({ message: 'Analytics refreshed', data: insights });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
