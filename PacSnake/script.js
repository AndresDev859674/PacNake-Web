const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const pacmanTexture = new Image();
const foodTexture = new Image();
pacmanTexture.src = './pacman.png';
foodTexture.src = './food.png';
canvas.width = 854;
canvas.height = 480;

// Variables globales
let backgroundMusic, snake, direction, food, score, apples, startTime, gameInterval, isPaused, difficulty, iconSize, fps, isMuted, toggleState;

// Música y sonidos
backgroundMusic = new Audio('./Force.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const buttonClickSound = new Audio('./button-click.mp3');
buttonClickSound.volume = 0.7;

const eatSound = new Audio('./eat.mp3');
eatSound.volume = 0.8;

const gameOverSound = new Audio('./game-over.mp3');
gameOverSound.volume = 0.8;

const notificationSound = new Audio('./notification.mp3');
notificationSound.volume = 0.7;

// Inicialización
isMuted = false;
toggleState = false;

// Partículas
let particles = [];

let foodOpacity = 0; // Control de opacidad de la comida
let foodFadingIn = true; // Flag para saber si está en fade-in

// Función para crear partículas
function createParticles(x, y) {
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 5 + 1,  // Tamaño aleatorio para cada partícula
            speedX: Math.random() * 2 - 1, // Movimiento aleatorio en el eje X
            speedY: Math.random() * 2 - 1, // Movimiento aleatorio en el eje Y
            opacity: Math.random() * 0.5 + 0.5, // Opacidad aleatoria
        });
    }
}

// Función para actualizar las partículas
function updateParticles() {
    particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.opacity -= 0.02; // Reducir opacidad para desaparecer

        // Eliminar partículas cuando su opacidad llegue a cero
        if (particle.opacity <= 0) {
            particles.splice(index, 1);
        }
    });
}

// Función para dibujar las partículas
function drawParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = `rgba(255, 99, 71, ${particle.opacity})`; // Rojo claro (tomato)
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Modificar la función drawFoodWithFade para que use la opacidad correctamente
function drawFoodWithFade(x, y) {
    ctx.globalAlpha = foodOpacity; // Aplica la opacidad
    ctx.drawImage(foodTexture, x * gridSize, y * gridSize, gridSize * iconSize, gridSize * iconSize);
    ctx.globalAlpha = 1; // Resetea la opacidad
}

// Cuando la manzana es comida, reinicia la animación de fade
function onEatFood() {
    createParticles(food.x * gridSize, food.y * gridSize); // Partículas
    food = generateFood();
    foodOpacity = 0; // Resetear opacidad para nuevo fade-in
    foodFadingIn = true;
}


function startGame() {
    document.title = "PacSnake - Game In Progress";

    document.querySelector('.menu').classList.remove('active');
    document.querySelector('.game-over-menu').classList.remove('active'); // Ocultar Game Over
    document.querySelector('.settings-menu').classList.remove('active');
    document.querySelector('.boost-menu').classList.remove('active');
    document.querySelector('.game-container').style.display = 'block';

    if (!isMuted) {
        backgroundMusic.currentTime = 0; // Reinicia la música desde el principio
        backgroundMusic.play();
    }

    // Reiniciar variables del juego
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    food = generateFood();
    score = 0;
    apples = 0;
    isPaused = false;
    startTime = Date.now();
    iconSize = toggleState ? 5.5 : 3.0;

    setGameSpeed();

    // Resetear la pantalla
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    document.getElementById('score').innerText = score;
    document.getElementById('apples').innerText = apples;
    document.getElementById('time').innerText = 0;

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, 1000 / fps);
}

function setGameSpeed() {
    const speeds = { easy: 5, normal: 15, hard: 35, expert: 60 };
    fps = speeds[difficulty || 'normal']; // Si no hay dificultad definida, usa 'normal'
}

function generateFood() {
    let newFoodPosition;
    do {
        newFoodPosition = {
            x: Math.floor(Math.random() * canvas.width / gridSize),
            y: Math.floor(Math.random() * canvas.height / gridSize)
        };
    } while (snake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y));
    return newFoodPosition;
}


function toggleMute() {
    isMuted = !isMuted;
    backgroundMusic.muted = isMuted;

    // Actualizar estilo del botón
    const muteButton = document.getElementById('muteButton');
    if (isMuted) {
        muteButton.innerText = 'Unmute Music';
        muteButton.classList.remove('active');
    } else {
        muteButton.innerText = 'Mute Music';
        muteButton.classList.add('active');
    }
}


