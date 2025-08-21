// --- ELEMENTOS DO JOGO ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameUi = document.getElementById('game-ui');
const highscoreDisplay = document.getElementById('highscore-display');
const backgroundVideo = document.getElementById('background-video');

// --- EFEITOS SONOROS ---
const puloSound = document.getElementById('pulo-sound');
const aterrissagemSound = document.getElementById('aterrissagem-sound');
const gameoverSound = document.getElementById('gameover-sound');
const vitoriaSound = document.getElementById('vitoria-sound');

// --- CARREGAMENTO DE IMAGENS ---
const playerImage = new Image();
playerImage.src = 'images/rosto.png';
const shurikenImage = new Image();
shurikenImage.src = 'images/shuriken.png';

// --- CONSTANTES ---
const GRAVITY = 0.45;
const JUMP_STRENGTH = -12;
const POINTS_PER_DODGE = 50;
const ANIMATION_SPEED = 18;
const INITIAL_GAME_SPEED = 5;
const GAME_SPEED_INCREASE = 0.001;
const MAX_PARTICLES = 100;

// --- VARIÁVEIS DE ESTADO ---
let score = 0;
let frameCount = 0;
let gameState = 'start';
let obstacles = [];
let clouds = [];
const particlePool = [];
let gameSpeed = INITIAL_GAME_SPEED;
let obstacleSpawnTimer = 0;
let wasGrounded = true;
let lastTime = performance.now();
let victoryMilestone = 0;

// --- SISTEMA DE RECORDE ---
let highscore = localStorage.getItem('corredorInvertidoHighscore') || 0;
highscoreDisplay.textContent = `Recorde: ${highscore}`;

// --- CICLO DIA/NOITE ---
const colors = {
    day:          { sky1: '#87CEEB', ground: '#228B22', sun: '#FFD700' },
    afternoon:    { sky1: '#5F9EA0', ground: '#2E8B57', sun: '#FFD700' }, // NOVO! Tarde
    dusk:         { sky1: '#FFA07A', ground: '#2F4F4F', sun: '#FFD700' },
    sunset:       { sky1: '#FF4500', ground: '#2F4F4F', sun: '#FF4500' },
    twilight:     { sky1: '#483D8B', ground: '#006400', sun: '#F0E68C' },
    late_night:   { sky1: '#2c2a65', ground: '#004d00', sun: '#F0E68C' }, // NOVO! Anoitecer Profundo
    night:        { sky1: '#191970', ground: '#003300', sun: '#F0E68C' },
    deep_dawn:    { sky1: '#2c2a65', ground: '#2c3e50', sun: '#F0E68C' }, // NOVO! Madrugada Profunda
    predawn:      { sky1: '#483D8B', ground: '#4682B4', sun: '#F0E68C' },
    sunrise:      { sky1: '#FF69B4', ground: '#4682B4', sun: '#FFD700' },
    morning:      { sky1: '#ADD8E6', ground: '#228B22', sun: '#FFD700' },
    late_morning: { sky1: '#A1DAF0', ground: '#228B22', sun: '#FFD700' }, // NOVO! Fim da Manhã
};

