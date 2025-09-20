// --- HTML要素の取得 ---
const sizeSelection = document.getElementById('size-selection');
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
let boardSize = 0;
let winConditionCount = 0;
let winPatterns = [];
let gameMode = '';
let playerMark = '';
let aiMark = '';
let selectedLevel = 0;
let currentPlayer = '〇';
let gameActive = false;
let boardState = [];

// ===============================================================
// 動的な勝利パターンの生成関数
// ===============================================================
function generateWinPatterns(size) {
    const patterns = [];
    for (let i = 0; i < size; i++) {
        const horizontalPattern = [];
        const verticalPattern = [];
        for (let j = 0; j < size; j++) {
            horizontalPattern.push(i * size + j);
            verticalPattern.push(j * size + i);
        }
        patterns.push(horizontalPattern, verticalPattern);
    }
    const diag1 = [];
    const diag2 = [];
    for (let i = 0; i < size; i++) {
        diag1.push(i * (size + 1));
        diag2.push((i + 1) * (size - 1));
    }
    patterns.push(diag1, diag2);
    return patterns;
}

// ===============================================================
// ゲームの初期化・画面生成
// ===============================================================
function createBoard() {
    while (boardElement.firstChild) {
        boardElement.removeChild(boardElement.firstChild);
    }
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    const totalCells = boardSize * boardSize;
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        boardElement.appendChild(cell);
    }
}

function startGame() {
    boardElement.style.pointerEvents = 'auto';
    gameActive = true;
    boardState = Array(boardSize * boardSize).fill('');
    currentPlayer = '〇';
    sizeSelection.style.display = 'none';
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
    boardSize = 0;
    winPatterns = [];
    document.querySelectorAll('.level-btn').forEach(btn => btn.style.backgroundColor = '#007bff');
    resultModal.style.display = 'none';
    sizeSelection.style.display = 'block';
    modeSelection.style.display = 'none';
    gameBoard.style.display = 'none';
    levelSelection.style.display = 'none';
}

// ===============================================================
// イベントリスナー
// ===============================================================
document.querySelectorAll('.size-btn').forEach(button => {
    button.addEventListener('click', () => {
        boardSize = parseInt(button.dataset.size);
        winConditionCount = boardSize;
        winPatterns = generateWinPatterns(boardSize);
        sizeSelection.style.display = 'none';
        modeSelection.style.display = 'block';
    });
});

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
    const winningMove = findCriticalMove(boardState, aiMark, winConditionCount);
    if (winningMove !== null) return winningMove;

    const blockingMove = findCriticalMove(boardState, playerMark, winConditionCount);
    if (blockingMove !== null) return blockingMove;

    if (selectedLevel >= 18) {
        const blockSetupMove = findCriticalMove(boardState, playerMark, winConditionCount - 1);
        if (blockSetupMove !== null) return blockSetupMove;
    }

    if (selectedLevel >= 12) {
        const setupMove = findCriticalMove(boardState, aiMark, winConditionCount - 1);
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
            if (!pattern.includes(cellIndex)) continue;
            
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
    
    if (selectedLevel >= 8 && boardSize >= 4) {
        const centerStartIndex = boardSize + 1;
        const centerCells = [centerStartIndex, centerStartIndex + 1, centerStartIndex + boardSize, centerStartIndex + boardSize + 1];
        const availableCenter = centerCells.filter(i => emptyCells.includes(i) && i < boardSize * boardSize);
        if (availableCenter.length > 0) {
            return availableCenter[Math.floor(Math.random() * availableCenter.length)];
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
        return pattern.every(index => boardState[index] && boardState[index] === currentPlayer);
    });
}
