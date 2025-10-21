const CACHE_NAME = 'money-tracker-v4';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('캐시 열기');
                return cache.addAll(urlsToCache);
            })
    );
});

// 페치 이벤트 - 캐시 우회하고 항상 네트워크에서 가져오기
self.addEventListener('fetch', (event) => {
    // CSS, JS 파일은 항상 네트워크에서 가져오기
    if (event.request.url.includes('.css') || 
        event.request.url.includes('.js') || 
        event.request.url.includes('?v=')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    // 다른 파일들은 캐시 사용
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('이전 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});