function lerpColor(a, b, amount) {
    const ar = a >> 16, ag = a >> 8 & 0xff, ab = a & 0xff,
          br = b >> 16, bg = b >> 8 & 0xff, bb = b & 0xff,
          rr = ar + amount * (br - ar),
          rg = ag + amount * (bg - ag),
          rb = ab + amount * (bb - ab);
    return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1).split('.')[0]}`;
}

function hexToRgbInt(hex) {
    return parseInt(hex.slice(1), 16);
}

function getCycleColors(score) {
    const cycleLength = 200; // Duração de cada uma das 12 fases
    const progress = (score % cycleLength) / cycleLength;
    // Agora o ciclo se repete a cada 12 fases
    const cycleIndex = Math.floor(score / cycleLength);

    let fromColors, toColors;
    if (cycleIndex % 12 === 0) { fromColors = colors.day; toColors = colors.afternoon; }
    else if (cycleIndex % 12 === 1) { fromColors = colors.afternoon; toColors = colors.dusk; }
    else if (cycleIndex % 12 === 2) { fromColors = colors.dusk; toColors = colors.sunset; }
    else if (cycleIndex % 12 === 3) { fromColors = colors.sunset; toColors = colors.twilight; }
    else if (cycleIndex % 12 === 4) { fromColors = colors.twilight; toColors = colors.late_night; }
    else if (cycleIndex % 12 === 5) { fromColors = colors.late_night; toColors = colors.night; }
    else if (cycleIndex % 12 === 6) { fromColors = colors.night; toColors = colors.deep_dawn; }
    else if (cycleIndex % 12 === 7) { fromColors = colors.deep_dawn; toColors = colors.predawn; }
    else if (cycleIndex % 12 === 8) { fromColors = colors.predawn; toColors = colors.sunrise; }
    else if (cycleIndex % 12 === 9) { fromColors = colors.sunrise; toColors = colors.morning; }
    else if (cycleIndex % 12 === 10) { fromColors = colors.morning; toColors = colors.late_morning; }
    else { fromColors = colors.late_morning; toColors = colors.day; }

    // O resto da função que calcula as cores continua exatamente igual
    const fromSky1 = hexToRgbInt(fromColors.sky1);
    const toSky1 = hexToRgbInt(toColors.sky1);
    const fromGround = hexToRgbInt(fromColors.ground);
    const toGround = hexToRgbInt(toColors.ground);
    const fromSun = hexToRgbInt(fromColors.sun);
    const toSun = hexToRgbInt(toColors.sun);

    return {
        sky: lerpColor(fromSky1, toSky1, progress),
        ground: lerpColor(fromGround, toGround, progress),
        sun: lerpColor(fromSun, toSun, progress),
    };
}
// --- DESENHO DO CENÁRIO ---
function drawScenery() {
    const currentColors = getCycleColors(score);
    ctx.fillStyle = currentColors.sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = currentColors.sun;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 80, 50, 0, Math.PI * 2);
    ctx.fill();
    const groundHeight = 40;
    ctx.fillStyle = currentColors.ground;
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - groundHeight - 10, canvas.width, 10);
}

// --- NUVENS ---
class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * 200;
        this.y = 50 + Math.random() * 150;
        this.speed = Math.random() * 0.5 + 0.2;
        this.circles = [
            { xOffset: 0, yOffset: 0, radius: Math.random() * 15 + 20 },
            { xOffset: 30, yOffset: 10, radius: Math.random() * 15 + 25 },
            { xOffset: 60, yOffset: 0, radius: Math.random() * 15 + 20 },
            { xOffset: 25, yOffset: -10, radius: Math.random() * 15 + 20 }
        ];
    }
    update(deltaTime) {
        this.x -= this.speed * 60 * deltaTime;
    }
    draw() {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        this.circles.forEach(circle => {
            ctx.moveTo(this.x + circle.xOffset, this.y + circle.yOffset);
            ctx.arc(this.x + circle.xOffset, this.y + circle.yOffset, circle.radius, 0, Math.PI * 2);
        });
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

// --- PARTÍCULAS (COM OBJECT POOLING) ---
class Particle {
    constructor() {
        this.active = false;
    }
    reset(x, y) {
        this.active = true;
        this.x = x; this.y = y; this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = Math.random() * -2 - 1;
        this.lifespan = 50;
    }
    update(deltaTime) {
        if (!this.active) return;
        this.x += this.speedX * 60 * deltaTime;
        this.y += this.speedY * 60 * deltaTime;
        this.lifespan -= 60 * deltaTime;
        if (this.lifespan <= 0) {
            this.active = false;
        }
    }
    draw() {
        if (!this.active) return;
        ctx.fillStyle = `rgba(222, 184, 135, ${this.lifespan / 50})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticlePool() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
        particlePool.push(new Particle());
    }
}

function createLandingDust() {
    aterrissagemSound.currentTime = 0;
    aterrissagemSound.play();
    let count = 10;
    for (let i = 0; i < particlePool.length; i++) {
        if (!particlePool[i].active) {
            particlePool[i].reset(player.x + player.width / 2, player.y + player.height);
            count--;
        }
        if (count <= 0) break;
    }
}

