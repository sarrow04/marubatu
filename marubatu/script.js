// --- グローバル変数の設定 ---
const modeSelection = document.getElementById('mode-selection');
const turnSelection = document.getElementById('turn-selection');
const gameBoard = document.getElementById('game-board');
const boardElement = document.querySelector('.board');
const statusElement = document.getElementById('status');
const onePlayerBtn = document.getElementById('one-player-btn');
const twoPlayerBtn = document.getElementById('two-player-btn');
const startFirstBtn = document.getElementById('start-first-btn');
const startSecondBtn = document.getElementById('start-second-btn');

let gameMode = ''; // 'one-player' or 'two-player'
let playerMark = ''; // プレイヤーのマーク ('〇' or '×')
let aiMark = '';     // AIのマーク
let currentPlayer = '〇';
let gameActive = true;
let boardState = Array(16).fill('');


// --- イベントリスナー ---

// 「一人で遊ぶ」ボタン
onePlayerBtn.addEventListener('click', () => {
    gameMode = 'one-player';
    modeSelection.style.display = 'none';
    turnSelection.style.display = 'block';
});

// 「二人で遊ぶ」ボタン
twoPlayerBtn.addEventListener('click', () => {
    gameMode = 'two-player';
    playerMark = '〇'; // 二人用の場合はプレイヤー1が〇
    startGame();
});

// 「先行(〇)」ボタン
startFirstBtn.addEventListener('click', () => {
    playerMark = '〇';
    aiMark = '×';
    startGame();
});

// 「後攻(×)」ボタン
startSecondBtn.addEventListener('click', () => {
    playerMark = '×';
    aiMark = '〇';
    startGame();
});


// --- ゲーム開始処理 ---
function startGame() {
    modeSelection.style.display = 'none';
    turnSelection.style.display = 'none';
    gameBoard.style.display = 'block';
    
    currentPlayer = '〇';
    statusElement.textContent = `次のターン: ${currentPlayer}`;
    
    // プレイヤーが後攻(×)を選んだ場合、AIが最初に手を打つ
    if (gameMode === 'one-player' && playerMark === '×') {
        statusElement.textContent = 'AIのターン...';
        // AIの思考を少し遅延させて、自然に見せる
        setTimeout(aiMove, 500); 
    }
}

// --- セルクリック処理 ---
function handleCellClick(event) {
    const clickedCellIndex = parseInt(event.target.dataset.index);

    // クリックが無効な場合
    if (boardState[clickedCellIndex] !== '' || !gameActive) {
        return;
    }
    // 一人用モードでAIのターンの場合
    if (gameMode === 'one-player' && currentPlayer === aiMark) {
        return;
    }

    // 盤面を更新
    updateBoard(clickedCellIndex, currentPlayer);
    
    // 勝敗判定
    if (checkEndCondition()) {
        return;
    }

    // ターン交代
    switchTurn();

    // 一人用モードの場合、AIの手番を実行
    if (gameMode === 'one-player' && currentPlayer === aiMark && gameActive) {
        statusElement.textContent = 'AIのターン...';
        setTimeout(aiMove, 500);
    }
}

// 盤面更新の共通関数
function updateBoard(index, mark) {
    boardState[index] = mark;
    document.querySelector(`.cell[data-index='${index}']`).textContent = mark;
}

// ターン交代の共通関数
function switchTurn() {
    currentPlayer = currentPlayer === '〇' ? '×' : '〇';
    statusElement.textContent = `次のターン: ${currentPlayer}`;
}

// AIの手を打つ関数 (※バックエンド接続部分は未実装)
function aiMove() {
    // ここで空いているマスからランダムに選ぶ「簡単」レベルのAIを実装
    let availableCells = [];
    boardState.forEach((cell, index) => {
        if (cell === '') {
            availableCells.push(index);
        }
    });

    if (availableCells.length > 0) {
        const move = availableCells[Math.floor(Math.random() * availableCells.length)];
        updateBoard(move, aiMark);
        
        if (checkEndCondition()) {
            return;
        }
        
        switchTurn();
    }
}

// 勝敗・引き分け判定の共通関数
function checkEndCondition() {
    const isWin = checkWin();
    if (isWin) {
        statusElement.textContent = `勝者: ${currentPlayer}`;
        gameActive = false;
        return true;
    }

    const isDraw = boardState.every(cell => cell !== '');
    if (isDraw) {
        statusElement.textContent = '引き分け';
        gameActive = false;
        return true;
    }
    return false;
}

// (checkWin関数や盤面生成のコードは前回と同じなので省略)
// ...
// 盤面生成ループ
for (let i = 0; i < 16; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.addEventListener('click', handleCellClick);
    boardElement.appendChild(cell);
}
// ...