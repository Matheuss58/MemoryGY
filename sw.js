const CACHE_NAME = 'memoria-cores-v2';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Instala o Service Worker e faz cache dos arquivos
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Fazendo cache dos arquivos');
                return cache.addAll(ASSETS);
            })
    );
});

// Ativa e remove caches antigos
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Ativado');
    event.waitUntil(
        caches.keys().then(keys => 
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
});

// Intercepta as requisições e serve do cache, se possível
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
