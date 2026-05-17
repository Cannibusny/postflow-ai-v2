const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const logger = require('../utils/logger');

// --------------- Voice-to-Post (Polish Transcript) ---------------

router.post('/voice-to-post', async (req, res) => {
  try {
    const { transcript, platforms } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    let polished;
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
              content: `Convert this spoken transcript into a polished, professional social media post. Keep the key message but make it engaging, add relevant emojis, and keep it under 280 characters.

Transcript: "${transcript}"
${platforms?.length ? `Target platforms: ${platforms.join(', ')}` : ''}

Return ONLY valid JSON:
{"polished":"the polished post text","hashtag_suggestions":["tag1","tag2","tag3"]}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          polished = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!polished) {
      const cleaned = transcript.trim().replace(/\s+/g, ' ');
      const sentences = cleaned.split(/[.!?]+/).filter((s) => s.trim());
      const mainPoint = sentences[0]?.trim() || cleaned;
      const capitalFirst = mainPoint.charAt(0).toUpperCase() + mainPoint.slice(1);
      const emoji = '📢';

      polished = {
        polished: `${emoji} ${capitalFirst}${capitalFirst.endsWith('!') ? '' : '!'} Stay tuned for more updates 🙌`,
        hashtag_suggestions: ['Update', 'StayTuned', 'NewsFlash'],
      };
    }

    if (supabase) {
      await supabase.from('voice_transcriptions').insert({
        raw_transcript: transcript,
        polished_text: polished.polished,
      });
    }

    res.json({ ...polished, model: claudeKey ? 'claude' : 'demo' });
  } catch (err) {
    logger.error('Voice-to-post failed:', err);
    res.status(500).json({ error: 'Voice processing failed' });
  }
});

// --------------- Competitor Content Cloning ---------------

router.post('/analyze-competitor', async (req, res) => {
  try {
    const { text, url } = req.body;
    const sourceText = text || '';
    if (!sourceText.trim() && !url) {
      return res.status(400).json({ error: 'Competitor post text or URL is required' });
    }

    let analysis;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    if (claudeKey && sourceText.trim()) {
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
              content: `Analyze this competitor's social media post. Then generate a similar post for my brand that's inspired by the structure but uses original content.

Competitor post: "${sourceText}"

Return ONLY valid JSON:
{
  "analysis": {
    "tone": "description of tone",
    "structure": "description of post structure",
    "hooks": ["hook1", "hook2"],
    "cta_pattern": "description of call-to-action",
    "emoji_usage": "how emojis are used",
    "estimated_engagement": "high/medium/low"
  },
  "generated_post": "your brand's version of a similar post",
  "tips": ["tip1", "tip2"]
}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!analysis) {
      const text = sourceText.trim() || 'Sample competitor post content';
      const hasEmojis = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/u.test(text);
      const hasQuestion = /\?/.test(text);
      const hasCTA = /\b(click|shop|visit|link|comment|share|tag|follow|dm|swipe)\b/i.test(text);
      const wordCount = text.split(/\s+/).length;

      analysis = {
        analysis: {
          tone: wordCount > 30 ? 'Informative & detailed' : 'Punchy & concise',
          structure: hasQuestion
            ? 'Opens with question, provides value, ends with CTA'
            : 'Direct statement with supporting detail',
          hooks: [
            text.split(/[.!?]/)[0]?.trim()?.slice(0, 60) || 'Opening hook',
            hasEmojis ? 'Uses emojis for visual appeal' : 'Text-focused, no emojis',
          ],
          cta_pattern: hasCTA ? 'Direct call-to-action detected' : 'Soft/implicit CTA',
          emoji_usage: hasEmojis ? 'Strategic emoji placement' : 'Minimal or no emojis',
          estimated_engagement: hasCTA && hasEmojis ? 'high' : hasCTA || hasEmojis ? 'medium' : 'low',
        },
        generated_post: `🔥 Your brand's take: We're excited to share something special! Check it out and let us know what you think 👇 #YourBrand`,
        tips: [
          'Match the posting time to when your audience is most active',
          'Use a similar structure but add your unique brand voice',
          'Include a stronger call-to-action to drive engagement',
        ],
      };
    }

    if (supabase) {
      await supabase.from('competitor_analyses').insert({
        source_url: url || null,
        source_text: sourceText || null,
        analysis: analysis.analysis,
        generated_post: analysis.generated_post,
      });
    }

    res.json({ ...analysis, model: claudeKey ? 'claude' : 'demo' });
  } catch (err) {
    logger.error('Competitor analysis failed:', err);
    res.status(500).json({ error: 'Competitor analysis failed' });
  }
});

// --------------- Crisis Detection & Sentiment Alert ---------------

