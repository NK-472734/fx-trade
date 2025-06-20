// service-worker.js (今回はPWA認識のためだけに存在)
// キャッシュ戦略などを本格的に実装しない場合、このファイルは空でも問題ありません。
// ただし、ファイルが存在し、登録されることが重要です。

// もしオフライン対応を本格的にしたい場合は、ここにキャッシュのロジックを追加します。
/*
const CACHE_NAME = 'fx-calendar-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://widget.oanda.jp/images/instruments/usdjpy.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
*/