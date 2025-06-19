document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const levelDisplay = document.getElementById('level');
    const sequenceLengthDisplay = document.getElementById('sequence-length');
    const messageDisplay = document.getElementById('message');
    const installBtn = document.getElementById('install-btn');
    const installContainer = document.getElementById('install-container');
    
    let squares = [];
    let sequence = [];
    let playerSequence = [];
    let level = 1;
    let gameStarted = false;
    let deferredPrompt;

    // 1. Configuração inicial do PWA
    installContainer.style.display = 'none';
    
    // Verifica se já está instalado
    const checkAlreadyInstalled = () => {
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone ||
                           document.referrer.includes('android-app://');
        if (isInstalled) {
            installContainer.style.display = 'none';
        }
        return isInstalled;
    };

    // 2. Evento de instalação
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('Evento beforeinstallprompt disparado');
        e.preventDefault();
        deferredPrompt = e;
        
        if (!checkAlreadyInstalled()) {
            installContainer.style.display = 'block';
        }
    });

    // 3. Botão de instalação
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'rejeitou'} a instalação`);
        installContainer.style.display = 'none';
        deferredPrompt = null;
    });

    // 4. Verificação de instalação
    window.addEventListener('appinstalled', () => {
        console.log('PWA instalado com sucesso');
        installContainer.style.display = 'none';
        deferredPrompt = null;
    });

    // 5. Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registrado:', registration.scope);
                })
                .catch(err => {
                    console.error('Falha no Service Worker:', err);
                });
        });
    }

    // Cores distintas para os 9 quadrados
    const colors = [
        '#FF5733', '#33FF57', '#3357FF', 
        '#F3FF33', '#FF33F3', '#33FFF3',
        '#8A2BE2', '#FF8C00', '#008000'
    ];
    
    // Inicializa o tabuleiro do jogo
    function initializeBoard() {
        gameBoard.innerHTML = '';
        squares = [];
        
        colors.forEach((color, index) => {
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.index = index;
            square.style.backgroundColor = '#e0e0e0';
            square.addEventListener('click', handleSquareClick);
            gameBoard.appendChild(square);
            squares.push(square);
        });
    }
    
    // Restante do código do jogo (mantido igual)
    function startGame() {
        gameStarted = true;
        level = 1;
        sequence = [];
        playerSequence = [];
        levelDisplay.textContent = level;
        sequenceLengthDisplay.textContent = sequence.length;
        messageDisplay.textContent = '';
        startBtn.disabled = true;
        restartBtn.disabled = false;
        
        generateSequence();
        playSequence();
    }
    
    function generateSequence() {
        let lastIndex = sequence.length > 0 ? sequence[sequence.length - 1] : -1;
        let newIndex;
        
        do {
            newIndex = Math.floor(Math.random() * squares.length);
        } while (newIndex === lastIndex && squares.length > 1);
        
        sequence.push(newIndex);
        sequenceLengthDisplay.textContent = sequence.length;
    }
    
    function playSequence() {
        let i = 0;
        const interval = setInterval(() => {
            if (i >= sequence.length) {
                clearInterval(interval);
                playerSequence = [];
                enableBoard();
                return;
            }
            
            const squareIndex = sequence[i];
            highlightSquare(squareIndex);
            i++;
        }, 800);
    }
    
    function highlightSquare(index) {
        const square = squares[index];
        square.style.backgroundColor = colors[index];
        square.classList.add('active');
        
        setTimeout(() => {
            square.style.backgroundColor = '#e0e0e0';
            square.classList.remove('active');
        }, 400);
    }
    
    function enableBoard() {
        squares.forEach(square => {
            square.style.cursor = 'pointer';
        });
    }
    
    function disableBoard() {
        squares.forEach(square => {
            square.style.cursor = 'default';
        });
    }
    
    function handleSquareClick(e) {
        if (!gameStarted || playerSequence.length >= sequence.length) return;
        
        const squareIndex = parseInt(e.target.dataset.index);
        const square = squares[squareIndex];
        
        square.style.backgroundColor = colors[squareIndex];
        square.classList.add('active');
        
        setTimeout(() => {
            square.style.backgroundColor = '#e0e0e0';
            square.classList.remove('active');
        }, 300);
        
        playerSequence.push(squareIndex);
        
        for (let i = 0; i < playerSequence.length; i++) {
            if (playerSequence[i] !== sequence[i]) {
                gameOver();
                return;
            }
        }
        
        if (playerSequence.length === sequence.length) {
            disableBoard();
            messageDisplay.textContent = 'Correto! Próximo nível...';
            setTimeout(() => {
                level++;
                levelDisplay.textContent = level;
                generateSequence();
                playSequence();
            }, 1500);
        }
    }
    
    function gameOver() {
        gameStarted = false;
        disableBoard();
        messageDisplay.textContent = `Fim de jogo! Você chegou ao nível ${level}.`;
        startBtn.disabled = false;
    }
    
    function restartGame() {
        startGame();
    }
    
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    
    initializeBoard();
});