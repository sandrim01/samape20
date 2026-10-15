// ============================================================================
// SAMAPE 2.0 - SERVICE WORKER OFFLINE FIRST (PWA)
// Estratégia Network-First com Cache Fallback para permitir uso sem sinal
// ============================================================================

const CACHE_NAME = 'samape-offline-v4';

const APP_SHELL = [
  '/',
  '/index.html',
  '/portal-maquina.html',
  '/styles.css',
  '/api-client.js',
  '/offline-manager.js',
  '/jsqr.min.js',
  '/qr-scanner.js',
  '/whatsapp-helper.js',
  '/os-modal.js',
  '/listagem-pecas-modal.js',
  '/preventivas.js',
  '/app.js',
  '/manifest.json',
  '/favicon.png',
  '/resources/logonova2.png',
  '/resources/favicon.png',
  '/resources/favicon-32x32.png',
  '/resources/favicon-16x16.png',
  '/resources/apple-touch-icon.png',
  '/resources/android-chrome-192x192.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('📦 PWA: Cacheando App Shell para operação offline...');
      for (const item of APP_SHELL) {
        try {
          await cache.add(item);
        } catch (err) {
          console.warn('⚠️ Não foi possível pré-cachear:', item, err.message);
        }
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 PWA: Removendo cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Requisições para a API: Não cachear estaticamente; deixar o api-client lidar com a fila offline
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(event.request).catch(err => {
        return new Response(JSON.stringify({
          success: false,
          isOffline: true,
          message: 'Sem conexão com a internet (Offline)'
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Apenas interceptar requisições GET para o App Shell
  if (event.request.method !== 'GET') {
    return;
  }

  // Arquivos estáticos (HTML, JS, CSS, Imagens): Network First -> Fallback para Cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta for bem-sucedida, atualiza o cache em segundo plano
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            // Salva a requisição completa e também o pathname sem parâmetros de busca (?v=...)
            cache.put(event.request, responseToCache.clone());
            if (url.search) {
              cache.put(url.pathname, responseToCache);
            }
          });
        }
        return response;
      })
      .catch(async () => {
        // Se a rede falhar (ex: Modo Avião / Campo sem sinal / Offline no DevTools), entrega do cache
        // Busca em todos os caches disponíveis
        let cached = await caches.match(event.request, { ignoreSearch: true });
        if (cached) return cached;

        // 2. Tenta pelo pathname limpo (ex: /api-client.js)
        cached = await caches.match(url.pathname, { ignoreSearch: true });
        if (cached) return cached;

        // 3. Se for navegação de página e falhou, entrega o index.html do cache
        if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
          const indexCached = await caches.match('/index.html', { ignoreSearch: true }) || await caches.match('/', { ignoreSearch: true });
          if (indexCached) return indexCached;
        }

        console.warn('⚠️ Offline: recurso estático não encontrado no cache:', event.request.url);
        return new Response('Offline e recurso não encontrado no cache', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});
