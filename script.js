// --- HTML要素の取得 ---
const modeSelection = document.getElementById('mode-selection');
const levelSelection = document.getElementById('level-selection');
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
const backToMenuBtn = document.getElementById('back-to-menu-btn');

// --- グローバル変数の定義 ---
let gameMode = '';
let playerMark = '';
let aiMark = '';
let selectedLevel = 0;
let currentPlayer = '〇';
let gameActive = false;
let boardState = Array(16).fill('');
const winPatterns = [
    [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
    [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
    [0, 5, 10, 15], [3, 6, 9, 12]
];

// ===============================================================
// ゲームの初期化・画面生成
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
    levelSelection.style.display = 'none';
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
    selectedLevel = 0;
    document.querySelectorAll('.level-btn').forEach(btn => btn.style.backgroundColor = '#007bff');
    resultModal.style.display = 'none';
    modeSelection.style.display = 'block';
    gameBoard.style.display = 'none';
    levelSelection.style.display = 'none';
}

// ===============================================================
// イベントリスナー
// ===============================================================

onePlayerBtn.addEventListener('click', () => {
    gameMode = 'one-player';
    modeSelection.style.display = 'none';
    levelSelection.style.display = 'block';
});

twoPlayerBtn.addEventListener('click', () => {
    gameMode = 'two-player';
    playerMark = '〇';
    startGame();
});

document.querySelectorAll('.level-btn').forEach(button => {
    button.addEventListener('click', () => {
        selectedLevel = parseInt(button.dataset.level);
        document.querySelectorAll('.level-btn').forEach(btn => btn.style.backgroundColor = '#007bff');
        button.style.backgroundColor = '#0056b3';
    });
});

startFirstBtn.addEventListener('click', () => {
    if (gameMode === 'one-player' && selectedLevel === 0) { alert('AIのレベルを選んでください'); return; }
    playerMark = '〇';
    aiMark = '×';
    startGame();
});

startSecondBtn.addEventListener('click', () => {
    if (gameMode === 'one-player' && selectedLevel === 0) { alert('AIのレベルを選んでください'); return; }
    playerMark = '×';
    aiMark = '〇';
    startGame();
});

resetBtn.addEventListener('click', resetToMenu);
playAgainBtn.addEventListener('click', () => {
    resultModal.style.display = 'none';
    startGame();
});
backToMenuBtn.addEventListener('click', resetToMenu);

// ===============================================================
// ゲーム中のメイン処理
// ===============================================================

function handleCellClick(event) {
    if (!gameActive) return;
    const clickedCellIndex = parseInt(event.target.dataset.index);
    if (boardState[clickedCellIndex] !== '' || (gameMode === 'one-player' && currentPlayer === aiMark)) return;

    updateBoard(clickedCellIndex, currentPlayer);
    if (checkEndCondition()) return;
    switchTurn();

    if (gameMode === 'one-player' && currentPlayer === aiMark && gameActive) {
        statusElement.textContent = 'AIのターン...';
        boardElement.style.pointerEvents = 'none';
        setTimeout(() => {
            aiMove();
            if(gameActive) boardElement.style.pointerEvents = 'auto';
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

// ===============================================================
// AIの思考ロジック
// ===============================================================

function aiMove() {
    if (!gameActive) return;
    const move = calculateAiMove();
    if (move !== null) {
        updateBoard(move, aiMark);
        if (checkEndCondition()) return;
        switchTurn();
    }
}

function calculateAiMove() {
    const winningMove = findCriticalMove(boardState, aiMark, 4);
    if (winningMove !== null) return winningMove;

    const blockingMove = findCriticalMove(boardState, playerMark, 4);
    if (blockingMove !== null) return blockingMove;

    if (selectedLevel >= 18) {
        const blockSetupMove = findCriticalMove(boardState, playerMark, 3);
        if (blockSetupMove !== null) return blockSetupMove;
    }

    if (selectedLevel >= 12) {
        const setupMove = findCriticalMove(boardState, aiMark, 3);
        if (setupMove !== null) return setupMove;
    }
    
    return findRandomMove();
}

function findCriticalMove(board, mark, count) {
    const emptyCells = [];
    board.forEach((cell, index) => {
        if (cell === '') emptyCells.push(index);
    });

    for (const cellIndex of emptyCells) {
        const tempBoard = [...board];
        tempBoard[cellIndex] = mark;
        for (const pattern of winPatterns) {
            const isWinningPattern = pattern.every(index => tempBoard[index] === mark);
            if (isWinningPattern) {
                let marksInPattern = 0;
                let opponentPresent = false;
                for(const index of pattern) {
                    if(board[index] === mark) marksInPattern++;
                    else if(board[index] !== '' && board[index] !== mark) opponentPresent = true;
                }
                if(marksInPattern === count - 1 && !opponentPresent) return cellIndex;
            }
        }
    }
    return null;
}

function findRandomMove() {
    const emptyCells = [];
    boardState.forEach((cell, index) => {
        if (cell === '') emptyCells.push(index);
    });
    if (emptyCells.length === 0) return null;
    
    if (selectedLevel >= 8) {
        const centerCells = [5, 6, 9, 10].filter(i => emptyCells.includes(i));
        if (centerCells.length > 0) {
            return centerCells[Math.floor(Math.random() * centerCells.length)];
        }
    }
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
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
    return winPatterns.some(pattern => {
        const [a, b, c, d] = pattern;
        return boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c] && boardState[a] === boardState[d];
    });
}