// Alterna el tamaño del ícono
function toggleIconSize() {
    toggleState = !toggleState;
    iconSize = toggleState ? 1.5 : 1.0;

    const toggleButton = document.querySelector('.toggle-button button');
    const toggleIcon = document.getElementById('toggleIcon');

    if (toggleState) {
        toggleButton.innerText = 'Toggle ON';
        toggleIcon.innerText = '🟢';
    } else {
        toggleButton.innerText = 'Toggle OFF';
        toggleIcon.innerText = '🔴';
    }

    notificationSound.play().catch(console.error); // Solo notificación
    showMessage("Icon Size Updated", `Icon size set to: ${toggleState ? 'Large' : 'Small'}`);
}

function setDifficulty(level) {
    notificationSound.play().catch(console.error); // Solo notificación
    difficulty = level; // Actualizar la dificultad global
    setGameSpeed(); // Actualizar la velocidad del juego

    // Cambiar la textura de la comida
    if (level === 'easy') {
        foodTexture.src = './food_easy.png';
    } else if (level === 'normal') {
        foodTexture.src = './food.png';
    } else if (level === 'hard') {
        foodTexture.src = './food_demon.png';
    } else if (level === 'expert') {
        foodTexture.src = './food_demon.png';
    }

    // Cambiar la textura de Pac-Man
    if (level === 'easy') {
        pacmanTexture.src = './pacman.png';
    } else if (level === 'normal') {
        pacmanTexture.src = './pacman.png';
    } else if (level === 'hard') {
        pacmanTexture.src = './pacman_hard.png';
    } else if (level === 'expert') {
        pacmanTexture.src = './pacman_expert.png';
    }

    // Cambiar el fondo del juego (actualizando la variable CSS)
    if (level === 'easy') {
        document.documentElement.style.setProperty('--foreground-dark', 'url("./background.jpg")');
    } else if (level === 'normal') {
        document.documentElement.style.setProperty('--foreground-dark', 'url("./background.jpg")');
    } else if (level === 'hard') {
        document.documentElement.style.setProperty('--foreground-dark', 'url("./background_hard.png")');
    } else if (level === 'expert') {
        document.documentElement.style.setProperty('--foreground-dark', 'url("./background_expert.gif")');
    }

    showMessage("Difficulty Updated", `Game difficulty set to: ${level}`);
}

// Muestra el menú de configuración
function showSettings() {
    buttonClickSound.play().catch(console.error); // Sonido del botón
    document.querySelector('.menu').classList.remove('active'); // Oculta el menú principal
    document.querySelector('.settings-menu').classList.add('active'); // Muestra el menú de configuración
}

// Muestra el menú de configuración
function showBoost() {
    buttonClickSound.play().catch(console.error); // Sonido del botón
    document.querySelector('.menu').classList.remove('active'); // Oculta el menú principal
    document.querySelector('.boost-menu').classList.add('active'); // Muestra el menú de configuración
}

function showMenu() {
    document.querySelector('.game-over-menu').classList.remove('active');
    document.querySelector('.pause-menu').classList.remove('active');
    document.querySelector('.game-container').style.display = 'none';
    document.querySelector('.menu').classList.add('active');

    if (!isMuted) {
        backgroundMusic.pause(); // Opcional: detener la música en el menú principal
    }
}

// Regresa al menú principal desde la configuración
function backToMenu() {
    buttonClickSound.play().catch(console.error); // Sonido del botón
    document.querySelector('.menu').classList.add('active');
    document.querySelector('.settings-menu').classList.remove('active');
    document.querySelector('.boost-menu').classList.remove('active');
}

