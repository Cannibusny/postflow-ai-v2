const { Router } = require('express');
const supabase = require('../utils/supabase');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = Router();

// GET /api/notes/:postId — get notes for a post
router.get('/:postId', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('post_notes')
      .select('*, team_members(name, avatar_url)')
      .eq('post_id', req.params.postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ notes: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/notes/:postId — add a note to a post
router.post('/:postId', apiLimiter, async (req, res, next) => {
  try {
    const { author_id, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const { data, error } = await supabase
      .from('post_notes')
      .insert({ post_id: req.params.postId, author_id, content })
      .select('*, team_members(name, avatar_url)')
      .single();

    if (error) throw error;
    logger.info(`Note added to post ${req.params.postId}`);
    res.status(201).json({ note: data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notes/:postId/:noteId — delete a note
router.delete('/:postId/:noteId', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('post_notes')
      .delete()
      .eq('id', req.params.noteId)
      .eq('post_id', req.params.postId);

    if (error) throw error;
    logger.info(`Note deleted: ${req.params.noteId}`);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
