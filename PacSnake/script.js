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
backgroundMusic = new Audio('./Background.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const buttonClickSound = new Audio('./button-click.mp3');
buttonClickSound.volume = 0.7;

const eatSound = new Audio('./eat.mp3');
eatSound.volume = 0.8;

const gameOverSound = new Audio('./game-over.mp3');
gameOverSound.volume = 0.8;

// Inicialización
isMuted = false;
toggleState = false;

// Inicia el juego
function startGame() {
    document.title = "PacSnake - Game In Progress";
  
    document.querySelector('.menu').classList.remove('active');
    document.querySelector('.game-over-menu').classList.remove('active');
    document.querySelector('.settings-menu').classList.remove('active');
    document.querySelector('.game-container').style.display = 'block';

    // Reproducir la música si no está en mute
    if (!isMuted) {
        backgroundMusic.play();
    }

    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    food = generateFood();
    score = 0;
    apples = 0;
    isPaused = false;
    startTime = Date.now();
    iconSize = toggleState ? 5.5 : 3.0;

    setGameSpeed(); // Configura la velocidad del juego

    document.getElementById('score').innerText = score;
    document.getElementById('apples').innerText = apples;
    document.getElementById('time').innerText = 0;

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, 1000 / fps); // Actualiza el juego a la velocidad adecuada
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

// Alternar sonido
function toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
        backgroundMusic.pause(); // Pausar la música si está en mute
        document.getElementById('muteButton').innerText = 'Unmute Music';
    } else {
        backgroundMusic.play(); // Reproducir la música si no está en mute
        document.getElementById('muteButton').innerText = 'Mute Music';
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

    showMessage("Icon Size Updated", `Icon size set to: ${toggleState ? 'Large' : 'Small'}`);
}

// Establece la dificultad del juego
function setDifficulty(level) {
    difficulty = level; // Actualizar la dificultad global
    setGameSpeed(); // Actualizar la velocidad del juego
    showMessage("Difficulty Updated", `Game difficulty set to: ${level}`);
}

// Muestra el menú principal
function showMenu() {
    document.querySelector('.game-over-menu').classList.remove('active');
    document.querySelector('.pause-menu').classList.remove('active');
    document.querySelector('.game-container').style.display = 'none';
    document.querySelector('.menu').classList.add('active');
}

// Regresa al menú principal desde la configuración
function backToMenu() {
    document.querySelector('.menu').classList.add('active');
    document.querySelector('.settings-menu').classList.remove('active');
}

// Actualiza el estado del juego
function updateGame() {
    if (isPaused) return;

    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (head.x < 0 || head.y < 0 || head.x * gridSize >= canvas.width || head.y * gridSize >= canvas.height ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    if (head.x === food.x && head.y === food.y) {
        if (!isMuted) eatSound.play(); // Sonido al comer
        apples++;
        score += 10;
        food = generateFood();
        fps += 1; // Incrementar velocidad
        clearInterval(gameInterval);
        gameInterval = setInterval(updateGame, 1000 / fps);
    } else {
        snake.pop();
    }

    snake.unshift(head);

    document.getElementById('score').innerText = score;
    document.getElementById('apples').innerText = apples;
    document.getElementById('time').innerText = Math.floor((Date.now() - startTime) / 1000);

    drawGame();
}

// Dibuja el estado actual del juego en el canvas
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(foodTexture, food.x * gridSize, food.y * gridSize, gridSize * iconSize, gridSize * iconSize);
    snake.forEach(segment => ctx.drawImage(pacmanTexture, segment.x * gridSize, segment.y * gridSize, gridSize * iconSize, gridSize * iconSize));
}

// Finaliza el juego usando confirm para opciones
function endGame() {
    backgroundMusic.pause(); // Pausar la música al terminar el juego
    if (!isMuted) gameOverSound.play(); // Reproducir sonido de Game Over si no está en mute

    clearInterval(gameInterval); // Detener el intervalo del juego

    const message = `
Game Over!
Your final score: ${score}
Time survived: ${Math.floor((Date.now() - startTime) / 1000)} seconds
Apples collected: ${apples}

Would you like to retry the game? (Cancel to return to the main menu)
    `;

    const retry = confirm(message);

    if (retry) {
        startGame(); // Reiniciar el juego
    } else {
        showMenu(); // Volver al menú principal
        document.title = "PacSnake - Game";
        // No reanudar música en el menú principal
    }
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

// Muestra el menú de configuración
function showSettings() {
    document.querySelector('.settings-menu').classList.add('active');
    document.querySelector('.menu').classList.remove('active');
}

// Función para reiniciar la página (recargar)
function restartPage() {
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
