document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    
    const gameState = {
        active: false,
        sequence: [],
        playerInput: [],
        level: 1,
        awaitClick: false,
        lastColorIndex: -1
    };

    const elements = {
        board: document.getElementById('game-board'),
        level: document.getElementById('level'),
        sequenceLength: document.getElementById('sequence-length'),
        message: document.getElementById('message'),
        startBtn: document.getElementById('start-btn'),
        restartBtn: document.getElementById('restart-btn'),
        installBtn: document.getElementById('install-btn'),
        installContainer: document.getElementById('install-container')
    };

    // Adicione no início do script, após a definição dos elementos
function setupButtonEffects() {
    const buttons = document.querySelectorAll('button, .square');
    
    buttons.forEach(btn => {
        // Evento para desktop
        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'scale(0.96)';
            btn.style.filter = 'brightness(0.95)';
        });
        
        // Evento para mobile
        btn.addEventListener('touchstart', () => {
            btn.style.transform = 'scale(0.96)';
            btn.style.filter = 'brightness(0.95)';
        }, { passive: true });
        
        const resetButton = () => {
            btn.style.transform = '';
            btn.style.filter = '';
        };
        
        btn.addEventListener('mouseup', resetButton);
        btn.addEventListener('mouseleave', resetButton);
        btn.addEventListener('touchend', resetButton, { passive: true });
    });
}

// Chame esta função no final da função init()
function init() {
    setupBoard();
    setupEventListeners();
    setupPWA();
    setupButtonEffects(); // Adicione esta linha
    registerServiceWorker();
}
    const COLORS = [
        '#FF5733', '#33FF57', '#3357FF', 
        '#F3FF33', '#FF33F3', '#33FFF3',
        '#8A2BE2', '#FF8C00', '#008000'
    ];
    const NEUTRAL_COLOR = '#e0e0e0';
    const ANIMATION_DURATION = 500;
    const DELAY_BETWEEN_COLORS = 300;

    let deferredPrompt;

    function init() {
        setupBoard();
        setupEventListeners();
        setupPWA();
        registerServiceWorker();
    }

    function setupBoard() {
        elements.board.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        COLORS.forEach((_, index) => {
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.index = index;
            square.style.backgroundColor = NEUTRAL_COLOR;
            fragment.appendChild(square);
        });
        
        elements.board.appendChild(fragment);
    }

    function setupEventListeners() {
        elements.board.addEventListener('click', handleBoardClick);
        elements.startBtn.addEventListener('click', startGame);
        elements.restartBtn.addEventListener('click', startGame);
    }

    function startGame() {
        if (gameState.active) return;
        
        resetGameState();
        updateUI();
        generateSequence();
        playSequence().catch(handleCriticalError);
    }

    function resetGameState() {
        gameState.active = true;
        gameState.sequence = [];
        gameState.playerInput = [];
        gameState.level = 1;
        gameState.awaitClick = false;
        gameState.lastColorIndex = -1;
        elements.message.textContent = '';
    }

    function generateSequence() {
        // Aumenta a sequência em apenas 1 cor por nível
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * COLORS.length);
        } while (newIndex === gameState.lastColorIndex && COLORS.length > 1);
        
        gameState.sequence.push(newIndex);
        gameState.lastColorIndex = newIndex;
    }

    async function playSequence() {
        gameState.awaitClick = false;
        
        for (let i = 0; i < gameState.sequence.length; i++) {
            await animateSquare(gameState.sequence[i]);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_COLORS));
        }
        
        gameState.playerInput = [];
        gameState.awaitClick = true;
    }

    function animateSquare(index) {
        return new Promise(resolve => {
            const square = elements.board.children[index];
            
            square.style.backgroundColor = COLORS[index];
            
            setTimeout(() => {
                square.style.backgroundColor = NEUTRAL_COLOR;
                resolve();
            }, ANIMATION_DURATION);
        });
    }

function handleBoardClick(e) {
    if (!gameState.active || !gameState.awaitClick) return;
    
    const square = e.target.closest('.square');
    if (!square) return;
    
    // Feedback visual imediato
    square.style.transform = 'scale(0.95)';
    setTimeout(() => {
        square.style.transform = '';
    }, 100);
    
    const index = parseInt(square.dataset.index);
    processPlayerInput(index).catch(handleCriticalError);
}

    async function processPlayerInput(index) {
        gameState.awaitClick = false;
        
        await animateSquare(index);
        gameState.playerInput.push(index);
        
        // Verifica se o input está correto
        if (gameState.playerInput[gameState.playerInput.length - 1] !== 
            gameState.sequence[gameState.playerInput.length - 1]) {
            return endGame(false);
        }
        
        // Verifica se completou a sequência
        if (gameState.playerInput.length === gameState.sequence.length) {
            await nextLevel();
        } else {
            gameState.awaitClick = true;
        }
    }

    async function nextLevel() {
        gameState.level++;
        updateUI();
        elements.message.textContent = 'Correto! Próximo nível...';
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        generateSequence();
        await playSequence();
    }

    function endGame(success) {
        gameState.active = false;
        updateUI();
        elements.message.textContent = success ? 
            'Parabéns! Você venceu!' : 
            `Fim de jogo! Nível ${gameState.level}.`;
    }

    function updateUI() {
        elements.level.textContent = gameState.level;
        elements.sequenceLength.textContent = gameState.sequence.length;
        elements.startBtn.disabled = gameState.active;
        elements.restartBtn.disabled = !gameState.active;
    }

    function setupPWA() {
    // Esconde o botão inicialmente
    elements.installContainer.style.display = 'none';
    
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('beforeinstallprompt event fired');
        // Previne a prompt automática
        e.preventDefault();
        
        // Guarda o evento para usar depois
        window.deferredPrompt = e;
        
        // Mostra o botão de instalação
        elements.installContainer.style.display = 'block';
        
        // Configura o clique do botão
        elements.installBtn.addEventListener('click', async () => {
            console.log('Install button clicked');
            if (window.deferredPrompt) {
                // Mostra a prompt de instalação
                window.deferredPrompt.prompt();
                
                // Espera pela decisão do usuário
                const { outcome } = await window.deferredPrompt.userChoice;
                
                console.log(`User response: ${outcome}`);
                
                // Limpa o prompt guardado
                window.deferredPrompt = null;
                
                // Esconde o botão
                elements.installContainer.style.display = 'none';
            }
        });
    });

    // Esconde o botão se o app já estiver instalado
    window.addEventListener('appinstalled', () => {
        console.log('PWA installed');
        window.deferredPrompt = null;
        elements.installContainer.style.display = 'none';
    });
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js', { scope: './' })
            .then(registration => {
                console.log('ServiceWorker registrado com sucesso no escopo:', registration.scope);
            })
            .catch(error => {
                console.error('Falha ao registrar ServiceWorker:', error);
            });
    }
}


    function handleCriticalError(error) {
        console.error('Erro crítico:', error);
        elements.message.textContent = 'Erro inesperado. Reiniciando...';
        setTimeout(() => {
            gameState.active = false;
            startGame();
        }, 2000);
    }

    try {
        init();
    } catch (error) {
        handleCriticalError(error);
    }
});