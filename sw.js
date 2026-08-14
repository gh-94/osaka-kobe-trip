// 오사카·고베 여행 trip.html 오프라인 캐시용 서비스워커 (버튼 트리거 방식)
const CACHE_NAME = 'osaka-kobe-trip-v24';

// 필수 파일 — 하나라도 실패하면 설치가 중단됨(그래야 "저장 실패"를 정확히 알 수 있음)
const CRITICAL_URLS = [
  './trip.html',
  './00_trip_index_checklist.md',
  './context_osaka.md',
  './day1_osaka_master.md',
  './day2_osaka_master.md',
  './day3_kobe_master.md',
  './day4_kobe_master.md',
  './japanese_phrases.md'
];

// 선택 파일 — 지도·플래너·외부 CDN. 실패해도 무시(핵심 문서 저장은 보장됨)
const OPTIONAL_URLS = [
  './index.html',
  './day1_planner.html',
  './day2_planner.html',
  './day3_planner.html',
  './day4_planner.html',
  'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(CRITICAL_URLS);
      await Promise.all(
        OPTIONAL_URLS.map((url) => cache.add(url).catch(() => {}))
      );
      return true;
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          return response;
        })
        .catch(() => cached);
    })
  );
});
