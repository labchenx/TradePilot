const STATIC_CACHE = 'tradepilot-static-v1';
const STATIC_ASSETS = ['/', '/dashboard', '/manifest.json'];
const API_PREFIXES = [
  '/api/',
  '/auth/',
  '/dashboard/',
  '/imports/',
  '/portfolio/',
  '/settings/',
  '/market/',
  '/trades/',
  '/cash-flows/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== STATIC_CACHE)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(fetch(request));
    return;
  }

  if (['script', 'style', 'font', 'image'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === 'document') {
    event.respondWith(documentNetworkFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function documentNetworkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match('/dashboard') || (await cache.match('/'));
    if (cached) return cached;

    return new Response(
      '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TradePilot Offline</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:24px;text-align:center}main{max-width:360px}h1{font-size:22px;margin:0 0 12px}p{color:#a3a3a3;line-height:1.6}button{margin-top:20px;border:0;border-radius:10px;background:#10b981;color:#fff;padding:12px 24px;font-weight:700}</style></head><body><main><h1>网络连接不可用</h1><p>TradePilot 无法连接网络。请恢复网络后重新加载页面。</p><button onclick="location.reload()">重新加载</button></main></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
