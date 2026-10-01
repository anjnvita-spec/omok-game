(function () {
  "use strict";

  const BOARD_SIZE = 15;
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;
  const CELL_SIZE = 34;
  const PADDING = 20;
  const WIN_SCORE = 10000000;

  const DIRECTIONS = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  /** @type {number[][]} */
  let board = [];
  let currentPlayer = BLACK;
  let gameMode = null; // 'pvp' | 'pvai'
  let aiLevel = 1;
  let aiColor = WHITE;
  let humanColor = BLACK;
  let gameOver = false;
  let lastMove = null;

  const screenMode = document.getElementById("screen-mode");
  const screenDifficulty = document.getElementById("screen-difficulty");
  const screenGame = document.getElementById("screen-game");
  const boardEl = document.getElementById("board");
  const statusText = document.getElementById("status-text");

  function showScreen(screen) {
    [screenMode, screenDifficulty, screenGame].forEach((s) => s.classList.add("hidden"));
    screen.classList.remove("hidden");
  }

  function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(EMPTY));
  }

  function inBounds(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  // ---------- Board rendering ----------

  function buildBoardDom() {
    boardEl.innerHTML = "";
    const span = CELL_SIZE * (BOARD_SIZE - 1);
    boardEl.style.width = span + PADDING * 2 + "px";
    boardEl.style.height = span + PADDING * 2 + "px";

    for (let i = 0; i < BOARD_SIZE; i++) {
      const hLine = document.createElement("div");
      hLine.className = "board-line h";
      hLine.style.left = PADDING + "px";
      hLine.style.top = PADDING + i * CELL_SIZE + "px";
      hLine.style.width = span + "px";
      boardEl.appendChild(hLine);

      const vLine = document.createElement("div");
      vLine.className = "board-line v";
      vLine.style.top = PADDING + "px";
      vLine.style.left = PADDING + i * CELL_SIZE + "px";
      vLine.style.height = span + "px";
      boardEl.appendChild(vLine);
    }

    const starPoints = [3, 7, 11];
    starPoints.forEach((r) => {
      starPoints.forEach((c) => {
        const star = document.createElement("div");
        star.className = "board-star";
        star.style.left = PADDING + c * CELL_SIZE + "px";
        star.style.top = PADDING + r * CELL_SIZE + "px";
        boardEl.appendChild(star);
      });
    });

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        cell.style.width = CELL_SIZE + "px";
        cell.style.height = CELL_SIZE + "px";
        cell.style.left = PADDING + c * CELL_SIZE - CELL_SIZE / 2 + "px";
        cell.style.top = PADDING + r * CELL_SIZE - CELL_SIZE / 2 + "px";
        cell.addEventListener("click", () => onCellClick(r, c));
        boardEl.appendChild(cell);
      }
    }
  }

  function renderStones() {
    const cells = boardEl.querySelectorAll(".cell");
    cells.forEach((cell) => {
      const r = Number(cell.dataset.row);
      const c = Number(cell.dataset.col);
      cell.innerHTML = "";
      cell.classList.remove("last-move");
      const value = board[r][c];
      if (value !== EMPTY) {
        const stone = document.createElement("div");
        stone.className = "stone " + (value === BLACK ? "black" : "white");
        stone.style.width = CELL_SIZE * 0.82 + "px";
        stone.style.height = CELL_SIZE * 0.82 + "px";
        cell.appendChild(stone);
        if (lastMove && lastMove[0] === r && lastMove[1] === c) {
          cell.classList.add("last-move");
        }
      } else {
        const preview = document.createElement("div");
        preview.className = "stone-preview " + (currentPlayer === BLACK ? "black" : "white");
        preview.style.width = CELL_SIZE * 0.82 + "px";
        preview.style.height = CELL_SIZE * 0.82 + "px";
        cell.appendChild(preview);
      }
    });
  }

  function updateStatus(message) {
    statusText.textContent = message;
  }

  // ---------- Game flow ----------

  function startGame(mode) {
    gameMode = mode;
    board = createEmptyBoard();
    currentPlayer = BLACK;
    gameOver = false;
    lastMove = null;
    humanColor = BLACK;
    aiColor = WHITE;
    buildBoardDom();
    renderStones();
    showScreen(screenGame);
    updateStatus("흑돌 차례입니다");
  }

  function onCellClick(r, c) {
    if (gameOver) return;
    if (board[r][c] !== EMPTY) return;
    if (gameMode === "pvai" && currentPlayer !== humanColor) return;

    placeStone(r, c, currentPlayer);
  }

  function placeStone(r, c, color) {
    board[r][c] = color;
    lastMove = [r, c];
    renderStones();

    if (checkWin(r, c, color)) {
      gameOver = true;
      const label = color === BLACK ? "흑돌" : "백돌";
      if (gameMode === "pvai") {
        const who = color === humanColor ? "플레이어" : "AI";
        updateStatus(`${label}(${who}) 승리!`);
      } else {
        updateStatus(`${label} 승리!`);
      }
      return;
    }

    if (isBoardFull()) {
      gameOver = true;
      updateStatus("무승부입니다");
      return;
    }

    currentPlayer = color === BLACK ? WHITE : BLACK;
    updateStatus((currentPlayer === BLACK ? "흑돌" : "백돌") + " 차례입니다");

    if (gameMode === "pvai" && currentPlayer === aiColor && !gameOver) {
      updateStatus("AI가 생각 중입니다...");
      setTimeout(() => {
        const move = getAiMove(aiLevel, aiColor, humanColor);
        if (move) {
          placeStone(move[0], move[1], aiColor);
        }
      }, 150);
    }
  }

  function isBoardFull() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === EMPTY) return false;
      }
    }
    return true;
  }

  function checkWin(r, c, color) {
    for (const [dr, dc] of DIRECTIONS) {
      let count = 1;
      let rr = r + dr,
        cc = c + dc;
      while (inBounds(rr, cc) && board[rr][cc] === color) {
        count++;
        rr += dr;
        cc += dc;
      }
      rr = r - dr;
      cc = c - dc;
      while (inBounds(rr, cc) && board[rr][cc] === color) {
        count++;
        rr -= dr;
        cc -= dc;
      }
      if (count >= 5) return true;
    }
    return false;
  }

  // ---------- AI ----------

  function patternScore(count, openEnds) {
    if (count >= 5) return WIN_SCORE;
    if (count === 4) {
      if (openEnds === 2) return 1000000;
      if (openEnds === 1) return 100000;
      return 0;
    }
    if (count === 3) {
      if (openEnds === 2) return 10000;
      if (openEnds === 1) return 1000;
      return 0;
    }
    if (count === 2) {
      if (openEnds === 2) return 100;
      if (openEnds === 1) return 10;
      return 0;
    }
    if (count === 1) {
      return openEnds === 2 ? 1 : 0;
    }
    return 0;
  }

  function evaluateColor(b, color) {
    let score = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (b[r][c] !== color) continue;
        for (const [dr, dc] of DIRECTIONS) {
          const pr = r - dr,
            pc = c - dc;
          if (inBounds(pr, pc) && b[pr][pc] === color) continue; // not the start of this line
          let count = 0;
          let rr = r,
            cc = c;
          while (inBounds(rr, cc) && b[rr][cc] === color) {
            count++;
            rr += dr;
            cc += dc;
          }
          const openStart = inBounds(pr, pc) && b[pr][pc] === EMPTY;
          const openEnd = inBounds(rr, cc) && b[rr][cc] === EMPTY;
          const openEnds = (openStart ? 1 : 0) + (openEnd ? 1 : 0);
          score += patternScore(count, openEnds);
        }
      }
    }
    return score;
  }

  function boardScore(b, forColor) {
    const otherColor = forColor === BLACK ? WHITE : BLACK;
    return evaluateColor(b, forColor) - evaluateColor(b, otherColor);
  }

  function getCandidateMoves(b, radius) {
    const candidates = new Set();
    let hasStone = false;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (b[r][c] === EMPTY) continue;
        hasStone = true;
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            const rr = r + dr,
              cc = c + dc;
            if (inBounds(rr, cc) && b[rr][cc] === EMPTY) {
              candidates.add(rr * BOARD_SIZE + cc);
            }
          }
        }
      }
    }
    if (!hasStone) {
      const mid = Math.floor(BOARD_SIZE / 2);
      return [[mid, mid]];
    }
    return Array.from(candidates).map((v) => [Math.floor(v / BOARD_SIZE), v % BOARD_SIZE]);
  }

  function orderedCandidates(b, color, radius, limit) {
    const otherColor = color === BLACK ? WHITE : BLACK;
    const moves = getCandidateMoves(b, radius);
    const scored = moves.map(([r, c]) => {
      b[r][c] = color;
      const s = boardScore(b, color);
      b[r][c] = EMPTY;
      return { r, c, s };
    });
    scored.sort((a, b2) => b2.s - a.s);
    return scored.slice(0, limit).map((m) => [m.r, m.c]);
  }

  function minimax(b, depth, alpha, beta, maximizing, aiC, humanC) {
    if (depth === 0) {
      return boardScore(b, aiC);
    }
    const turnColor = maximizing ? aiC : humanC;
    const candidates = orderedCandidates(b, turnColor, 2, 6);
    if (candidates.length === 0) {
      return boardScore(b, aiC);
    }

    if (maximizing) {
      let best = -Infinity;
      for (const [r, c] of candidates) {
        b[r][c] = turnColor;
        const val = minimax(b, depth - 1, alpha, beta, false, aiC, humanC);
        b[r][c] = EMPTY;
        best = Math.max(best, val);
        alpha = Math.max(alpha, val);
        if (val >= WIN_SCORE) break;
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const [r, c] of candidates) {
        b[r][c] = turnColor;
        const val = minimax(b, depth - 1, alpha, beta, true, aiC, humanC);
        b[r][c] = EMPTY;
        best = Math.min(best, val);
        beta = Math.min(beta, val);
        if (val <= -WIN_SCORE) break;
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  function getAiMove(level, aiC, humanC) {
    const candidates = getCandidateMoves(board, 2);
    if (candidates.length === 0) return null;

    // Immediate winning move for the AI.
    for (const [r, c] of candidates) {
      board[r][c] = aiC;
      const win = checkWin(r, c, aiC);
      board[r][c] = EMPTY;
      if (win) return [r, c];
    }
    // Immediate move to block the opponent's winning move.
    for (const [r, c] of candidates) {
      board[r][c] = humanC;
      const win = checkWin(r, c, humanC);
      board[r][c] = EMPTY;
      if (win) return [r, c];
    }

    if (level <= 3) {
      const noiseScale = level === 1 ? 6000 : level === 2 ? 1500 : 0;
      let best = null;
      let bestScore = -Infinity;
      for (const [r, c] of candidates) {
        board[r][c] = aiC;
        let score = boardScore(board, aiC);
        board[r][c] = EMPTY;
        score += (Math.random() - 0.5) * noiseScale;
        if (score > bestScore) {
          bestScore = score;
          best = [r, c];
        }
      }
      return best;
    }

    // Levels 4-5: minimax with alpha-beta pruning.
    const depth = level === 4 ? 2 : 4;
    const branchLimit = level === 4 ? 8 : 6;
    const topCandidates = orderedCandidates(board, aiC, 2, branchLimit);

    let best = topCandidates[0] || candidates[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    for (const [r, c] of topCandidates) {
      board[r][c] = aiC;
      const score = minimax(board, depth - 1, alpha, beta, false, aiC, humanC);
      board[r][c] = EMPTY;
      if (score > bestScore) {
        bestScore = score;
        best = [r, c];
      }
      alpha = Math.max(alpha, score);
    }
    return best;
  }

  // ---------- Event wiring ----------

  document.getElementById("btn-pvp").addEventListener("click", () => {
    startGame("pvp");
  });

  document.getElementById("btn-pvai").addEventListener("click", () => {
    showScreen(screenDifficulty);
  });

  document.getElementById("btn-back-to-mode").addEventListener("click", () => {
    showScreen(screenMode);
  });

  document.querySelectorAll("#screen-difficulty [data-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      aiLevel = Number(btn.dataset.level);
      startGame("pvai");
    });
  });

  document.getElementById("btn-restart").addEventListener("click", () => {
    startGame(gameMode);
  });

  document.getElementById("btn-change-mode").addEventListener("click", () => {
    showScreen(screenMode);
  });
})();
