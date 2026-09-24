const { saveFeedback } = require('./_feedback-store');

const ALLOWED_ORIGINS = new Set([
  'https://sunpeaker1.github.io',
  'https://baedal-jjakkung-download.vercel.app'
]);

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
}

function text(value, max) {
  return String(value || '').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const type = text(body.type, 20);
    const title = text(body.title, 80);
    const content = text(body.body, 3000);
    const website = text(body.website, 120);

    if (website) return res.status(200).json({ ok: true });

    if (!['오류 제보', '기능 제안'].includes(type) || title.length < 2 || content.length < 2) {
      return res.status(400).json({ ok: false, message: '필수 내용을 확인해 주세요.' });
    }

    const now = new Date();
    const id = 'FB-' + now.toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).slice(2,8).toUpperCase();
    const feedback = {
      id,
      type,
      title,
      body: content,
      status: 'unread',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      userAgent: text(req.headers['user-agent'], 240)
    };

    const stored = await saveFeedback(feedback);

    console.log('RIDER_FEEDBACK', JSON.stringify({...feedback,storage:stored.storage}));
    return res.status(200).json({
      ok: true,
      id,
      message: stored.persistent ? '접수 완료' : '임시 접수 완료',
      persistent: stored.persistent,
      storage: stored.storage
    });
  } catch (error) {
    console.error('feedback_submit_error', error);
    return res.status(500).json({ ok: false, message: '접수 중 오류가 발생했습니다.' });
  }
};
