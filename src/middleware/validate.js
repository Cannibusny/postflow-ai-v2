const Joi = require('joi');

const PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];
const VARIANT_LABELS = ['Direct', 'Storytelling', 'Challenge', 'Enthusiastic', 'Educational', 'Conversational'];

const postSchema = Joi.object({
  title: Joi.string().max(500).required(),
  week_number: Joi.number().integer().min(1).max(52).allow(null),
  image_url: Joi.string().uri().allow(null, ''),
  image_emoji: Joi.string().max(10).default('📸'),
  scheduled_date: Joi.date().iso().allow(null),
  status: Joi.string().valid('draft', 'scheduled', 'posted', 'failed').default('draft'),
  selected_variant: Joi.number().integer().min(0).max(9).default(0),
  engagement_prediction: Joi.number().integer().min(0).max(100).default(50),
  platforms: Joi.array().items(Joi.string().valid(...PLATFORMS)).min(1).default(['instagram']),
  media_urls: Joi.array().items(Joi.string().uri()).default([]),
  hashtags: Joi.array().items(Joi.string().max(100)).default([]),
  first_comment: Joi.string().max(2200).allow(null, ''),
  queue_position: Joi.number().integer().allow(null),
  campaign: Joi.string().max(200).allow(null, ''),
  platform_customizations: Joi.object().default({}),
  variants: Joi.array().items(
    Joi.object({
      variant_label: Joi.string().valid(...VARIANT_LABELS).required(),
      caption_text: Joi.string().required(),
    })
  ).max(6),
});

const updatePostSchema = Joi.object({
  title: Joi.string().max(500),
  week_number: Joi.number().integer().min(1).max(52).allow(null),
  image_url: Joi.string().uri().allow(null, ''),
  image_emoji: Joi.string().max(10),
  scheduled_date: Joi.date().iso().allow(null),
  status: Joi.string().valid('draft', 'scheduled', 'posted', 'failed'),
  selected_variant: Joi.number().integer().min(0).max(9),
  engagement_prediction: Joi.number().integer().min(0).max(100),
  platforms: Joi.array().items(Joi.string().valid(...PLATFORMS)).min(1),
  media_urls: Joi.array().items(Joi.string().uri()),
  hashtags: Joi.array().items(Joi.string().max(100)),
  first_comment: Joi.string().max(2200).allow(null, ''),
  queue_position: Joi.number().integer().allow(null),
  campaign: Joi.string().max(200).allow(null, ''),
  platform_customizations: Joi.object(),
  variants: Joi.array().items(
    Joi.object({
      variant_label: Joi.string().valid(...VARIANT_LABELS).required(),
      caption_text: Joi.string().required(),
    })
  ).max(6),
}).min(1);

const queueSettingsSchema = Joi.object({
  platform: Joi.string().valid(...PLATFORMS).required(),
  day_of_week: Joi.number().integer().min(0).max(6).required(),
  time_slot: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  is_active: Joi.boolean().default(true),
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ error: 'Validation failed', details: messages });
    }
    req.validatedBody = value;
    next();
  };
}

module.exports = { validate, postSchema, updatePostSchema, queueSettingsSchema, PLATFORMS };