// --- OBSTÁCULOS (Shuriken e Cerca) ---
class Shuriken {
    constructor() {
        this.type = 'shuriken';
        this.size = 35; this.x = canvas.width; this.rotation = 0; this.scored = false;
        const groundLevel = canvas.height - 40;
        this.y = groundLevel - this.size - (Math.random() * 150);
    }
    draw() {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        if (shurikenImage.complete) {
            ctx.drawImage(shurikenImage, -this.size / 2, -this.size / 2, this.size, this.size);
        }
        ctx.restore();
    }
    update(deltaTime) {
        this.x -= gameSpeed * 60 * deltaTime;
        this.rotation += 0.15 * 60 * deltaTime;
    }
}

class Fence {
    constructor() {
        this.type = 'fence';
        this.width = 40; this.height = 50; this.x = canvas.width; this.scored = false;
        this.y = canvas.height - 40 - this.height;
    }
    draw() {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, 10, this.height);
        ctx.fillRect(this.x + this.width - 10, this.y, 10, this.height);
        ctx.fillRect(this.x, this.y + 10, this.width, 8);
        ctx.fillRect(this.x, this.y + 30, this.width, 8);
    }
    update(deltaTime) {
        this.x -= gameSpeed * 60 * deltaTime;
    }
}

// --- JOGADOR ---
const player = {
    x: 150, y: 50, width: 40, height: 60, velocityY: 0, isGrounded: true,
    draw: function() {
        const headSize = 30;
        const headX = this.x + (this.width / 2) - (headSize / 2);
        const headY = this.y;
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.beginPath();
        const currentFrame = Math.floor(frameCount / ANIMATION_SPEED) % 2;
        ctx.moveTo(this.x + this.width / 2, headY + headSize - 5);
        ctx.lineTo(this.x + this.width / 2, this.y + 40);
        if (currentFrame === 0) {
            ctx.moveTo(this.x + this.width / 2, this.y + 30); ctx.lineTo(this.x + this.width, this.y + 20);
            ctx.moveTo(this.x + this.width / 2, this.y + 30); ctx.lineTo(this.x, this.y + 40);
            ctx.moveTo(this.x + this.width / 2, this.y + 40); ctx.lineTo(this.x + this.width, this.y + 60);
            ctx.moveTo(this.x + this.width / 2, this.y + 40); ctx.lineTo(this.x, this.y + 50);
        } else {
            ctx.moveTo(this.x + this.width / 2, this.y + 30); ctx.lineTo(this.x, this.y + 20);
            ctx.moveTo(this.x + this.width / 2, this.y + 30); ctx.lineTo(this.x + this.width, this.y + 40);
            ctx.moveTo(this.x + this.width / 2, this.y + 40); ctx.lineTo(this.x, this.y + 60);
            ctx.moveTo(this.x + this.width / 2, this.y + 40); ctx.lineTo(this.x + this.width, this.y + 50);
        }
        ctx.stroke();
        if (playerImage.complete) {
            ctx.save();
            ctx.translate(headX + headSize / 2, headY + headSize / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(playerImage, -headSize / 2, -headSize / 2, headSize, headSize);
            ctx.restore();
        }
    },
    update: function(deltaTime) {
        this.velocityY += GRAVITY * 60 * deltaTime;
        this.y += this.velocityY * 60 * deltaTime;
        wasGrounded = this.isGrounded;
        if (this.y + this.height > canvas.height - 40) {
            this.y = canvas.height - 40 - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
            if (!wasGrounded) createLandingDust();
        } else {
            this.isGrounded = false;
        }
    }
};

// --- LÓGICA PRINCIPAL DO JOGO ---
function playVictorySequence() {
    backgroundVideo.style.visibility = 'visible';
    backgroundVideo.style.opacity = '0.5';
    backgroundVideo.currentTime = 0;
    vitoriaSound.currentTime = 0;
    backgroundVideo.play();
    vitoriaSound.play();
}

function spawnElements(deltaTime) {
    let spawnInterval = 150 - (gameSpeed * 10);
    if (spawnInterval < 60) spawnInterval = 60;
    
    if (obstacleSpawnTimer > spawnInterval) {
        if (Math.random() > 0.4) {
            obstacles.push(new Shuriken());
        } else {
            obstacles.push(new Fence());
        }
        obstacleSpawnTimer = 0;
    } else {
        obstacleSpawnTimer += 60 * deltaTime;
    }
    if (frameCount % 150 === 0 && clouds.length < 5) {
        clouds.push(new Cloud());
    }
}

function handleCollisions() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        let collision = false;
        const obsWidth = obs.size || obs.width;
        const obsHeight = obs.size || obs.height;
        collision = (player.x < obs.x + obsWidth && player.x + player.width > obs.x && player.y < obs.y + obsHeight && player.y + player.height > obs.y);

        if (collision) {
            gameState = 'gameOver';
            gameoverSound.play();
            if (score > highscore) {
                highscore = Math.floor(score);
                localStorage.setItem('corredorInvertidoHighscore', highscore);
                highscoreDisplay.textContent = `Recorde: ${highscore}`;
            }
        }

        if (!obs.scored && obs.x + obsWidth < player.x) {
            score += POINTS_PER_DODGE;
            obs.scored = true;
        }
        if (obs.x + obsWidth < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function updateGameLogic(deltaTime) {
    score += 1 * deltaTime;
    gameSpeed += GAME_SPEED_INCREASE * deltaTime;
    scoreElement.textContent = Math.floor(score);
    frameCount++;

    if (Math.floor(score / 500) > victoryMilestone) {
        victoryMilestone = Math.floor(score / 500);
        playVictorySequence();
    }
}

function resetGame() {
    score = 0;
    gameSpeed = INITIAL_GAME_SPEED;
    obstacles = [];
    clouds = [];
    particlePool.forEach(p => p.active = false);
    player.y = canvas.height - 40 - player.height;
    player.velocityY = 0;
    player.isGrounded = true;
    obstacleSpawnTimer = 0;
    lastTime = performance.now();
    victoryMilestone = 0;

    backgroundVideo.style.opacity = '0';
    backgroundVideo.style.visibility = 'hidden';
    backgroundVideo.pause();
    vitoriaSound.pause();
}

function gameLoop() {
    const now = performance.now();
    const deltaTime = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    if (gameState === 'playing') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawScenery();
        
        clouds.forEach(c => { c.update(deltaTime); c.draw(); });
        
        particlePool.forEach(p => { 
            p.update(deltaTime);
            p.draw();
        });

        player.update(deltaTime);
        player.draw();
        
        spawnElements(deltaTime);
        obstacles.forEach(obs => { 
            obs.update(deltaTime);
            obs.draw(); 
        });
        handleCollisions();
        
        updateGameLogic(deltaTime);
    } else if (gameState === 'gameOver') {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '50px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('FIM DE JOGO', 0, -20);
        ctx.font = '20px Courier New';
        ctx.fillText(`Pontuação: ${Math.floor(score)}`, 0, 20);
        ctx.fillText('Clique para reiniciar', 0, 60);
        ctx.restore();
    }
    
    requestAnimationFrame(gameLoop);
}

// --- CONTROLES E INÍCIO ---
function handleAction() {
    if (gameState === 'playing' && player.isGrounded) {
        player.velocityY = JUMP_STRENGTH;
        puloSound.currentTime = 0;
        puloSound.play();
    } else if (gameState === 'gameOver') {
        resetGame();
        gameState = 'playing';
    }
}

startButton.addEventListener('click', () => {
    puloSound.play().catch(e => {});
    puloSound.pause();
    aterrissagemSound.play().catch(e => {});
    aterrissagemSound.pause();
    gameoverSound.play().catch(e => {});
    gameoverSound.pause();
    vitoriaSound.play().catch(e => {});
    vitoriaSound.pause();

    startScreen.style.display = 'none';
    gameUi.style.display = 'block';
    resetGame();
    gameState = 'playing';
});

backgroundVideo.addEventListener('ended', () => {
    backgroundVideo.style.opacity = '0';
    setTimeout(() => {
        backgroundVideo.style.visibility = 'hidden';
    }, 500);

    vitoriaSound.pause();
    vitoriaSound.currentTime = 0;
});

document.addEventListener('keydown', (e) => { if (e.code === 'Space') handleAction(); });
canvas.addEventListener('mousedown', handleAction);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleAction(); });

// --- INÍCIO DO JOGO ---
initParticlePool();
gameLoop();
