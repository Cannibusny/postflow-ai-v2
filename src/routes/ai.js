const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const logger = require('../utils/logger');

// --------------- AI Content Generation ---------------

const DEMO_CONTENT = {
  enthusiastic: (topic) =>
    `🔥 ${topic}! We're SO excited to share this with you — it's a game-changer! Drop a 🙌 if you're as pumped as we are! #LetsGo`,
  educational: (topic) =>
    `📚 Did you know? ${topic} — here's what makes it special and why it matters for you. Swipe for the full breakdown 👉`,
  conversational: (topic) =>
    `Hey friends 👋 Let's talk about ${topic}. We'd love to hear your thoughts — what do you think? Tell us in the comments!`,
};

router.post('/generate-content', async (req, res) => {
  try {
    const { prompt, platforms } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let variations;
    let usedAI = false;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    if (claudeKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Write 3 social media post variations for: "${prompt}".

Variation A (Enthusiastic): Energetic, excited tone with emojis. Under 280 characters.
Variation B (Educational): Informative, teach-something tone. Under 280 characters.
Variation C (Conversational): Casual, friendly, asks a question. Under 280 characters.

${platforms?.length ? `Target platforms: ${platforms.join(', ')}` : ''}

Return ONLY valid JSON with this exact format:
{"variations":[{"tone":"Enthusiastic","text":"..."},{"tone":"Educational","text":"..."},{"tone":"Conversational","text":"..."}]}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          variations = parsed.variations;
          usedAI = true;
        }
      }
    }

    if (!variations) {
      const topic = prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt;
      variations = [
        { tone: 'Enthusiastic', text: DEMO_CONTENT.enthusiastic(topic) },
        { tone: 'Educational', text: DEMO_CONTENT.educational(topic) },
        { tone: 'Conversational', text: DEMO_CONTENT.conversational(topic) },
      ];
    }

    if (supabase) {
      await supabase.from('ai_generations').insert({
        generation_type: 'content',
        prompt,
        result: { variations },
        model: usedAI ? 'claude-sonnet-4-20250514' : 'demo',
      });
    }

    res.json({ variations, model: usedAI ? 'claude' : 'demo' });
  } catch (err) {
    logger.error('AI content generation failed:', err);
    res.status(500).json({ error: 'Content generation failed' });
  }
});

// --------------- AI Image Generation ---------------

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=512&h=512&fit=crop',
];

