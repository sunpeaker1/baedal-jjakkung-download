const { saveFeedback } = require('./_feedback-store');

function emailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

async function sendFeedbackMail(feedback) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_MAIL_TO;
  if (!apiKey || !to) return { sent: false, reason: 'not_configured' };

  const from = process.env.CONTACT_MAIL_FROM || 'Rider Mate <onboarding@resend.dev>';
  const subjectTitle = String(feedback.title || '').replace(/[\r\n]+/g, ' ').slice(0, 80);
  const lines = [
    '[라이더짝꿍 홈페이지 새 문의]',
    '',
    '접수번호: ' + feedback.id,
    '종류: ' + feedback.type,
    '제목: ' + subjectTitle,
    '업체/이름: ' + (feedback.organization || feedback.name || '미입력'),
    '담당자: ' + (feedback.name || '미입력'),
    '연락처: ' + (feedback.contact || '미입력'),
    '접수시각: ' + feedback.createdAt,
    '',
    '내용',
    feedback.body
  ];
  const payload = {
    from,
    to: [to],
    subject: '[라이더짝꿍] ' + feedback.type + ' · ' + subjectTitle,
    text: lines.join('\n')
  };
  if (emailLike(feedback.contact)) payload.reply_to = feedback.contact;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error('mail_notification_failed ' + response.status + ' ' + detail.slice(0, 300));
  }
  return { sent: true };
}

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
    const organization = text(body.organization, 120);
    const name = text(body.name, 80);
    const contact = text(body.contact, 120);
    const website = text(body.website, 120);

    if (website) return res.status(200).json({ ok: true });

    const partnerInvalid = type === '광고·제휴 문의' && (organization.length < 2 || name.length < 2 || contact.length < 4);
    if (!['일반 문의', '오류 제보', '기능 제안', '광고·제휴 문의'].includes(type) || title.length < 2 || content.length < 2 || partnerInvalid) {
      return res.status(400).json({ ok: false, message: '필수 내용을 확인해 주세요.' });
    }

    const now = new Date();
    const id = 'FB-' + now.toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).slice(2,8).toUpperCase();
    const feedback = {
      id,
      type,
      title,
      body: content,
      ...(organization ? { organization } : {}),
      ...(name ? { name } : {}),
      ...(contact ? { contact } : {}),
      status: 'unread',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      userAgent: text(req.headers['user-agent'], 240)
    };

    const stored = await saveFeedback(feedback);

    let mail = { sent: false, reason: 'not_configured' };
    try {
      mail = await sendFeedbackMail(feedback);
    } catch (mailError) {
      console.error('feedback_mail_error', mailError);
      mail = { sent: false, reason: 'send_failed' };
    }

    console.log('RIDER_FEEDBACK', JSON.stringify({...feedback,storage:stored.storage}));
    return res.status(200).json({
      ok: true,
      id,
      message: stored.persistent ? '접수 완료' : '임시 접수 완료',
      persistent: stored.persistent,
      storage: stored.storage,
      mailNotified: mail.sent
    });
  } catch (error) {
    console.error('feedback_submit_error', error);
    return res.status(500).json({ ok: false, message: '접수 중 오류가 발생했습니다.' });
  }
};
