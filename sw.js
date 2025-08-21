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
    'sons/pulo.mp3',
    'sons/aterrissagem.mp3',
    'sons/gameover.mp3',
    //---vídeo---
    'videos/vitoria.mp4',
    //---ícones---
'icons/android/android-launchericon-48-48.png',
'icons/android/android-launchericon-72-72.png',
'icons/android/android-launchericon-96-96.png',
'icons/android/android-launchericon-144-144.png',
'icons/android/android-launchericon-192-192.png',
'icons/android/android-launchericon-512-512.png',
'icons/ios/16.png',
'icons/ios/20.png',
'icons/ios/29.png',
'icons/ios/32.png',
'icons/ios/40.png',
'icons/ios/50.png',
'icons/ios/57.png',
'icons/ios/58.png',
'icons/ios/60.png',
'icons/ios/64.png',
'icons/ios/72.png',
'icons/ios/76.png',
'icons/ios/80.png',
'icons/ios/87.png',
'icons/ios/100.png',
'icons/ios/114.png',
'icons/ios/120.png',
'icons/ios/128.png',
'icons/ios/144.png',
'icons/ios/152.png',
'icons/ios/167.png',
'icons/ios/180.png',
'icons/ios/192.png',
'icons/ios/256.png',
'icons/ios/512.png',
'icons/ios/1024.png',
    
];

// Evento de Instalação: Salva os arquivos no cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto, adicionando arquivos');
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