router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, size } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Image description is required' });
    }

    let imageUrl;
    let usedAI = false;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: size || '1024x1024',
          quality: 'standard',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        imageUrl = data.data[0].url;
        usedAI = true;
      }
    }

    if (!imageUrl) {
      imageUrl = DEMO_IMAGES[Math.floor(Math.random() * DEMO_IMAGES.length)];
    }

    if (supabase) {
      await supabase.from('ai_generations').insert({
        generation_type: 'image',
        prompt,
        result: { url: imageUrl },
        model: usedAI ? 'dall-e-3' : 'demo',
      });
    }

    res.json({ url: imageUrl, model: usedAI ? 'dall-e-3' : 'demo' });
  } catch (err) {
    logger.error('AI image generation failed:', err);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

// --------------- Compliance Checker ---------------

const COMPLIANCE_RULES = [
  {
    pattern: /\b(cure[sd]?|treat[s]?|heal[s]?|remed(?:y|ies)|medical benefit|therapeutic)\b/i,
    category: 'Health Claims',
    severity: 'high',
    message: 'Cannot make health or medical claims about cannabis products',
    suggestion: 'Remove health claims. Focus on experience, flavor, or effects without medical language.',
  },
  {
    pattern: /\b(kids?|children|minors?|teens?|youth|young people|all ages|family fun|cartoon)\b/i,
    category: 'Appeal to Minors',
    severity: 'high',
    message: 'Content may appeal to minors — prohibited under cannabis advertising regulations',
    suggestion: 'Ensure content targets adults only. Remove any language that could appeal to minors.',
  },
  {
    pattern: /\b(free\s+sample|giveaway|free\s+weed|free\s+cannabis|win\s+free)\b/i,
    category: 'Free Product Promotion',
    severity: 'medium',
    message: 'Offering free cannabis products may violate advertising regulations',
    suggestion: 'Remove free product offers. Consider discount language instead if permitted in your jurisdiction.',
  },
  {
    pattern: /\b(guaranteed|100%\s*safe|no\s+side\s+effects|risk[- ]?free)\b/i,
    category: 'Safety Claims',
    severity: 'medium',
    message: 'Making absolute safety claims is prohibited',
    suggestion: 'Remove absolute safety claims. Use measured language about product quality.',
  },
  {
    pattern: /\b(drive|driving|operate\s+machinery|before\s+work)\b/i,
    category: 'Impairment Risk',
    severity: 'medium',
    message: 'Content should not associate cannabis use with driving or operating machinery',
    suggestion: 'Remove references to activities that require sobriety.',
  },
];

const AGE_DISCLAIMER_PATTERN = /\b(21\+|21\s*and\s*over|adults?\s*only|must\s*be\s*21|legal\s*age)\b/i;

router.post('/compliance-check', async (req, res) => {
  try {
    const { caption, post_id } = req.body;
    if (!caption) {
      return res.status(400).json({ error: 'Caption text is required' });
    }

    let violations = [];
    let usedAI = false;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    if (claudeKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Analyze this social media post for cannabis regulatory compliance. Flag any:
1. Health/medical claims
2. Appeals to minors
3. Missing age disclaimers (21+)
4. Free product promotions
5. Safety guarantee claims
6. Impairment-risk associations

Post: "${caption}"

Return ONLY valid JSON:
{"violations":[{"category":"...","severity":"high|medium|low","message":"...","suggestion":"..."}],"has_age_disclaimer":true|false,"risk_level":"none|low|medium|high"}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          violations = parsed.violations || [];
          usedAI = true;
        }
      }
    }

    if (!usedAI) {
      for (const rule of COMPLIANCE_RULES) {
        if (rule.pattern.test(caption)) {
          violations.push({
            category: rule.category,
            severity: rule.severity,
            message: rule.message,
            suggestion: rule.suggestion,
          });
        }
      }

      if (!AGE_DISCLAIMER_PATTERN.test(caption) && caption.length > 20) {
        violations.push({
          category: 'Missing Age Disclaimer',
          severity: 'low',
          message: 'No 21+ age disclaimer detected in post',
          suggestion: 'Add "21+ only" or "Must be 21+" to your post for compliance.',
        });
      }
    }

    const riskLevel =
      violations.some((v) => v.severity === 'high')
        ? 'high'
        : violations.some((v) => v.severity === 'medium')
        ? 'medium'
        : violations.length > 0
        ? 'low'
        : 'none';

    if (supabase && post_id) {
      await supabase.from('compliance_logs').insert({
        post_id,
        caption_text: caption,
        violations,
        risk_level: riskLevel,
        action_taken: 'pending',
      });
    }

    res.json({
      violations,
      risk_level: riskLevel,
      total_violations: violations.length,
      model: usedAI ? 'claude' : 'rules-engine',
    });
  } catch (err) {
    logger.error('Compliance check failed:', err);
    res.status(500).json({ error: 'Compliance check failed' });
  }
});

// --------------- Predictive Engagement Scoring ---------------

