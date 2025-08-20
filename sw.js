const CACHE_NAME = 'corredor-invertido-v1';
// Lista de todos os arquivos que seu jogo precisa para funcionar
const urlsToCache = [
    '/',
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    // Imagens (não esqueça de criar os ícones!)
    'images/rosto.png',
    'images/shuriken.png',
    'images/icon-192.png',
    'images/icon-512.png',
    // Sons
    'sons/pulo.wav',
    'sons/aterrissagem.wav',
    'sons/gameover.wav'
];

// Evento de Instalação: Salva os arquivos no cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Evento de Fetch: Intercepta as requisições
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se o arquivo estiver no cache, retorna ele.
                if (response) {
                    return response;
                }
                // Senão, busca na rede.
                return fetch(event.request);
            })
    );
});
