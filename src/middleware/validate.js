const Joi = require('joi');

const postSchema = Joi.object({
  title: Joi.string().max(500).required(),
  week_number: Joi.number().integer().min(1).max(52).required(),
  image_url: Joi.string().uri().allow(null, ''),
  image_emoji: Joi.string().max(10).default('📸'),
  scheduled_date: Joi.date().iso().allow(null),
  status: Joi.string().valid('draft', 'scheduled', 'posted', 'failed').default('draft'),
  selected_variant: Joi.number().integer().min(0).max(2).default(0),
  engagement_prediction: Joi.number().integer().min(0).max(100).default(50),
  variants: Joi.array().items(
    Joi.object({
      variant_label: Joi.string().valid('Direct', 'Storytelling', 'Challenge').required(),
      caption_text: Joi.string().required(),
    })
  ).max(3),
});

const updatePostSchema = Joi.object({
  title: Joi.string().max(500),
  week_number: Joi.number().integer().min(1).max(52),
  image_url: Joi.string().uri().allow(null, ''),
  image_emoji: Joi.string().max(10),
  scheduled_date: Joi.date().iso().allow(null),
  status: Joi.string().valid('draft', 'scheduled', 'posted', 'failed'),
  selected_variant: Joi.number().integer().min(0).max(2),
  engagement_prediction: Joi.number().integer().min(0).max(100),
  variants: Joi.array().items(
    Joi.object({
      variant_label: Joi.string().valid('Direct', 'Storytelling', 'Challenge').required(),
      caption_text: Joi.string().required(),
    })
  ).max(3),
}).min(1);

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

module.exports = { validate, postSchema, updatePostSchema };