function computeBaseScore(caption, hashtags, platforms, scheduledTime) {
  let score = 40;
  const breakdown = {};

  // Caption quality (0-25)
  const captionLen = caption?.length || 0;
  let captionScore = 0;
  if (captionLen > 10 && captionLen <= 280) captionScore = 20;
  else if (captionLen > 280 && captionLen <= 500) captionScore = 15;
  else if (captionLen > 500) captionScore = 10;
  else captionScore = 5;
  if (/[!?]/.test(caption)) captionScore += 2;
  if (/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/u.test(caption)) captionScore += 3;
  captionScore = Math.min(captionScore, 25);
  breakdown.caption = { score: captionScore, max: 25, label: 'Caption Quality' };

  // Hashtag relevance (0-25)
  const tagCount = hashtags?.length || 0;
  let hashScore = 0;
  if (tagCount >= 5 && tagCount <= 15) hashScore = 25;
  else if (tagCount >= 3 && tagCount < 5) hashScore = 20;
  else if (tagCount > 15 && tagCount <= 25) hashScore = 18;
  else if (tagCount > 25) hashScore = 12;
  else if (tagCount > 0) hashScore = 10;
  else hashScore = 0;
  breakdown.hashtags = { score: hashScore, max: 25, label: 'Hashtag Strategy' };

  // Timing (0-25)
  let timeScore = 15;
  if (scheduledTime) {
    const hour = new Date(scheduledTime).getHours();
    if ((hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 19)) timeScore = 25;
    else if ((hour >= 12 && hour <= 14) || (hour >= 20 && hour <= 21)) timeScore = 20;
    else if (hour >= 7 && hour <= 22) timeScore = 15;
    else timeScore = 8;
  }
  breakdown.timing = { score: timeScore, max: 25, label: 'Posting Time' };

  // Platform optimization (0-25)
  const platformCount = platforms?.length || 1;
  let platformScore = 15;
  if (platformCount >= 3) platformScore = 25;
  else if (platformCount === 2) platformScore = 20;
  else platformScore = 15;
  breakdown.platforms = { score: platformScore, max: 25, label: 'Platform Reach' };

  score = captionScore + hashScore + timeScore + platformScore;

  return { score: Math.min(score, 100), breakdown };
}

function generateSuggestions(breakdown, caption, hashtags) {
  const suggestions = [];

  if (breakdown.caption.score < 20) {
    if (!(caption && /[?]/.test(caption))) {
      suggestions.push('Add a question to boost comments and engagement');
    }
    if (caption && caption.length < 50) {
      suggestions.push('Write a longer caption — posts with 100-200 characters tend to perform better');
    }
    if (caption && !/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}]/u.test(caption)) {
      suggestions.push('Add emojis to make your post stand out in feeds');
    }
  }

  if (breakdown.hashtags.score < 20) {
    const tagCount = hashtags?.length || 0;
    if (tagCount === 0) {
      suggestions.push('Add 5-15 relevant hashtags to increase discoverability');
    } else if (tagCount < 5) {
      suggestions.push(`Add ${5 - tagCount} more hashtags for better reach (aim for 5-15)`);
    } else if (tagCount > 25) {
      suggestions.push('Reduce hashtags to 15-20 for optimal engagement — too many can appear spammy');
    }
  }

  if (breakdown.timing.score < 20) {
    suggestions.push('Try posting between 9-11 AM or 5-7 PM for peak engagement');
  }

  if (breakdown.platforms.score < 20) {
    suggestions.push('Cross-post to 2-3 platforms to maximize your audience reach');
  }

  if (caption && !(/call to action|click|visit|shop|link|comment|share|tag/i.test(caption))) {
    suggestions.push('Include a call-to-action (e.g., "Comment below!", "Tag a friend!")');
  }

  return suggestions;
}

router.post('/predict-score', async (req, res) => {
  try {
    const { caption, hashtags, platforms, scheduled_time, post_id } = req.body;
    if (!caption) {
      return res.status(400).json({ error: 'Caption is required for scoring' });
    }

    let result;
    let usedAI = false;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    if (claudeKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Predict the engagement score (0-100) for this social media post.

Caption: "${caption}"
Hashtags: ${hashtags?.length ? hashtags.map((h) => '#' + h).join(' ') : 'None'}
Platforms: ${platforms?.join(', ') || 'instagram'}
Scheduled: ${scheduled_time || 'Not set'}

Score each factor out of 25:
1. Caption Quality (clarity, hooks, emojis, CTA)
2. Hashtag Strategy (relevance, count, mix of popular/niche)
3. Posting Time (audience activity)
4. Platform Optimization (cross-posting, platform fit)

Return ONLY valid JSON:
{"score":75,"breakdown":{"caption":{"score":20,"max":25,"label":"Caption Quality"},"hashtags":{"score":18,"max":25,"label":"Hashtag Strategy"},"timing":{"score":22,"max":25,"label":"Posting Time"},"platforms":{"score":15,"max":25,"label":"Platform Reach"}},"suggestions":["suggestion1","suggestion2"]}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
          usedAI = true;
        }
      }
    }

    if (!result) {
      const { score, breakdown } = computeBaseScore(caption, hashtags, platforms, scheduled_time);
      const suggestions = generateSuggestions(breakdown, caption, hashtags);
      result = { score, breakdown, suggestions };
    }

    if (supabase && post_id) {
      await supabase.from('predictive_scores').insert({
        post_id,
        overall_score: result.score,
        breakdown: result.breakdown,
        suggestions: result.suggestions,
      });
    }

    res.json({ ...result, model: usedAI ? 'claude' : 'rules-engine' });
  } catch (err) {
    logger.error('Predictive scoring failed:', err);
    res.status(500).json({ error: 'Scoring failed' });
  }
});

