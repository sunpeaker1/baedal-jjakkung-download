const crypto = require('crypto');
// admin env refresh 2026-09-24
const { listFeedback, updateFeedbackStatus } = require('./_feedback-store');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(exp, secret) {
  return crypto.createHmac('sha256', secret).update(String(exp)).digest('base64url');
}

function makeToken(secret) {
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  return b64url(String(exp)) + '.' + sign(exp, secret);
}

function verifyToken(token, secret) {
  try {
    const [expEnc, sig] = String(token || '').split('.');
    const exp = Number(Buffer.from(expEnc, 'base64url').toString());
    if (!exp || Date.now() > exp) return false;
    const expected = sign(exp, secret);
    const a = Buffer.from(sig || '');
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function sameSecret(a, b) {
  const x = crypto.createHash('sha256').update(String(a || '')).digest();
  const y = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(x, y);
}

function getBearer(req) {
  const header = String(req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    return res.status(503).json({ ok:false, code:'ADMIN_NOT_CONFIGURED', message:'관리자 비밀번호 설정이 필요합니다.' });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (body.action !== 'login') return res.status(400).json({ ok:false, message:'잘못된 요청입니다.' });
    if (!sameSecret(body.password, secret)) return res.status(401).json({ ok:false, message:'비밀번호가 올바르지 않습니다.' });
    return res.status(200).json({ ok:true, token:makeToken(secret), expiresIn:43200 });
  }

  if (!verifyToken(getBearer(req), secret)) {
    return res.status(401).json({ ok:false, message:'관리자 로그인이 필요합니다.' });
  }

  if (req.method === 'GET') {
    const data = await listFeedback();
    return res.status(200).json({ ok:true, items:data.items, storage:data.storage, persistent:data.persistent });
  }

  if (req.method === 'PATCH') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = String(body.id || '').trim();
    const status = String(body.status || '').trim();
    if (!id || !['unread','reviewed','done'].includes(status)) {
      return res.status(400).json({ ok:false, message:'상태 변경값을 확인해 주세요.' });
    }
    const updated = await updateFeedbackStatus(id,status);
    if (!updated) return res.status(404).json({ ok:false, message:'접수 내용을 찾을 수 없습니다.' });
    return res.status(200).json({ ok:true, item:updated });
  }

  return res.status(405).json({ ok:false, message:'Method not allowed' });
};