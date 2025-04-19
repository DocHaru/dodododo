// DOM元素
const elements = {
  bgm: document.getElementById("bgm"),
  comboSound: document.getElementById("combo-sound"),
  clickSound: document.getElementById("click-sound"),
  startBtn: document.getElementById("start-btn"),
  musicBtn: document.getElementById("music-btn"),
  boardEl: document.getElementById("board"),
  resultEl: document.getElementById("result"),
  scoreEl: document.getElementById("score"),
  highScoreEl: document.getElementById("high-score"),
  timerEl: document.getElementById("timer"),
  finalScoreEl: document.getElementById("final-score")
};

// 游戏状态
const state = {
  score: 0,
  timer: 120,
  board: [],
  selected: null,
  combo: 0,
  timerInterval: null,
  musicOn: true,
  highScore: localStorage.getItem('highScore') || 0,
  isInitialMatch: true
};

// 初始化游戏
function initGame() {
  state.score = 0;
  state.timer = 120;
  state.combo = 0;
  state.selected = null;
  state.isInitialMatch = true;
  
  elements.scoreEl.textContent = state.score;
  elements.timerEl.textContent = state.timer;
  elements.finalScoreEl.textContent = state.score;
  elements.resultEl.classList.add("hidden");
  elements.startBtn.textContent = "游戏中...";
  
  clearInterval(state.timerInterval);
  elements.boardEl.innerHTML = "";
  generateBoard();
  
  state.timerInterval = setInterval(() => {
    state.timer--;
    elements.timerEl.textContent = state.timer;
    if (state.timer <= 0) endGame();
  }, 1000);
}

// 生成游戏棋盘
function generateBoard() {
  state.board = [];
  for (let i = 0; i < 6; i++) {
    state.board[i] = [];
    for (let j = 0; j < 6; j++) {
      const cell = createCell(i, j, Math.floor(Math.random() * 5));
      state.board[i][j] = cell;
      elements.boardEl.appendChild(cell.el);
    }
  }
  
  setTimeout(() => {
    resolveMatches();
    state.isInitialMatch = false;
  }, 100);
}

// 创建单元格 - 简化版
function createCell(row, col, type) {
  const el = document.createElement("div");
  el.className = "cell";
  const img = document.createElement("img");
  img.src = `assets/icon${type}.png`;
  el.append(img);
  el.onclick = () => handleClick(row, col);
  return { row, col, type, el };
}

// 处理点击事件
function handleClick(row, col) {
  const current = state.board[row][col];
  
  if (!state.selected) {
    state.selected = current;
    current.el.classList.add("selected");
    return;
  }

  if (state.selected === current) {
    state.selected.el.classList.remove("selected");
    state.selected = null;
    return;
  }

  if (!isAdjacent(state.selected, current)) {
    state.selected.el.classList.remove("selected");
    state.selected = current;
    current.el.classList.add("selected");
    return;
  }

  swapCells(state.selected, current);
  const hadMatch = hasMatch();

  if (!hadMatch) {
    setTimeout(() => swapCells(state.selected, current), 200);
  } else {
    resolveMatches();
  }

  state.selected.el.classList.remove("selected");
  state.selected = null;
}

// 检查相邻
function isAdjacent(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

// 交换单元格
function swapCells(a, b) {
  [a.type, b.type] = [b.type, a.type];
  a.el.firstChild.src = `assets/icon${a.type}.png`;
  b.el.firstChild.src = `assets/icon${b.type}.png`;
}

// 检查匹配
function hasMatch() {
  return findMatches().length > 0;
}

// 查找所有匹配
function findMatches() {
  const matches = [];
  
  // 横向检测
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 4; j++) {
      if (state.board[i][j].type === state.board[i][j+1].type && 
          state.board[i][j].type === state.board[i][j+2].type) {
        matches.push([state.board[i][j], state.board[i][j+1], state.board[i][j+2]]);
      }
    }
  }
  
  // 纵向检测
  for (let j = 0; j < 6; j++) {
    for (let i = 0; i < 4; i++) {
      if (state.board[i][j].type === state.board[i+1][j].type && 
          state.board[i][j].type === state.board[i+2][j].type) {
        matches.push([state.board[i][j], state.board[i+1][j], state.board[i+2][j]]);
      }
    }
  }
  
  return matches;
}

