// script.js (全面改訂版)

// --- HTML要素の取得 (一部変更) ---
const modeSelection = document.getElementById('mode-selection');
const levelSelection = document.getElementById('level-selection'); // ★変更
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

// --- グローバル変数の定義 (一部追加) ---
let gameMode = '';
let playerMark = '';
let aiMark = '';
let selectedLevel = 0; // ★追加：選択されたAIレベル
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

function createBoard() { /* 変更なし */ }
function startGame() {
    gameActive = true;
    boardState = Array(16).fill('');
    currentPlayer = '〇';
    modeSelection.style.display = 'none';
    levelSelection.style.display = 'none'; // ★変更
    gameBoard.style.display = 'block';
    createBoard();
    statusElement.textContent = `次のターン: ${currentPlayer}`;
    if (gameMode === 'one-player' && playerMark === '×') {
        statusElement.textContent = 'AIのターン...';
        setTimeout(aiMove, 500);
    }
}
function resetToMenu() { /* 変更なし */ }

// ===============================================================
// イベントリスナー (レベル選択処理を追加)
// ===============================================================

onePlayerBtn.addEventListener('click', () => {
    gameMode = 'one-player';
    modeSelection.style.display = 'none';
    levelSelection.style.display = 'block'; // ★変更
});

// ★★★ レベル選択ボタンの処理 ★★★
document.querySelectorAll('.level-btn').forEach(button => {
    button.addEventListener('click', () => {
        selectedLevel = parseInt(button.dataset.level);
        // 選択されたボタンをハイライト（任意）
        document.querySelectorAll('.level-btn').forEach(btn => btn.style.backgroundColor = '#007bff');
        button.style.backgroundColor = '#0056b3';
    });
});

twoPlayerBtn.addEventListener('click', () => { /* 変更なし */ });

startFirstBtn.addEventListener('click', () => {
    if (selectedLevel === 0) { alert('AIのレベルを選んでください'); return; }
    playerMark = '〇';
    aiMark = '×';
    startGame();
});

startSecondBtn.addEventListener('click', () => {
    if (selectedLevel === 0) { alert('AIのレベルを選んでください'); return; }
    playerMark = '×';
    aiMark = '〇';
    startGame();
});

resetBtn.addEventListener('click', resetToMenu);
playAgainBtn.addEventListener('click', resetToMenu);

// ===============================================================
// ★★★ ここからAIの思考ロジック ★★★
// ===============================================================

// AIの手を決定し、盤面に反映させる関数
function aiMove() {
    if (!gameActive) return;

    // レベルに応じた思考関数を呼び出し、最善手を取得
    const move = calculateAiMove(boardState, aiMark, selectedLevel);

    if (move !== null) {
        updateBoard(move, aiMark);
        if (checkEndCondition()) return;
        switchTurn();
    }
}

// AIの思考本体。レベルに応じて処理を分岐
function calculateAiMove(currentBoard, mark, level) {
    const opponentMark = (mark === '〇') ? '×' : '〇';
    
    // --- 共通ロジック：AIがリーチなら必ず勝つ ---
    let winningMove = findLineMove(currentBoard, mark, 4);
    if (winningMove !== null) return winningMove;
    
    // --- 共通ロジック：相手がリーチなら必ず防ぐ ---
    let blockingMove = findLineMove(currentBoard, opponentMark, 4);
    if (blockingMove !== null) return blockingMove;

    // --- レベルごとの思考 ---
    switch(level) {
        case 5: // 5歳 (最弱)：ランダム
            return findRandomMove(currentBoard);

        case 8: // 保育園：リーチをかける手を優先
            let setupMove = findLineMove(currentBoard, mark, 3);
            if (setupMove !== null) return setupMove;
            return findRandomMove(currentBoard);

        case 12: // 中学生：相手のリーチ作りも防ぐ
            let setupMove_12 = findLineMove(currentBoard, mark, 3);
            if (setupMove_12 !== null) return setupMove_12;
            let blockSetupMove = findLineMove(currentBoard, opponentMark, 3);
            if (blockSetupMove !== null) return blockSetupMove;
            return findRandomMove(currentBoard);

        case 18: // 大人：2手リーチや戦略的な場所を評価
            // 複数のリーチを作れる手を探す
            let bestMove = findBestScoringMove(currentBoard, mark, opponentMark);
            if (bestMove !== null) return bestMove;
            return findRandomMove(currentBoard); // 良い手がなければランダム
    }
    return findRandomMove(currentBoard);
}

// --- AI思考のヘルパー関数群 ---

// ランダムな空きマスを探す
function findRandomMove(board) {
    const emptyCells = board.map((cell, i) => cell === '' ? i : null).filter(v => v !== null);
    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

// N個のマークが揃うマスを探す（勝利、ブロック、リーチ作成に使用）
function findLineMove(board, mark, count) {
    const emptyCells = board.map((cell, i) => cell === '' ? i : null).filter(v => v !== null);
    
    for (const i of emptyCells) {
        let tempBoard = [...board];
        tempBoard[i] = mark;
        for (const pattern of winPatterns) {
            const marksInPattern = pattern.reduce((acc, index) => acc + (tempBoard[index] === mark ? 1 : 0), 0);
            if (marksInPattern === count) {
                // そのラインが本当にリーチか（邪魔されていないか）をチェック
                const lineValues = pattern.map(index => tempBoard[index]);
                if (!lineValues.includes(mark === '〇' ? '×' : '〇')) {
                    return i;
                }
            }
        }
    }
    return null;
}

// 「大人」レベル用のスコアリング関数
function findBestScoringMove(board, mark, opponentMark) {
    const emptyCells = board.map((cell, i) => cell === '' ? i : null).filter(v => v !== null);
    let bestScore = -1;
    let bestMove = null;

    for (const move of emptyCells) {
        let score = 0;
        let tempBoard = [...board];
        tempBoard[move] = mark;

        // 自分がリーチをいくつ作れるか
        score += countCreatedLines(tempBoard, mark, 3) * 5;
        // 相手のリーチをいくつ潰せるか
        score += countCreatedLines(board, opponentMark, 3) - countCreatedLines(tempBoard, opponentMark, 3);
        
        // 中央のマスを少しだけ有利にする
        if ([5, 6, 9, 10].includes(move)) {
            score += 0.5;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return (bestScore > 0) ? bestMove : null;
}

function countCreatedLines(board, mark, count) {
    let lines = 0;
    for (const pattern of winPatterns) {
        const marksInPattern = pattern.reduce((acc, index) => acc + (board[index] === mark ? 1 : 0), 0);
        const emptyInPattern = pattern.reduce((acc, index) => acc + (board[index] === '' ? 1 : 0), 0);
        if (marksInPattern === count && emptyInPattern === (4 - count)) {
            lines++;
        }
    }
    return lines;
}


// ===============================================================
// 既存のゲーム進行ロジック (変更なし)
// ===============================================================
function handleCellClick(event) { /* 変更なし */ }
function switchTurn() { /* 変更なし */ }
function updateBoard(index, mark) { /* 変更なし */ }
function checkEndCondition() { /* 変更なし */ }
function showResult(message) { /* 変更なし */ }
function checkWin() { /* 変更なし */ }