// --------------- Auto-Hashtag Intelligence ---------------

const HASHTAG_DB = {
  coffee: [
    { tag: 'CoffeeLovers', popularity: 'high', reach: '12.5M' },
    { tag: 'MorningBrew', popularity: 'high', reach: '8.2M' },
    { tag: 'SpecialtyCoffee', popularity: 'medium', reach: '3.1M' },
    { tag: 'CoffeeAddict', popularity: 'high', reach: '15M' },
    { tag: 'LocalCoffee', popularity: 'medium', reach: '1.2M' },
    { tag: 'CoffeeTime', popularity: 'high', reach: '18M' },
    { tag: 'BaristLife', popularity: 'medium', reach: '2.8M' },
    { tag: 'CoffeeCulture', popularity: 'medium', reach: '4.5M' },
  ],
  food: [
    { tag: 'Foodie', popularity: 'high', reach: '25M' },
    { tag: 'FoodPhotography', popularity: 'high', reach: '12M' },
    { tag: 'InstaFood', popularity: 'high', reach: '20M' },
    { tag: 'FoodBlogger', popularity: 'medium', reach: '6M' },
    { tag: 'Delicious', popularity: 'high', reach: '15M' },
    { tag: 'HomeCooking', popularity: 'medium', reach: '4M' },
    { tag: 'FoodLover', popularity: 'high', reach: '10M' },
  ],
  cannabis: [
    { tag: 'CannaCommunity', popularity: 'high', reach: '5M' },
    { tag: 'CannabisCulture', popularity: 'high', reach: '8M' },
    { tag: 'WeedLife', popularity: 'high', reach: '7M' },
    { tag: 'CBD', popularity: 'high', reach: '12M' },
    { tag: 'Dispensary', popularity: 'medium', reach: '2M' },
    { tag: 'CannabisBusiness', popularity: 'medium', reach: '1.5M' },
    { tag: 'LegalCannabis', popularity: 'medium', reach: '900K' },
    { tag: 'Indica', popularity: 'medium', reach: '3M' },
    { tag: 'Sativa', popularity: 'medium', reach: '2.5M' },
  ],
  fitness: [
    { tag: 'FitnessMotivation', popularity: 'high', reach: '20M' },
    { tag: 'GymLife', popularity: 'high', reach: '15M' },
    { tag: 'Workout', popularity: 'high', reach: '18M' },
    { tag: 'FitFam', popularity: 'high', reach: '12M' },
    { tag: 'HealthyLifestyle', popularity: 'high', reach: '10M' },
    { tag: 'Training', popularity: 'medium', reach: '5M' },
  ],
  business: [
    { tag: 'Entrepreneur', popularity: 'high', reach: '22M' },
    { tag: 'SmallBusiness', popularity: 'high', reach: '18M' },
    { tag: 'Startup', popularity: 'high', reach: '12M' },
    { tag: 'BusinessTips', popularity: 'medium', reach: '5M' },
    { tag: 'Marketing', popularity: 'high', reach: '15M' },
    { tag: 'GrowYourBusiness', popularity: 'medium', reach: '3M' },
  ],
  lifestyle: [
    { tag: 'LifeStyle', popularity: 'high', reach: '20M' },
    { tag: 'DailyInspiration', popularity: 'medium', reach: '5M' },
    { tag: 'GoodVibes', popularity: 'high', reach: '14M' },
    { tag: 'SelfCare', popularity: 'high', reach: '10M' },
    { tag: 'Mindfulness', popularity: 'medium', reach: '4M' },
    { tag: 'PositiveVibes', popularity: 'high', reach: '8M' },
  ],
  general: [
    { tag: 'InstaGood', popularity: 'high', reach: '50M' },
    { tag: 'PhotoOfTheDay', popularity: 'high', reach: '40M' },
    { tag: 'Love', popularity: 'high', reach: '100M' },
    { tag: 'Trending', popularity: 'high', reach: '15M' },
    { tag: 'Viral', popularity: 'medium', reach: '8M' },
    { tag: 'ContentCreator', popularity: 'high', reach: '12M' },
  ],
};

