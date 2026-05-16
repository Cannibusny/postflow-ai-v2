const { Router } = require('express');
const supabase = require('../utils/supabase');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = Router();

// GET /api/approvals — list posts pending approval
router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    const { data, error } = await supabase
      .from('posts')
      .select('*, caption_variants(*), creator:created_by(name, avatar_url), approver:approved_by(name, avatar_url)')
      .eq('approval_status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ posts: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/approvals/:id/approve — approve a post
router.post('/:id/approve', apiLimiter, async (req, res, next) => {
  try {
    const { approved_by } = req.body;

    const { error: updateErr } = await supabase
      .from('posts')
      .update({
        approval_status: 'approved',
        approved_by,
        approved_at: new Date().toISOString(),
        status: 'scheduled',
      })
      .eq('id', req.params.id)
      .eq('approval_status', 'pending');

    if (updateErr) throw updateErr;

    // Log the approval
    const { error: logErr } = await supabase
      .from('approval_log')
      .insert({
        post_id: req.params.id,
        actor_id: approved_by,
        action: 'approved',
      });

    if (logErr) throw logErr;

    logger.info(`Post approved: ${req.params.id} by ${approved_by}`);
    res.json({ message: 'Post approved' });
  } catch (err) {
    next(err);
  }
});

// POST /api/approvals/:id/request-changes — request changes on a post
router.post('/:id/request-changes', apiLimiter, async (req, res, next) => {
  try {
    const { actor_id, notes } = req.body;
    if (!notes) {
      return res.status(400).json({ error: 'notes are required when requesting changes' });
    }

    const { error: updateErr } = await supabase
      .from('posts')
      .update({ approval_status: 'changes_requested' })
      .eq('id', req.params.id);

    if (updateErr) throw updateErr;

    const { error: logErr } = await supabase
      .from('approval_log')
      .insert({
        post_id: req.params.id,
        actor_id,
        action: 'changes_requested',
        notes,
      });

    if (logErr) throw logErr;

    logger.info(`Changes requested on post: ${req.params.id}`);
    res.json({ message: 'Changes requested' });
  } catch (err) {
    next(err);
  }
});

// POST /api/approvals/:id/resubmit — resubmit post for approval
router.post('/:id/resubmit', apiLimiter, async (req, res, next) => {
  try {
    const { actor_id } = req.body;

    const { error: updateErr } = await supabase
      .from('posts')
      .update({ approval_status: 'pending' })
      .eq('id', req.params.id)
      .eq('approval_status', 'changes_requested');

    if (updateErr) throw updateErr;

    const { error: logErr } = await supabase
      .from('approval_log')
      .insert({
        post_id: req.params.id,
        actor_id,
        action: 'resubmitted',
      });

    if (logErr) throw logErr;

    logger.info(`Post resubmitted: ${req.params.id}`);
    res.json({ message: 'Post resubmitted for approval' });
  } catch (err) {
    next(err);
  }
});

// POST /api/approvals/batch-approve — approve multiple posts at once
router.post('/batch-approve', apiLimiter, async (req, res, next) => {
  try {
    const { post_ids, approved_by } = req.body;
    if (!Array.isArray(post_ids) || post_ids.length === 0) {
      return res.status(400).json({ error: 'post_ids must be a non-empty array' });
    }

    const { error: updateErr } = await supabase
      .from('posts')
      .update({
        approval_status: 'approved',
        approved_by,
        approved_at: new Date().toISOString(),
        status: 'scheduled',
      })
      .in('id', post_ids)
      .eq('approval_status', 'pending');

    if (updateErr) throw updateErr;

    const logRows = post_ids.map((pid) => ({
      post_id: pid,
      actor_id: approved_by,
      action: 'approved',
    }));

    const { error: logErr } = await supabase
      .from('approval_log')
      .insert(logRows);

    if (logErr) throw logErr;

    logger.info(`Batch approved ${post_ids.length} posts`);
    res.json({ message: `${post_ids.length} posts approved` });
  } catch (err) {
    next(err);
  }
});

// GET /api/approvals/:id/log — audit log for a specific post
router.get('/:id/log', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('approval_log')
      .select('*, team_members(name, avatar_url)')
      .eq('post_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ log: data || [] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
