// --- HTML要素の取得 ---
const modeSelection = document.getElementById('mode-selection');
const turnSelection = document.getElementById('turn-selection');
const gameBoard = document.getElementById('game-board');
const boardElement = document.querySelector('.board');
const statusElement = document.getElementById('status');

const onePlayerBtn = document.getElementById('one-player-btn');
const twoPlayerBtn = document.getElementById('two-player-btn');
const startFirstBtn = document.getElementById('start-first-btn');
const startSecondBtn = document.getElementById('start-second-btn');
const resetBtn = document.getElementById('reset-btn');

const resultModal = document.getElementById('result-modal');
const resultMessage = document.getElementById('result-message');
const playAgainBtn = document.getElementById('play-again-btn');

// --- グローバル変数の定義 ---
let gameMode = '';
let playerMark = '';
let aiMark = '';
let currentPlayer = '〇';
let gameActive = false;
let boardState = Array(16).fill('');

// ===============================================================
// ゲームの初期化と画面生成
// ===============================================================

function createBoard() {
    boardElement.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        boardElement.appendChild(cell);
    }
}

function startGame() {
    gameActive = true;
    boardState = Array(16).fill('');
    currentPlayer = '〇';

    modeSelection.style.display = 'none';
    turnSelection.style.display = 'none';
    gameBoard.style.display = 'block';
    
    createBoard();

    statusElement.textContent = `次のターン: ${currentPlayer}`;

    if (gameMode === 'one-player' && playerMark === '×') {
        statusElement.textContent = 'AIのターン...';
        setTimeout(aiMove, 500);
    }
}

function resetToMenu() {
    gameActive = false;
    gameMode = '';
    playerMark = '';
    aiMark = '';
    
    resultModal.style.display = 'none';
    modeSelection.style.display = 'block';
    gameBoard.style.display = 'none';
    turnSelection.style.display = 'none';
}

// ===============================================================
// イベントリスナー
// ===============================================================

onePlayerBtn.addEventListener('click', () => {
    gameMode = 'one-player';
    modeSelection.style.display = 'none';
    turnSelection.style.display = 'block';
});

twoPlayerBtn.addEventListener('click', () => {
    gameMode = 'two-player';
    playerMark = '〇';
    startGame();
});

startFirstBtn.addEventListener('click', () => {
    playerMark = '〇';
    aiMark = '×';
    startGame();
});

startSecondBtn.addEventListener('click', () => {
    playerMark = '×';
    aiMark = '〇';
    startGame();
});

resetBtn.addEventListener('click', resetToMenu);
playAgainBtn.addEventListener('click', resetToMenu);

// ===============================================================
// ゲーム中の処理
// ===============================================================

function handleCellClick(event) {
    if (!gameActive) return;

    const clickedCellIndex = parseInt(event.target.dataset.index);

    if (boardState[clickedCellIndex] !== '' || (gameMode === 'one-player' && currentPlayer === aiMark)) {
        return;
    }

    updateBoard(clickedCellIndex, currentPlayer);
    if (checkEndCondition()) return;
    switchTurn();

    if (gameMode === 'one-player' && currentPlayer === aiMark && gameActive) {
        statusElement.textContent = 'AIのターン...';
        boardElement.style.pointerEvents = 'none';
        setTimeout(() => {
            aiMove();
            if(gameActive) {
                boardElement.style.pointerEvents = 'auto';
            }
        }, 500);
    }
}

function switchTurn() {
    currentPlayer = (currentPlayer === '〇') ? '×' : '〇';
    statusElement.textContent = `次のターン: ${currentPlayer}`;
}

function updateBoard(index, mark) {
    boardState[index] = mark;
    document.querySelector(`.cell[data-index='${index}']`).textContent = mark;
}

function aiMove() {
    if (!gameActive) return;

    let availableCells = [];
    boardState.forEach((cell, index) => {
        if (cell === '') availableCells.push(index);
    });

    if (availableCells.length > 0) {
        const move = availableCells[Math.floor(Math.random() * availableCells.length)];
        updateBoard(move, aiMark);

        if (checkEndCondition()) return;
        switchTurn();
    }
}

// ===============================================================
// 勝敗判定と結果表示
// ===============================================================

function checkEndCondition() {
    if (checkWin()) {
        showResult(`勝者: ${currentPlayer}！`);
        return true;
    }
    if (boardState.every(cell => cell !== '')) {
        showResult('引き分け');
        return true;
    }
    return false;
}

function showResult(message) {
    gameActive = false;
    resultMessage.textContent = message;
    resultModal.style.display = 'flex';
}

function checkWin() {
    const winPatterns = [
        [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], // 横
        [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], // 縦
        [0, 5, 10, 15], [3, 6, 9, 12] // 斜め
    ];
    return winPatterns.some(pattern => {
        const [a, b, c, d] = pattern;
        return boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c] && boardState[a] === boardState[d];
    });
}