const CATEGORY_KEYWORDS = {
  coffee: ['coffee', 'espresso', 'latte', 'cappuccino', 'brew', 'roast', 'bean', 'cafe', 'barista'],
  food: ['food', 'eat', 'cook', 'recipe', 'meal', 'restaurant', 'dish', 'cuisine', 'delicious', 'taste'],
  cannabis: ['cannabis', 'weed', 'marijuana', 'thc', 'cbd', 'dispensary', 'strain', 'edible', 'indica', 'sativa'],
  fitness: ['fitness', 'gym', 'workout', 'exercise', 'training', 'muscle', 'health', 'yoga', 'run', 'protein'],
  business: ['business', 'entrepreneur', 'startup', 'marketing', 'brand', 'sales', 'growth', 'profit', 'launch'],
  lifestyle: ['lifestyle', 'wellness', 'selfcare', 'mindful', 'morning', 'routine', 'vibes', 'inspiration'],
};

function detectCategories(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push(category);
    }
  }
  if (found.length === 0) found.push('general');
  return found;
}

router.post('/suggest-hashtags', async (req, res) => {
  try {
    const { caption, platforms, existing_hashtags } = req.body;
    if (!caption) {
      return res.status(400).json({ error: 'Caption is required' });
    }

    let suggestions;
    let usedAI = false;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    if (claudeKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Suggest 10 relevant hashtags for this social media post. Mix popular and niche tags.

Caption: "${caption}"
Platforms: ${platforms?.join(', ') || 'instagram'}
${existing_hashtags?.length ? `Already using: ${existing_hashtags.map((h) => '#' + h).join(' ')}` : ''}

Return ONLY valid JSON:
{"hashtags":[{"tag":"CoffeeLovers","popularity":"high","reach":"12.5M"},{"tag":"LocalBrew","popularity":"medium","reach":"500K"}]}

Popularity: "high" (>5M posts), "medium" (500K-5M), "low" (<500K)`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          suggestions = parsed.hashtags;
          usedAI = true;
        }
      }
    }

    if (!suggestions) {
      const categories = detectCategories(caption);
      const pool = [];
      for (const cat of categories) {
        pool.push(...(HASHTAG_DB[cat] || []));
      }
      pool.push(...HASHTAG_DB.general);

      const existingSet = new Set((existing_hashtags || []).map((h) => h.toLowerCase()));
      const unique = pool.filter((h) => !existingSet.has(h.tag.toLowerCase()));

      const seen = new Set();
      suggestions = [];
      for (const h of unique) {
        const key = h.tag.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push(h);
        }
        if (suggestions.length >= 10) break;
      }
    }

    if (supabase) {
      await supabase.from('ai_generations').insert({
        generation_type: 'hashtags',
        prompt: caption,
        result: { hashtags: suggestions },
        model: usedAI ? 'claude' : 'keyword-matching',
      });
    }

    res.json({ hashtags: suggestions, model: usedAI ? 'claude' : 'keyword-matching' });
  } catch (err) {
    logger.error('Hashtag suggestion failed:', err);
    res.status(500).json({ error: 'Hashtag suggestion failed' });
  }
});

module.exports = router;
