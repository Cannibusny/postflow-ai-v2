const { Router } = require('express');
const supabase = require('../utils/supabase');
const publisher = require('../services/publisher');
const { apiLimiter } = require('../middleware/rateLimiter');
const { validate, postSchema, updatePostSchema } = require('../middleware/validate');
const logger = require('../utils/logger');

const router = Router();

// GET /api/posts — list all posts with variants
router.get('/', async (req, res, next) => {
  try {
    const { status, week_number } = req.query;

    let query = supabase
      .from('posts')
      .select('*, caption_variants(*)')
      .order('scheduled_date', { ascending: true, nullsFirst: false });

    if (status) query = query.eq('status', status);
    if (week_number) query = query.eq('week_number', Number(week_number));

    const { data, error } = await query;
    if (error) throw error;

    res.json({ posts: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id — single post with variants
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, caption_variants(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Post not found' });

    res.json({ post: data });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts — create new post
router.post('/', apiLimiter, validate(postSchema), async (req, res, next) => {
  try {
    const { variants, ...postData } = req.validatedBody;

    // Insert post
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (postErr) throw postErr;

    // Insert variants if provided
    if (variants && variants.length > 0) {
      const variantRows = variants.map((v) => ({
        post_id: post.id,
        variant_label: v.variant_label,
        caption_text: v.caption_text,
      }));

      const { error: varErr } = await supabase
        .from('caption_variants')
        .insert(variantRows);

      if (varErr) throw varErr;
    }

    // Fetch full post with variants
    const { data: fullPost } = await supabase
      .from('posts')
      .select('*, caption_variants(*)')
      .eq('id', post.id)
      .single();

    logger.info(`Post created: ${post.id}`);
    res.status(201).json({ post: fullPost });
  } catch (err) {
    next(err);
  }
});

// PUT /api/posts/:id — update post
router.put('/:id', apiLimiter, validate(updatePostSchema), async (req, res, next) => {
  try {
    const { variants, ...postData } = req.validatedBody;

    // Update post fields
    if (Object.keys(postData).length > 0) {
      const { error } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', req.params.id);

      if (error) throw error;
    }

    // Update variants if provided
    if (variants && variants.length > 0) {
      // Delete existing variants and replace
      await supabase
        .from('caption_variants')
        .delete()
        .eq('post_id', req.params.id);

      const variantRows = variants.map((v) => ({
        post_id: req.params.id,
        variant_label: v.variant_label,
        caption_text: v.caption_text,
      }));

      const { error: varErr } = await supabase
        .from('caption_variants')
        .insert(variantRows);

      if (varErr) throw varErr;
    }

    // Fetch updated post
    const { data: fullPost, error: fetchErr } = await supabase
      .from('posts')
      .select('*, caption_variants(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!fullPost) return res.status(404).json({ error: 'Post not found' });

    logger.info(`Post updated: ${req.params.id}`);
    res.json({ post: fullPost });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    logger.info(`Post deleted: ${req.params.id}`);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/publish — manually trigger immediate publish
router.post('/:id/publish', apiLimiter, async (req, res, next) => {
  try {
    const instagramPostId = await publisher.publishPost(req.params.id);
    res.json({ message: 'Post published', instagram_post_id: instagramPostId });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/pause — pause a scheduled post
router.post('/:id/pause', apiLimiter, async (req, res, next) => {
  try {
    const { data: post } = await supabase
      .from('posts')
      .select('status, scheduled_date')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { error } = await supabase
      .from('posts')
      .update({ status: 'draft' })
      .eq('id', req.params.id);

    if (error) throw error;

    logger.info(`Post paused: ${req.params.id} (was: ${post.status})`);
    res.json({ message: 'Post paused — status set to draft', previous_status: post.status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
