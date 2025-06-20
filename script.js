document.addEventListener('DOMContentLoaded', () => {
    // Configurações iniciais de performance
    'use strict';
    
    // Controle de estado global
    const gameState = {
        active: false,
        sequence: [],
        playerInput: [],
        level: 1,
        awaitClick: false
    };

    // Elementos do DOM - cache otimizado
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

    // Cores pré-calculadas
    const COLORS = [
        '#FF5733', '#33FF57', '#3357FF', 
        '#F3FF33', '#FF33F3', '#33FFF3',
        '#8A2BE2', '#FF8C00', '#008000'
    ];
    const NEUTRAL_COLOR = '#e0e0e0';

    // Pool de objetos para reutilização
    const animationPool = {
        active: [],
        available: [],
        get: function() {
            return this.available.pop() || {};
        },
        release: function(obj) {
            this.active = this.active.filter(item => item !== obj);
            this.available.push(obj);
        }
    };

    // Inicialização otimizada
    function init() {
        setupBoard();
        setupEventListeners();
        setupPWA();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(console.error);
        }
    }

    // Configuração do tabuleiro com performance
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

    // Event listeners otimizados
    function setupEventListeners() {
        // Delegation de eventos para melhor performance
        elements.board.addEventListener('click', handleBoardClick);
        elements.startBtn.addEventListener('click', startGame);
        elements.restartBtn.addEventListener('click', startGame);
    }

    // Controle do jogo principal
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
    }

    function generateSequence() {
        let lastIndex = -1;
        
        // Algoritmo Fisher-Yates moderno
        for (let i = 0; i < gameState.level; i++) {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * COLORS.length);
            } while (newIndex === lastIndex && COLORS.length > 1);
            
            gameState.sequence.push(newIndex);
            lastIndex = newIndex;
        }
    }

    // Sequência com tratamento de erro robusto
    async function playSequence() {
        gameState.awaitClick = false;
        
        for (let i = 0; i < gameState.sequence.length; i++) {
            await animateSquare(gameState.sequence[i], 400);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        gameState.playerInput = [];
        gameState.awaitClick = true;
    }

    // Animação com pool de objetos
    function animateSquare(index, duration) {
        return new Promise(resolve => {
            const square = elements.board.children[index];
            const animation = animationPool.get();
            
            animation.onFinish = () => {
                square.style.backgroundColor = NEUTRAL_COLOR;
                animationPool.release(animation);
                resolve();
            };
            
            square.style.backgroundColor = COLORS[index];
            animationPool.active.push(animation);
            
            // Usa requestAnimationFrame para performance
            const start = performance.now();
            const animate = (time) => {
                const elapsed = time - start;
                if (elapsed >= duration) {
                    animation.onFinish();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    // Controle de input com debounce
    function handleBoardClick(e) {
        if (!gameState.active || !gameState.awaitClick) return;
        
        const square = e.target.closest('.square');
        if (!square) return;
        
        const index = parseInt(square.dataset.index);
        processPlayerInput(index).catch(handleCriticalError);
    }

    // Processamento seguro do input
    async function processPlayerInput(index) {
        gameState.awaitClick = false;
        
        await animateSquare(index, 300);
        gameState.playerInput.push(index);
        
        // Verificação otimizada
        for (let i = 0; i < gameState.playerInput.length; i++) {
            if (gameState.playerInput[i] !== gameState.sequence[i]) {
                return endGame(false);
            }
        }
        
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
        
        await new Promise(resolve => setTimeout(resolve, 1500));
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

    // PWA com fallbacks
    function setupPWA() {
        if ('BeforeInstallPromptEvent' in window) {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                elements.installContainer.style.display = 'block';
                elements.installBtn.onclick = () => e.prompt();
            });
        } else {
            elements.installContainer.style.display = 'none';
        }
    }

    // Tratamento de erros críticos
    function handleCriticalError(error) {
        console.error('Erro crítico:', error);
        elements.message.textContent = 'Erro inesperado. Reiniciando...';
        setTimeout(() => {
            gameState.active = false;
            startGame();
        }, 2000);
    }

    // Inicialização segura
    try {
        init();
    } catch (error) {
        handleCriticalError(error);
    }
});