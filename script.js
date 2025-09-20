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
    selectedLevel = 0; // レベル選択もリセット
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
playAgainBtn.addEventListener('click', resetToMenu);

// ===============================================================
// ゲーム中のメイン処理
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

// ===============================================================
// AIの思考ロジック
// ===============================================================

function aiMove() {
    if (!gameActive) return;
    const move = calculateAiMove(boardState, aiMark, selectedLevel);
    if (move !== null) {
        updateBoard(move, aiMark);
        if (checkEndCondition()) return;
        switchTurn();
    }
}

function calculateAiMove(currentBoard, mark, level) {
    const opponentMark = (mark === '〇') ? '×' : '〇';
    let winningMove = findLineMove(currentBoard, mark, 4);
    if (winningMove !== null) return winningMove;
    let blockingMove = findLineMove(currentBoard, opponentMark, 4);
    if (blockingMove !== null) return blockingMove;

    switch(level) {
        case 5:
            return findRandomMove(currentBoard);
        case 8:
            let setupMove8 = findLineMove(currentBoard, mark, 3);
            if (setupMove8 !== null) return setupMove8;
            return findRandomMove(currentBoard);
        case 12:
            let setupMove12 = findLineMove(currentBoard, mark, 3);
            if (setupMove12 !== null) return setupMove12;
            let blockSetupMove = findLineMove(currentBoard, opponentMark, 3);
            if (blockSetupMove !== null) return blockSetupMove;
            return findRandomMove(currentBoard);
        case 18:
            let bestMove = findBestScoringMove(currentBoard, mark, opponentMark);
            if (bestMove !== null) return bestMove;
            return findRandomMove(currentBoard);
    }
    return findRandomMove(currentBoard);
}

function findRandomMove(board) {
    const emptyCells = board.map((cell, i) => cell === '' ? i : null).filter(v => v !== null);
    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function findLineMove(board, mark, count) {
    const emptyCells = board.map((cell, i) => cell === '' ? i : null).filter(v => v !== null);
    for (const i of emptyCells) {
        let tempBoard = [...board];
        tempBoard[i] = mark;
        if (checkWinOnBoard(tempBoard, mark, i)) return i; // checkWinをi周辺に限定して高速化も可能
    }
    // 上記はcount=4の場合のみ。リーチ(count=3)を探すロジックに修正
    for (const i of emptyCells) {
        let tempBoard = [...board];
        tempBoard[i] = mark;
        if (isThreat(tempBoard, mark, count)) return i;
    }
    return null;
}

function isThreat(board, mark, count) {
    for (const pattern of winPatterns) {
        const marksInPattern = pattern.reduce((acc, index) => acc + (board[index] === mark ? 1 : 0), 0);
        const emptyInPattern = pattern.reduce((acc, index) => acc + (board[index] === '' ? 1 : 0), 0);
        if (marksInPattern === count && emptyInPattern === 4 - count) {
            return true;
        }
    }
    return false;
}

function findBestScoringMove(board, mark, opponentMark) {
    const emptyCells = board.map((cell, i) => cell === '' ? i : null).filter(v => v !== null);
    let bestScore = -1;
    let bestMove = null;
    for (const move of emptyCells) {
        let score = 0;
        let tempBoard = [...board];
        tempBoard[move] = mark;
        if (isThreat(tempBoard, mark, 3)) score += 5;
        if ([5, 6, 9, 10].includes(move)) score += 0.5;
        
        let tempBoardOpponent = [...board];
        tempBoardOpponent[move] = opponentMark;
        if(isThreat(tempBoardOpponent, opponentMark, 3)) score += 2;


        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return (bestScore > 0) ? bestMove : null;
}

function checkWinOnBoard(board, mark) {
     return winPatterns.some(pattern => {
        return pattern.every(index => board[index] === mark);
    });
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