// 解析匹配 - 简化版
function resolveMatches() {
  const matches = findMatches();
  if (matches.length === 0) {
    if (state.combo > 1) elements.comboSound.play();
    state.combo = 0;
    return;
  }

  if (!state.isInitialMatch) {
    state.combo++;
    state.score += matches.length * 30 * (state.combo > 1 ? state.combo : 1);
    elements.scoreEl.textContent = state.score;
    
    (state.combo > 1 ? elements.comboSound : elements.clickSound).play();
    if (state.combo > 1) animateCombo(state.combo);
  }

  // 直接标记需要消除的单元格
  const matched = new Set();
  matches.flat().forEach(cell => {
    matched.add(cell);
    cell.type = -1;
  });

  // 简化流程：立即执行下落和填充
  collapseAndRefill();
  
  // 检查是否有新的匹配
  setTimeout(resolveMatches, 200);
}

// 合并下落和填充逻辑
function collapseAndRefill() {
  // 下落逻辑
  for (let j = 0; j < 6; j++) {
    let empty = 0;
    for (let i = 5; i >= 0; i--) {
      if (state.board[i][j].type === -1) {
        empty++;
      } else if (empty > 0) {
        const target = i + empty;
        state.board[target][j].type = state.board[i][j].type;
        state.board[i][j].type = -1;
        state.board[target][j].el.firstChild.src = `assets/icon${state.board[target][j].type}.png`;
      }
    }
  }
  
  // 填充新图标
  for (let j = 0; j < 6; j++) {
    for (let i = 0; i < 6; i++) {
      if (state.board[i][j].type === -1) {
        state.board[i][j].type = Math.floor(Math.random() * 5);
        state.board[i][j].el.firstChild.src = `assets/icon${state.board[i][j].type}.png`;
      }
    }
  }
}

// 结束游戏
function endGame() {
  clearInterval(state.timerInterval);
  
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('highScore', state.highScore);
    elements.highScoreEl.textContent = state.highScore;
  }
  
  elements.finalScoreEl.textContent = state.score;
  elements.resultEl.classList.remove("hidden");
  elements.startBtn.textContent = "再来一盘";
}

// Combo动画
function animateCombo(combo) {
  const el = document.getElementById("combo");
  el.textContent = `Combo x${combo}!`;
  el.style.opacity = 1;
  el.style.transform = "translate(-50%, -50%) scale(1.3)";
  setTimeout(() => {
    el.style.opacity = 0;
    el.style.transform = "translate(-50%, -50%) scale(1)";
  }, 1000);
}

// 音乐控制
function initAudio() {
  elements.bgm.loop = true;
  elements.bgm.volume = 0.5;
  elements.bgm.muted = !state.musicOn;
  elements.musicBtn.textContent = state.musicOn ? "🔊" : "🔇";
  
  document.addEventListener('click', function autoPlay() {
    elements.bgm.play().catch(console.error);
    document.removeEventListener('click', autoPlay);
  });
}

// 预加载图片
function preloadImages() {
  for (let i = 0; i < 5; i++) {
    new Image().src = `assets/icon${i}.png`;
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  elements.highScoreEl.textContent = state.highScore;
  initAudio();
  preloadImages();
  
  elements.startBtn.onclick = initGame;
  elements.musicBtn.onclick = function() {
    state.musicOn = !state.musicOn;
    elements.bgm.muted = !state.musicOn;
    this.textContent = state.musicOn ? "🔊" : "🔇";
    if (state.musicOn) elements.bgm.play().catch(console.error);
  };
});
