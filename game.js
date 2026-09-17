/* ---------- hidden program: NEURO-MATCH ---------- */

(() => {
  const root = document.getElementById("game");
  if (!root) return;

  const boardEl = document.getElementById("g-board");
  const veil = document.getElementById("g-veil");
  const veilTitle = document.getElementById("g-veil-title");
  const veilNote = document.getElementById("g-veil-note");
  const startBtn = document.getElementById("g-start");
  const restartBtn = document.getElementById("g-restart");
  const closeBtn = root.querySelector(".game-close");
  const msgEl = document.getElementById("g-msg");
  const scoreEl = document.getElementById("g-score");
  const chainEl = document.getElementById("g-chain");
  const timeEl = document.getElementById("g-time");
  const bestEl = document.getElementById("g-best");
  const timeItem = timeEl.closest("li");

  const SIZE = 8;
  const ROUND = 60;
  const STORE = "neuro-match-best";
  const KINDS = [
    { id: "a", glyph: "◆" },
    { id: "b", glyph: "▲" },
    { id: "c", glyph: "●" },
    { id: "d", glyph: "■" },
    { id: "e", glyph: "✦" },
  ];

  const INTRO =
    "Swap two neighbouring nodes to line up three or more.<br>" +
    "Chains score higher. You have 60 seconds.";

  let grid = [];
  let selected = null;
  let busy = false;
  let running = false;
  let score = 0;
  let timeLeft = ROUND;
  let timerId = null;
  let best = 0;

  try {
    best = Number(localStorage.getItem(STORE) || 0);
  } catch (error) {
    best = 0;
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const rand = (n) => Math.floor(Math.random() * n);

  const setMsg = (text, hit) => {
    msgEl.textContent = text;
    msgEl.classList.toggle("hit", Boolean(hit));
  };

  /* ----- board model ----- */

  const place = (tile, r, c) => {
    tile.r = r;
    tile.c = c;
    tile.el.style.setProperty("--r", r);
    tile.el.style.setProperty("--c", c);
  };

  const makeTile = (r, c, kindIndex, fromRow) => {
    const kind = KINDS[kindIndex];
    const el = document.createElement("span");
    el.className = `tile k-${kind.id} drop`;
    el.innerHTML = `<i>${kind.glyph}</i>`;
    el.style.setProperty("--r", fromRow === undefined ? r : fromRow);
    el.style.setProperty("--c", c);
    boardEl.appendChild(el);

    const tile = { kind: kind.id, el, r, c };
    el.tile = tile;
    return tile;
  };

  const kindsOf = () => grid.map((row) => row.map((tile) => (tile ? tile.kind : null)));

  const matchesIn = (kinds) => {
    const hits = new Set();

    for (let r = 0; r < SIZE; r += 1) {
      let run = 1;
      for (let c = 1; c <= SIZE; c += 1) {
        const same = c < SIZE && kinds[r][c] && kinds[r][c] === kinds[r][c - 1];
        if (same) {
          run += 1;
          continue;
        }
        if (run >= 3) for (let k = c - run; k < c; k += 1) hits.add(`${r}:${k}`);
        run = 1;
      }
    }

    for (let c = 0; c < SIZE; c += 1) {
      let run = 1;
      for (let r = 1; r <= SIZE; r += 1) {
        const same = r < SIZE && kinds[r][c] && kinds[r][c] === kinds[r - 1][c];
        if (same) {
          run += 1;
          continue;
        }
        if (run >= 3) for (let k = r - run; k < r; k += 1) hits.add(`${k}:${c}`);
        run = 1;
      }
    }

    return hits;
  };

  const findMatches = () => matchesIn(kindsOf());

  const hasMove = () => {
    const kinds = kindsOf();

    const test = (ar, ac, br, bc) => {
      const keep = kinds[ar][ac];
      kinds[ar][ac] = kinds[br][bc];
      kinds[br][bc] = keep;
      const found = matchesIn(kinds).size > 0;
      kinds[br][bc] = kinds[ar][ac];
      kinds[ar][ac] = keep;
      return found;
    };

    for (let r = 0; r < SIZE; r += 1) {
      for (let c = 0; c < SIZE; c += 1) {
        if (c + 1 < SIZE && test(r, c, r, c + 1)) return true;
        if (r + 1 < SIZE && test(r, c, r + 1, c)) return true;
      }
    }

    return false;
  };

  const build = () => {
    boardEl.innerHTML = "";
    grid = [];

    for (let r = 0; r < SIZE; r += 1) {
      grid[r] = [];
      for (let c = 0; c < SIZE; c += 1) {
        let k;
        do {
          k = rand(KINDS.length);
        } while (
          (c >= 2 && grid[r][c - 1].kind === KINDS[k].id && grid[r][c - 2].kind === KINDS[k].id) ||
          (r >= 2 && grid[r - 1][c].kind === KINDS[k].id && grid[r - 2][c].kind === KINDS[k].id)
        );
        grid[r][c] = makeTile(r, c, k);
      }
    }

    if (!hasMove()) build();
  };

  /* ----- scoring loop ----- */

  const popBurst = (hits, gain) => {
    let sumR = 0;
    let sumC = 0;
    hits.forEach((id) => {
      const [r, c] = id.split(":").map(Number);
      sumR += r;
      sumC += c;
    });

    const el = document.createElement("span");
    el.className = "burst";
    el.textContent = `+${gain}`;
    el.style.setProperty("--r", Math.round(sumR / hits.size));
    el.style.setProperty("--c", Math.round(sumC / hits.size));
    boardEl.appendChild(el);
    setTimeout(() => el.remove(), 720);
  };

  const collapse = () => {
    for (let c = 0; c < SIZE; c += 1) {
      let write = SIZE - 1;

      for (let r = SIZE - 1; r >= 0; r -= 1) {
        const tile = grid[r][c];
        if (!tile) continue;
        if (write !== r) {
          grid[write][c] = tile;
          grid[r][c] = null;
          place(tile, write, c);
        }
        write -= 1;
      }

      let from = -1;
      for (let r = write; r >= 0; r -= 1) {
        const tile = makeTile(r, c, rand(KINDS.length), from);
        grid[r][c] = tile;
        from -= 1;
        requestAnimationFrame(() => requestAnimationFrame(() => place(tile, r, c)));
      }
    }
  };

  const resolve = async () => {
    busy = true;
    let chain = 0;

    for (;;) {
      const hits = findMatches();
      if (!hits.size) break;

      chain += 1;
      const gain = hits.size * 12 * chain;
      score += gain;
      scoreEl.textContent = score;
      chainEl.textContent = `x${chain}`;
      setMsg(chain > 1 ? `+${gain} · chain x${chain}` : `+${gain}`, true);
      popBurst(hits, gain);

      hits.forEach((id) => {
        const [r, c] = id.split(":").map(Number);
        const tile = grid[r][c];
        grid[r][c] = null;
        tile.el.classList.add("pop");
        setTimeout(() => tile.el.remove(), 220);
      });

      await wait(200);
      collapse();
      await wait(240);
    }

    chainEl.textContent = "x1";

    if (running && !hasMove()) {
      setMsg("No moves left — reshuffling.", false);
      build();
      await wait(240);
    }

    busy = false;
  };

  const swapCells = (a, b) => {
    const ar = a.r;
    const ac = a.c;
    const br = b.r;
    const bc = b.c;

    grid[ar][ac] = b;
    grid[br][bc] = a;
    place(a, br, bc);
    place(b, ar, ac);
  };

  const trySwap = async (a, b) => {
    busy = true;
    swapCells(a, b);
    await wait(190);

    if (!findMatches().size) {
      swapCells(a, b);
      a.el.classList.add("bad");
      b.el.classList.add("bad");
      await wait(320);
      a.el.classList.remove("bad");
      b.el.classList.remove("bad");
      setMsg("That swap makes no line.", false);
      busy = false;
      return;
    }

    await resolve();
  };

  /* ----- round control ----- */

  const startRound = () => {
    clearInterval(timerId);
    score = 0;
    timeLeft = ROUND;
    selected = null;
    busy = false;
    running = true;

    scoreEl.textContent = "0";
    chainEl.textContent = "x1";
    timeEl.textContent = ROUND;
    bestEl.textContent = best;
    timeItem.classList.remove("warn");

    build();
    veil.hidden = true;
    setMsg("Click a node, then click a neighbour.", false);

    timerId = setInterval(() => {
      timeLeft -= 1;
      timeEl.textContent = Math.max(timeLeft, 0);
      timeItem.classList.toggle("warn", timeLeft <= 10);
      if (timeLeft <= 0) endRound();
    }, 1000);
  };

  const endRound = () => {
    clearInterval(timerId);
    running = false;
    selected = null;

    const isBest = score > best;
    if (isBest) {
      best = score;
      try {
        localStorage.setItem(STORE, String(best));
      } catch (error) {
        /* storage unavailable — keep the score in memory only */
      }
    }

    bestEl.textContent = best;
    veilTitle.textContent = isBest ? "NEW BEST" : "TIME OUT";
    veilNote.innerHTML = `Score <em>${score}</em><br>Best <em>${best}</em>`;
    startBtn.textContent = "RUN AGAIN";
    veil.hidden = false;
    setMsg("Session closed.", false);
  };

  const open = () => {
    if (!root.hidden) return;
    root.hidden = false;
    document.body.classList.add("game-open");

    running = false;
    busy = false;
    selected = null;
    clearInterval(timerId);

    score = 0;
    scoreEl.textContent = "0";
    chainEl.textContent = "x1";
    timeEl.textContent = ROUND;
    bestEl.textContent = best;
    timeItem.classList.remove("warn");

    build();
    veilTitle.textContent = "NEURO-MATCH";
    veilNote.innerHTML = INTRO;
    startBtn.textContent = "INITIALISE";
    veil.hidden = false;
    setMsg("Hidden program loaded.", false);
    startBtn.focus();
  };

  const close = () => {
    clearInterval(timerId);
    running = false;
    root.hidden = true;
    document.body.classList.remove("game-open");
  };

  /* ----- input ----- */

  boardEl.addEventListener("pointerdown", (event) => {
    if (!running || busy) return;

    const el = event.target.closest(".tile");
    if (!el || !el.tile) return;

    const tile = el.tile;

    if (!selected) {
      selected = tile;
      el.classList.add("sel");
      return;
    }

    const first = selected;
    first.el.classList.remove("sel");
    selected = null;

    if (first === tile) return;

    const step = Math.abs(first.r - tile.r) + Math.abs(first.c - tile.c);
    if (step !== 1) {
      selected = tile;
      el.classList.add("sel");
      return;
    }

    trySwap(first, tile);
  });

  startBtn.addEventListener("click", startRound);
  restartBtn.addEventListener("click", startRound);
  closeBtn.addEventListener("click", close);

  root.addEventListener("pointerdown", (event) => {
    if (event.target === root) close();
  });

  document.querySelector(".secret")?.addEventListener("click", open);

  const CODE = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a",
  ];
  let step = 0;

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !root.hidden) {
      close();
      return;
    }

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    if (key === CODE[step]) {
      step += 1;
      if (step === CODE.length) {
        step = 0;
        open();
      }
      return;
    }

    step = key === CODE[0] ? 1 : 0;
  });
})();
