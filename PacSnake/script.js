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

function startGame() {
    document.title = "PacSnake - Game In Progress";

    document.querySelector('.menu').classList.remove('active');
    document.querySelector('.game-over-menu').classList.remove('active'); // Ocultar Game Over
    document.querySelector('.settings-menu').classList.remove('active');
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

// Configura la velocidad del juego según la dificultad
function setGameSpeed() {
    const speeds = { easy: 5, normal: 15, hard: 35, expert: 60 };
    fps = speeds[difficulty || 'normal']; // Si no hay dificultad definida, usa 'normal'
}

// Genera la comida en una posición aleatoria
function generateFood() {
    return {
        x: Math.floor(Math.random() * (canvas.width / gridSize)),
        y: Math.floor(Math.random() * (canvas.height / gridSize)),
    };
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

// Establece la dificultad del juego
function setDifficulty(level) {
    notificationSound.play().catch(console.error); // Solo notificación
    difficulty = level; // Actualizar la dificultad global
    setGameSpeed(); // Actualizar la velocidad del juego
    showMessage("Difficulty Updated", `Game difficulty set to: ${level}`);
}

// Muestra el menú de configuración
function showSettings() {
    buttonClickSound.play().catch(console.error); // Sonido del botón
    document.querySelector('.menu').classList.remove('active'); // Oculta el menú principal
    document.querySelector('.settings-menu').classList.add('active'); // Muestra el menú de configuración
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
        fps += 1; // Incrementar FPS
        clearInterval(gameInterval);
        gameInterval = setInterval(updateGame, 1000 / fps);
    } else {
        snake.pop();
    }

    snake.unshift(head);

    // Actualizar el estado de la interfaz
    document.getElementById('score').innerText = score;
    document.getElementById('apples').innerText = apples;
    document.getElementById('time').innerText = Math.floor((Date.now() - startTime) / 1000);

    // Actualizar los FPS
    const fpsElement = document.getElementById('fps');
    if (fpsElement) {
        fpsElement.innerText = fps;
    }

    drawGame();
}

// Dibuja el estado actual del juego en el canvas
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(foodTexture, food.x * gridSize, food.y * gridSize, gridSize * iconSize, gridSize * iconSize);
    snake.forEach(segment => ctx.drawImage(pacmanTexture, segment.x * gridSize, segment.y * gridSize, gridSize * iconSize, gridSize * iconSize));
}

function endGame() {
    backgroundMusic.pause();
    if (!isMuted) gameOverSound.play();

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
    if (event.key === 'ArrowUp' && direction.y === 0) direction = { x: 0, y: -1 };
    if (event.key === 'ArrowDown' && direction.y === 0) direction = { x: 0, y: 1 };
    if (event.key === 'ArrowLeft' && direction.x === 0) direction = { x: -1, y: 0 };
    if (event.key === 'ArrowRight' && direction.x === 0) direction = { x: 1, y: 0 };
    if (event.key === 'Escape') {
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
