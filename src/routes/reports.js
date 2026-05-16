const { Router } = require('express');
const supabase = require('../utils/supabase');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

const router = Router();

// GET /api/reports — list all reports
router.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ reports: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/reports — create a report
router.post('/', apiLimiter, async (req, res, next) => {
  try {
    const { name, template, date_range_start, date_range_end, platforms, metrics, white_label, logo_url } = req.body;
    if (!name || !date_range_start || !date_range_end) {
      return res.status(400).json({ error: 'name, date_range_start, and date_range_end are required' });
    }

    const validTemplates = ['executive', 'detailed', 'comparison'];
    if (template && !validTemplates.includes(template)) {
      return res.status(400).json({ error: `template must be one of: ${validTemplates.join(', ')}` });
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        name,
        template: template || 'executive',
        date_range_start,
        date_range_end,
        platforms: platforms || ['instagram'],
        metrics: metrics || ['impressions', 'engagement', 'followers', 'clicks'],
        white_label: white_label || false,
        logo_url,
        status: 'ready',
      })
      .select()
      .single();

    if (error) throw error;
    logger.info(`Report created: ${data.name}`);
    res.status(201).json({ report: data });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/:id — get single report
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Report not found' });
    res.json({ report: data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reports/:id — delete a report
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    logger.info(`Report deleted: ${req.params.id}`);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    next(err);
  }
});

// ---- Scheduled Reports ----

// GET /api/reports/scheduled/list
router.get('/scheduled/list', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ schedules: data || [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/reports/scheduled — create scheduled report
router.post('/scheduled', apiLimiter, async (req, res, next) => {
  try {
    const { report_template, frequency, day_of_week, time_of_day, recipients, platforms } = req.body;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'recipients must be a non-empty array of email addresses' });
    }

    const { data, error } = await supabase
      .from('scheduled_reports')
      .insert({
        report_template: report_template || 'executive',
        frequency: frequency || 'weekly',
        day_of_week,
        time_of_day: time_of_day || '09:00',
        recipients,
        platforms: platforms || ['instagram'],
      })
      .select()
      .single();

    if (error) throw error;
    logger.info(`Scheduled report created: ${frequency || 'weekly'}`);
    res.status(201).json({ schedule: data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reports/scheduled/:id
router.delete('/scheduled/:id', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('scheduled_reports')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    logger.info(`Scheduled report deleted: ${req.params.id}`);
    res.json({ message: 'Scheduled report deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
