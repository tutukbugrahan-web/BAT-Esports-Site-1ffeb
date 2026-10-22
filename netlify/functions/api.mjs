import { getStore } from '@netlify/blobs';
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';

const COOKIE = 'bat_admin_session';
const TTL = 8 * 60 * 60;
const DEFAULT = {
  settings: {
    title: 'BORN IN DARKNESS. BUILT TO RULE.',
    description: 'Sadece oyuna girmiyoruz. Bir iz bırakmak için sahnedeyiz. BAT Esports — disiplin, takım ruhu ve rekabet tutkusu.'
  },
  socials: { instagram: '', tiktok: '', youtube: '', discord: '' },
  roster: [], staff: [], news: [], achievements: [], store: []
};

// Use explicit Netlify Function routes instead of relying on path-splat rewrites.
const routeConfig = {
  path: [
    '/api/health',
    '/api/login',
    '/api/logout',
    '/api/me',
    '/api/data',
    '/api/applications',
    '/api/applications/:id'
  ]
};

function json(status, data, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers
    }
  });
}

function env(name) {
  return process.env[name] || '';
}
function sessionSecret() {
  return env('BAT_SESSION_SECRET') || env('BAT_ADMIN_INITIAL_PASSWORD');
}
function sign(payload) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}
function makeToken(username) {
  const payload = Buffer.from(JSON.stringify({
    u: username,
    exp: Math.floor(Date.now() / 1000) + TTL
  })).toString('base64url');
  return payload + '.' + sign(payload);
}
function currentUser(request) {
  const cookies = request.headers.get('cookie') || '';
  const token = cookies.split(';').map(v => v.trim())
    .find(v => v.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  if (!token || !sessionSecret()) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const received = Buffer.from(signature);
  const expected = Buffer.from(sign(payload));
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return parsed.exp > Date.now() / 1000 ? parsed.u : null;
  } catch {
    return null;
  }
}
function equalSecret(received, expected) {
  const a = Buffer.from(String(received ?? ''));
  const b = Buffer.from(String(expected ?? ''));
  return a.length === b.length && timingSafeEqual(a, b);
}
function normalize(value) {
  const data = { ...structuredClone(DEFAULT), ...(value && typeof value === 'object' ? value : {}) };
  data.settings = { ...DEFAULT.settings, ...(data.settings || {}) };
  data.socials = { ...DEFAULT.socials, ...(data.socials || {}) };
  for (const key of ['roster', 'staff', 'news', 'achievements', 'store']) {
    if (!Array.isArray(data[key])) data[key] = [];
  }
  return data;
}
const store = () => getStore('bat-esports-site');
async function read(key, fallback) {
  const value = await store().get(key, { type: 'text' });
  if (!value) return structuredClone(fallback);
  try { return JSON.parse(value); } catch { return structuredClone(fallback); }
}
async function write(key, value) {
  await store().set(key, JSON.stringify(value));
}
async function requestBody(request) {
  try { return await request.json(); } catch { return null; }
}

async function handler(request) {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  try {
    if (method === 'GET' && path === '/api/health') {
      return json(200, { ok: true, service: 'BAT Esports API' });
    }

    if (method === 'POST' && path === '/api/login') {
      const username = env('BAT_ADMIN_USERNAME') || 'batadmin';
      const password = env('BAT_ADMIN_INITIAL_PASSWORD');
      if (!password || !sessionSecret()) {
        return json(503, { error: 'Yönetici hesabı yapılandırılmamış. Netlify ortam değişkenlerini ve Functions kapsamını kontrol edin.' });
      }
      const input = await requestBody(request);
      if (!input) return json(400, { error: 'Giriş bilgileri okunamadı.' });
      if (!equalSecret(input.username, username) || !equalSecret(input.password, password)) {
        return json(401, { error: 'Kullanıcı adı veya şifre hatalı. Netlify değişkenlerini ve yazımı kontrol edin.' });
      }
      return json(200, { ok: true, username }, {
        'set-cookie': COOKIE + '=' + makeToken(username) + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + TTL
      });
    }

    if (method === 'POST' && path === '/api/logout') {
      return json(200, { ok: true }, {
        'set-cookie': COOKIE + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
      });
    }

    if (method === 'GET' && path === '/api/me') {
      const username = currentUser(request);
      return username ? json(200, { ok: true, username }) : json(401, { error: 'Oturum açılmamış.' });
    }

    if (method === 'GET' && path === '/api/data') {
      return json(200, normalize(await read('site-content.json', DEFAULT)));
    }

    if (method === 'POST' && path === '/api/data') {
      if (!currentUser(request)) return json(401, { error: 'Yönetici girişi gerekli.' });
      const input = await requestBody(request);
      if (!input) return json(400, { error: 'İçerik biçimi geçersiz.' });
      const data = normalize(input);
      if (Buffer.byteLength(JSON.stringify(data)) > 5_000_000) {
        return json(413, { error: 'İçerik çok büyük; görselleri küçültün.' });
      }
      await write('site-content.json', data);
      return json(200, { ok: true, savedAt: new Date().toISOString() });
    }

    if (path === '/api/applications' && method === 'POST') {
      const input = await requestBody(request);
      if (!input) return json(400, { error: 'Başvuru bilgileri okunamadı.' });
      const name = String(input.name || '').trim().slice(0, 70);
      const contact = String(input.contact || '').trim().slice(0, 100);
      const about = String(input.about || '').trim().slice(0, 1200);
      if (!name || !contact || !about) return json(400, { error: 'Zorunlu alanları doldurun.' });
      const applications = await read('applications.json', []);
      if (!Array.isArray(applications)) return json(500, { error: 'Başvuru kayıtları okunamadı.' });
      if (applications.length >= 500) return json(429, { error: 'Başvuru kutusu dolu.' });
      const application = {
        id: randomUUID(),
        name,
        contact,
        about,
        age: String(input.age || '').slice(0, 3),
        role: String(input.role || '').slice(0, 40),
        gameId: String(input.gameId || '').slice(0, 30),
        createdAt: new Date().toISOString()
      };
      applications.push(application);
      await write('applications.json', applications);
      return json(201, { ok: true, id: application.id });
    }

    if (path === '/api/applications' && method === 'GET') {
      if (!currentUser(request)) return json(401, { error: 'Yönetici girişi gerekli.' });
      return json(200, { applications: await read('applications.json', []) });
    }

    const applicationMatch = path.match(/^\/api\/applications\/([a-f0-9-]+)$/i);
    if (applicationMatch && method === 'DELETE') {
      if (!currentUser(request)) return json(401, { error: 'Yönetici girişi gerekli.' });
      const applications = await read('applications.json', []);
      await write('applications.json', Array.isArray(applications)
        ? applications.filter(item => item.id !== applicationMatch[1])
        : []);
      return json(200, { ok: true });
    }

    return json(404, { error: 'API yolu bulunamadı.' });
  } catch (error) {
    console.error('BAT API error:', error?.message || error);
    return json(500, { error: 'Sunucu hatası oluştu. Netlify Functions loglarını kontrol edin.' });
  }
}

// Explicit Fetchable Module format for the current Netlify Functions runtime.
export default {
  fetch: handler,
  config: routeConfig
};
