/* 英語プレゼン発声練習 — Service Worker
   目的：ホーム画面に追加したあと、オフラインでも起動できるようにする。
   方針：アプリ本体だけをキャッシュする。原稿データは localStorage なので触らない。
   更新：index.html を差し替えたら CACHE の版数（v1 → v2 …）を上げてアップロードする。 */
var CACHE = 'pps-v7';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(ASSETS.map(function(u){
        return c.add(new Request(u, {cache:'reload'})).catch(function(){ /* 無いファイルは無視 */ });
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* ネットワーク優先・失敗したらキャッシュ（更新を取りこぼさず、オフラインでも動く） */
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  if(new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || caches.match('./index.html');
      });
    })
  );
});