const CRISIS_PATTERNS = [
  {
    pattern: /\b(price[s]?\s+(increase|hike|raise|going up|rising)|raising\s+price|more\s+expensive)\b/i,
    category: 'Price Sensitivity',
    severity: 'medium',
    message: 'Mentioning price increases can trigger negative reactions',
    reframe: 'Frame as "investing in quality" or "premium experience" rather than price increase',
  },
  {
    pattern: /\b(layoff|firing|let\s+go|downsizing|restructur|cutting\s+(staff|jobs|positions))\b/i,
    category: 'Employment Sensitivity',
    severity: 'high',
    message: 'Employment changes are highly sensitive topics for social media',
    reframe: 'Consider a formal press release instead. If posting, focus on future growth and opportunities.',
  },
  {
    pattern: /\b(sorry|apolog|mistake|error|our\s+bad|we\s+messed\s+up)\b/i,
    category: 'Public Apology',
    severity: 'medium',
    message: 'Public apologies need careful framing to avoid amplifying the issue',
    reframe: 'Lead with the solution, not the problem. State what you\'re doing to fix it.',
  },
  {
    pattern: /\b(controversial|politic|democrat|republican|election|vote\s+for|protest)\b/i,
    category: 'Political Content',
    severity: 'high',
    message: 'Political content can alienate significant portions of your audience',
    reframe: 'Unless political stance is core to your brand, consider removing political references.',
  },
  {
    pattern: /\b(compet(itor|ition)|vs\.?\s|better\s+than|unlike\s+(them|others|competitor))\b/i,
    category: 'Competitor Comparison',
    severity: 'low',
    message: 'Directly comparing to competitors can appear unprofessional',
    reframe: 'Focus on your unique strengths rather than competitors\' weaknesses.',
  },
  {
    pattern: /\b(closing|shutting\s+down|going\s+out\s+of\s+business|last\s+day)\b/i,
    category: 'Business Closure',
    severity: 'high',
    message: 'Business closure announcements need very careful handling',
    reframe: 'Emphasize gratitude and positive memories. Direct customers to alternative solutions.',
  },
  {
    pattern: /\b(recall|safety\s+issue|defect|warning|hazard|danger)\b/i,
    category: 'Safety/Recall',
    severity: 'high',
    message: 'Safety-related content should go through official channels first',
    reframe: 'Coordinate with legal/PR team. Lead with customer safety commitment and clear action steps.',
  },
];

router.post('/crisis-check', async (req, res) => {
  try {
    const { caption, post_id } = req.body;
    if (!caption) {
      return res.status(400).json({ error: 'Caption text is required' });
    }

    let result;
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
              content: `Analyze this social media post for potential negative sentiment, backlash risk, or crisis triggers. Consider:
1. Could this trigger negative reactions from customers?
2. Could this be misinterpreted?
3. Are there sensitive topics (price changes, layoffs, controversies)?
4. Could this damage brand reputation?

Post: "${caption}"

Return ONLY valid JSON:
{
  "risk_level": "none|low|medium|high",
  "issues": [{"category":"...", "severity":"high|medium|low", "message":"...", "reframe":"suggested reframing"}],
  "reframed_text": "a reframed version of the entire post that avoids the issues",
  "sentiment_score": 0.7
}

sentiment_score: 0.0 = very negative, 0.5 = neutral, 1.0 = very positive`,
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
        }
      }
    }

    if (!result) {
      const issues = [];
      for (const rule of CRISIS_PATTERNS) {
        if (rule.pattern.test(caption)) {
          issues.push({
            category: rule.category,
            severity: rule.severity,
            message: rule.message,
            reframe: rule.reframe,
          });
        }
      }

      const riskLevel =
        issues.some((i) => i.severity === 'high')
          ? 'high'
          : issues.some((i) => i.severity === 'medium')
          ? 'medium'
          : issues.length > 0
          ? 'low'
          : 'none';

      result = {
        risk_level: riskLevel,
        issues,
        reframed_text: issues.length > 0
          ? `✨ ${caption.replace(/price[s]?\s+(increase|hike|going up)/gi, 'premium quality upgrade').replace(/sorry|apolog\w*/gi, 'we appreciate your patience')}`
          : null,
        sentiment_score: riskLevel === 'none' ? 0.8 : riskLevel === 'low' ? 0.5 : riskLevel === 'medium' ? 0.3 : 0.1,
      };
    }

    if (supabase && post_id) {
      await supabase.from('crisis_checks').insert({
        post_id,
        caption_text: caption,
        risk_level: result.risk_level,
        issues: result.issues,
        reframed_text: result.reframed_text,
        action_taken: 'pending',
      });
    }

    res.json({ ...result, model: claudeKey ? 'claude' : 'rules-engine' });
  } catch (err) {
    logger.error('Crisis detection failed:', err);
    res.status(500).json({ error: 'Crisis detection failed' });
  }
});

// --------------- Advanced Analytics: Competitor Tracking ---------------

router.get('/competitors', async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({ competitors: [] });
    }
    const { data, error } = await supabase
      .from('competitor_accounts')
      .select('*, competitor_metrics(*)') 
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ competitors: data || [] });
  } catch (err) {
    logger.error('Fetch competitors failed:', err);
    res.json({ competitors: [] });
  }
});

router.post('/competitors', async (req, res) => {
  try {
    const { platform, handle, display_name } = req.body;
    if (!platform || !handle) {
      return res.status(400).json({ error: 'Platform and handle are required' });
    }
    if (!supabase) {
      return res.json({
        competitor: {
          id: 'demo-' + Date.now(),
          platform,
          handle,
          display_name: display_name || handle,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      });
    }
    const { data, error } = await supabase
      .from('competitor_accounts')
      .insert({ platform, handle, display_name: display_name || handle })
      .select()
      .single();
    if (error) throw error;
    res.json({ competitor: data });
  } catch (err) {
    logger.error('Add competitor failed:', err);
    res.status(500).json({ error: 'Failed to add competitor' });
  }
});

router.delete('/competitors/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.json({ success: true });
    }
    const { error } = await supabase
      .from('competitor_accounts')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete competitor failed:', err);
    res.status(500).json({ error: 'Failed to delete competitor' });
  }
});

module.exports = router;