function updateGame() {
    if (isPaused) return;

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Verificar colisión
    if (head.x < 0 || head.y < 0 || head.x * gridSize >= canvas.width || head.y * gridSize >= canvas.height ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    // Comer comida
    if (head.x === food.x && head.y === food.y) {
        if (!isMuted) eatSound.play();
        apples++;
        score += 10;
        food = generateFood();
        foodOpacity = 0; // Resetear opacidad para nuevo fade-in
        foodFadingIn = true;
        createParticles(head.x * gridSize, head.y * gridSize); // Generar partículas
    } else {
        snake.pop();
    }

    snake.unshift(head);

    // Actualizar opacidad de la comida si está en fade-in
    if (foodFadingIn) {
        foodOpacity += 0.05; // Aumenta la opacidad poco a poco
        if (foodOpacity >= 1) {
            foodOpacity = 1;
            foodFadingIn = false; // Detener fade-in
        }
    }

    // Actualizar el estado de la interfaz
    document.getElementById('score').innerText = score;
    document.getElementById('apples').innerText = apples;
    document.getElementById('time').innerText = Math.floor((Date.now() - startTime) / 1000);

    // Actualizar los FPS
    const fpsElement = document.getElementById('fps');
    if (fpsElement) {
        fpsElement.innerText = fps;
    }

    drawGame(); // Llama a drawGame, que ahora dibuja la comida con fade
    updateParticles(); // Actualizar partículas
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibuja la comida con fade-in
    drawFoodWithFade(food.x, food.y);

    // Dibuja las partículas
    drawParticles();

    // Dibuja la serpiente
    snake.forEach(segment => ctx.drawImage(pacmanTexture, segment.x * gridSize, segment.y * gridSize, gridSize * iconSize, gridSize * iconSize));
}

function endGame() {
    backgroundMusic.pause();
    if (!isMuted) gameOverSound.play();

    document.title = "PacSnake - Game";

    clearInterval(gameInterval);

    // Destacar el punto de colisión (posición de la cabeza de la serpiente)
    const head = snake[0]; // La cabeza es el primer elemento
    ctx.fillStyle = 'red'; // Color para el punto de colisión
    ctx.beginPath();
    ctx.arc(
        head.x * gridSize + gridSize / 2, 
        head.y * gridSize + gridSize / 2, 
        gridSize / 2, 
        0, 
        2 * Math.PI
    );
    ctx.fill();

    // Actualizar el menú de Game Over
    document.getElementById('finalScore').innerText = score;
    document.getElementById('finalTime').innerText = Math.floor((Date.now() - startTime) / 1000) + ' s';
    document.getElementById('finalApples').innerText = apples;

    // Mostrar el menú de Game Over
    document.querySelector('.game-over-menu').classList.add('active');
    document.querySelector('.game-container').style.display = 'block';
}


// Controles del teclado
document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase(); // Asegura compatibilidad con mayúsculas y minúsculas

    // Movimiento hacia arriba
    if ((key === 'arrowup' || key === 'w') && direction.y === 0) {
        direction = { x: 0, y: -1 };
    }
    // Movimiento hacia abajo
    if ((key === 'arrowdown' || key === 's') && direction.y === 0) {
        direction = { x: 0, y: 1 };
    }
    // Movimiento hacia la izquierda
    if ((key === 'arrowleft' || key === 'a') && direction.x === 0) {
        direction = { x: -1, y: 0 };
    }
    // Movimiento hacia la derecha
    if ((key === 'arrowright' || key === 'd') && direction.x === 0) {
        direction = { x: 1, y: 0 };
    }
    
    // Pausar el juego con 'Escape'
    if (key === 'escape') {
        togglePause();
    }
});

// Pausa o reanuda el juego
function togglePause() {
    if (isPaused) {
        if (!isMuted) {
            backgroundMusic.play(); // Reanudar música si no está en mute
        }
    } else {
        backgroundMusic.pause(); // Pausar música
    }

    isPaused = !isPaused;
    if (isPaused) {
        document.querySelector('.pause-menu').classList.add('active');
    } else {
        document.querySelector('.pause-menu').classList.remove('active');
    }
}

// Reanuda el juego desde el menú de pausa
function resumeGame() {
    isPaused = false;
    backgroundMusic.play(); // Reanudar música si no está en mute
    document.querySelector('.pause-menu').classList.remove('active');
}

// Función para reiniciar la página (recargar)
function restartPage() {
    buttonClickSound.play().catch(console.error); // Sonido del botón
    location.reload(); // Recarga la página, reiniciando todo el estado del juego
}

// Función para mostrar mensajes temporales en la pantalla
function showMessage(title, message) {
    const messageBox = document.createElement('div');
    messageBox.classList.add('message-box');
    messageBox.innerHTML = `<strong>${title}:</strong> ${message}`;
    
    // Agregar el mensaje a la pantalla
    document.body.appendChild(messageBox);

    // Después de 3 segundos, quitar el mensaje
    setTimeout(() => {
        messageBox.remove();
    }, 3000);
}

function gxDownload() {
    window.location.href = "https://www.opera.com/es/computer/thanks?ni=eapgx&os=windows";
}

function gxInfo() {
    window.location.href = "https://www.opera.com/en/gx";
}

// Alterna el tamaño del ícono
function showEvents() {
    notificationSound.play().catch(console.error); // Solo notificación
    showMessage("Sorry", `There is no event for today. Please come back later.`);
}