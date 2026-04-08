const CACHE_NAME = 'kim-secretary-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 정적 자산 캐싱 중...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('⚠️ 일부 자산 캐싱 실패:', err);
      });
    })
  );
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 활성화됨');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 처리 (Network First 전략)
self.addEventListener('fetch', (event) => {
  // GET 요청만 처리
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공한 응답을 캐시에 저장
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // 캐시에도 없으면 오프라인 페이지 반환
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          return new Response('오프라인 상태입니다.', { status: 503 });
        });
      })
  );
});

// 백그라운드 싱크 (선택사항)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('🔄 백그라운드 동기화 수행 중...');
  }
});

console.log('Service Worker 로드됨');
