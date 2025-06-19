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
            square.style.backgroundColor = '#e0e0e0'; // Cor neutra inicial
            square.addEventListener('click', handleSquareClick);
            gameBoard.appendChild(square);
            squares.push(square);
        });
    }
    
    // Inicia o jogo
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
    
    // Gera uma nova sequência aleatória
    function generateSequence() {
        // Adiciona um novo quadrado aleatório à sequência (sem repetir o último)
        let lastIndex = sequence.length > 0 ? sequence[sequence.length - 1] : -1;
        let newIndex;
        
        do {
            newIndex = Math.floor(Math.random() * squares.length);
        } while (newIndex === lastIndex && squares.length > 1);
        
        sequence.push(newIndex);
        sequenceLengthDisplay.textContent = sequence.length;
    }
    
    // Mostra a sequência para o jogador
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
    
    // Destaca um quadrado
    function highlightSquare(index) {
        const square = squares[index];
        // Mostra a cor verdadeira
        square.style.backgroundColor = colors[index];
        square.classList.add('active');
        
        setTimeout(() => {
            // Volta para a cor neutra
            square.style.backgroundColor = '#e0e0e0';
            square.classList.remove('active');
        }, 400);
    }
    
    // Habilita o tabuleiro para interação do jogador
    function enableBoard() {
        squares.forEach(square => {
            square.style.cursor = 'pointer';
        });
    }
    
    // Desabilita o tabuleiro
    function disableBoard() {
        squares.forEach(square => {
            square.style.cursor = 'default';
        });
    }
    
    // Manipula o clique em um quadrado
    function handleSquareClick(e) {
        if (!gameStarted || playerSequence.length >= sequence.length) return;
        
        const squareIndex = parseInt(e.target.dataset.index);
        const square = squares[squareIndex];
        
        // Mostra a cor ao clicar
        square.style.backgroundColor = colors[squareIndex];
        square.classList.add('active');
        
        setTimeout(() => {
            square.style.backgroundColor = '#e0e0e0';
            square.classList.remove('active');
        }, 300);
        
        playerSequence.push(squareIndex);
        
        // Verifica se o jogador acertou a sequência até agora
        for (let i = 0; i < playerSequence.length; i++) {
            if (playerSequence[i] !== sequence[i]) {
                gameOver();
                return;
            }
        }
        
        // Se o jogador completou a sequência corretamente
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
    
    // Finaliza o jogo
    function gameOver() {
        gameStarted = false;
        disableBoard();
        messageDisplay.textContent = `Fim de jogo! Você chegou ao nível ${level}.`;
        startBtn.disabled = false;
    }
    
    // Reinicia o jogo
    function restartGame() {
        startGame();
    }
    
    // Event listeners para o jogo
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    
    // Configuração para PWA (Progressive Web App)
    window.addEventListener('beforeinstallprompt', (e) => {
        // Impede o prompt automático
        e.preventDefault();
        // Guarda o evento para que possa ser acionado depois
        deferredPrompt = e;
        // Mostra o botão de instalação
        installContainer.style.display = 'block';
    });
    
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Mostra o prompt de instalação
            deferredPrompt.prompt();
            // Espera pelo resultado
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('Usuário aceitou a instalação');
                installContainer.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
    
    window.addEventListener('appinstalled', () => {
        console.log('App instalado com sucesso');
        installContainer.style.display = 'none';
        deferredPrompt = null;
    });
    
    // Verifica se o app já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
        installContainer.style.display = 'none';
    }
    
    // Service Worker registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registrado com sucesso:', registration.scope);
                })
                .catch(err => {
                    console.log('Falha no registro do ServiceWorker:', err);
                });
        });
    }
    
    // Inicializa o jogo
    initializeBoard();
});