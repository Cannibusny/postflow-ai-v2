const { Router } = require('express');
const supabase = require('../utils/supabase');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = Router();

// GET /api/team — list all team members
router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json({ members: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/team — add team member
router.post('/', apiLimiter, async (req, res, next) => {
  try {
    const { name, email, role, avatar_url } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    if (role && !['admin', 'creator', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'role must be admin, creator, or viewer' });
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert({ name, email, role: role || 'creator', avatar_url })
      .select()
      .single();

    if (error) throw error;
    logger.info(`Team member added: ${data.name} (${data.role})`);
    res.status(201).json({ member: data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/team/:id — update team member
router.put('/:id', apiLimiter, async (req, res, next) => {
  try {
    const { name, email, role, avatar_url, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) {
      if (!['admin', 'creator', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'role must be admin, creator, or viewer' });
      }
      updates.role = role;
    }
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    logger.info(`Team member updated: ${req.params.id}`);
    res.json({ member: data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/team/:id — remove team member
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    logger.info(`Team member deleted: ${req.params.id}`);
    res.json({ message: 'Team member removed' });
  } catch (err) {
    next(err);
  }
});

// GET /api/team/activity — activity feed
router.get('/activity', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*, team_members(name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ activities: data || [] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
