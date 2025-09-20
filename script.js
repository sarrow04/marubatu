// script.js

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

// --- グローバル変数の定義 ---
let gameMode = '';
let playerMark = '';
let aiMark = '';
let currentPlayer = '〇';
let gameActive = false; // ゲームが始まるまではfalse
let boardState = Array(16).fill('');

// ===============================================================
// ゲームの初期化と画面生成
// ===============================================================

// 盤面のセル（16個）を生成する
function createBoard() {
    boardElement.innerHTML = ''; // 既存のセルをクリア
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        boardElement.appendChild(cell);
    }
}

// ゲームを開始する関数
function startGame() {
    gameActive = true;
    boardState = Array(16).fill('');
    currentPlayer = '〇';

    modeSelection.style.display = 'none';
    turnSelection.style.display = 'none';
    gameBoard.style.display = 'block';
    
    createBoard(); // 盤面をクリアして再生成

    statusElement.textContent = `次のターン: ${currentPlayer}`;

    // プレイヤーが後攻(×)を選んだ場合、AIが最初に手を打つ
    if (gameMode === 'one-player' && playerMark === '×') {
        statusElement.textContent = 'AIのターン...';
        // AIの思考を少し遅延させて、自然に見せる
        setTimeout(aiMove, 500);
    }
}

// ===============================================================
// イベントリスナー (ボタンがクリックされた時の処理)
// ===============================================================

onePlayerBtn.addEventListener('click', () => {
    gameMode = 'one-player';
    modeSelection.style.display = 'none';
    turnSelection.style.display = 'block';
});

twoPlayerBtn.addEventListener('click', () => {
    gameMode = 'two-player';
    playerMark = '〇'; // 2人用の場合はプレイヤー1が〇固定
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

resetBtn.addEventListener('click', () => {
    // 全ての状態をリセットして最初の画面に戻る
    gameActive = false;
    gameMode = '';
    playerMark = '';
    aiMark = '';
    modeSelection.style.display = 'block';
    gameBoard.style.display = 'none';
});

// ===============================================================
// ゲーム中の処理
// ===============================================================

// セルがクリックされた時のメイン処理
function handleCellClick(event) {
    if (!gameActive) return; // ゲームが終了していたら何もしない

    const clickedCellIndex = parseInt(event.target.dataset.index);

    // すでにマークがあるセルや、AIのターンならクリックを無効化
    if (boardState[clickedCellIndex] !== '' || (gameMode === 'one-player' && currentPlayer === aiMark)) {
        return;
    }

    // 盤面にマークを置く
    updateBoard(clickedCellIndex, currentPlayer);

    // 勝敗・引き分けの判定
    if (checkEndCondition()) return;

    // ★重要：ターンを交代する
    switchTurn();

    // 1人用モードの場合、AIの手番を実行
    if (gameMode === 'one-player' && currentPlayer === aiMark && gameActive) {
        statusElement.textContent = 'AIのターン...';
        boardElement.style.pointerEvents = 'none'; // AI思考中にクリックできないようにする
        setTimeout(() => {
            aiMove();
            boardElement.style.pointerEvents = 'auto'; // AIが終わったらクリック可能に戻す
        }, 500);
    }
}

// ターンを交代する関数
function switchTurn() {
    currentPlayer = (currentPlayer === '〇') ? '×' : '〇';
    statusElement.textContent = `次のターン: ${currentPlayer}`;
}

// 盤面を更新する関数
function updateBoard(index, mark) {
    boardState[index] = mark;
    document.querySelector(`.cell[data-index='${index}']`).textContent = mark;
}

// AIが手を打つ関数 (現在はランダム)
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
        
        // ★重要：AIが手を打った後、プレイヤーにターンを戻す
        switchTurn();
    }
}

// ===============================================================
// 勝敗判定
// ===============================================================

function checkEndCondition() {
    if (checkWin()) {
        statusElement.textContent = `勝者: ${currentPlayer}！`;
        gameActive = false;
        return true;
    }
    if (boardState.every(cell => cell !== '')) {
        statusElement.textContent = '引き分け';
        gameActive = false;
        return true;
    }
    return false;
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
