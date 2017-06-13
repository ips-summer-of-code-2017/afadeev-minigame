'use strict';

const Direction = {
  Right: "right",
  Up: "up",
  Left: "left",
  Down: "down",
}

const GameStatus = {
  InProgress: "inProgress",
  Won: "won",
  Continued: "continued",
  Lost: "lost",
}

const TileStatus = {
  Empty: "empty",
  Spawned: "spawned",
  Still: "still",
  Moved: "moved",
  Merged: "merged",
}

class Tile {
  constructor(index) {
    this.index = index;
    this.reset();
  }

  reset() {
    this.level = null;
    this.prevIndex = null;
    this.prevLevel = null;
    this.status = TileStatus.Empty;
  }

  get isEmpty() {
    return (this.status == TileStatus.Empty);
  }

  get ableToMerge() {
    return (this.status != TileStatus.Merged && this.status != TileStatus.Empty);
  }

  get value() {
    if (this.isEmpty) {
      return null;
    } else {
      return Math.pow(2, this.level);
    }
  }

  prepareForMove() {
    if (!this.isEmpty) {
      this.prevIndex = [this.index];
      this.prevLevel = [this.level];
      this.status = TileStatus.Still;
    }
  }

  spawn() {
    // 90% chance to get 2 and 10% chance to get 4
    this.level = 1 + Math.floor(10 * Math.random() / 9);
    this.status = TileStatus.Spawned;
  }

  mergeWith(tile) {
    if (!this.isEmpty) {
      tile.level++;
      tile.prevIndex.push(this.prevIndex[0]);
      tile.prevLevel.push(this.prevLevel[0]);
      tile.status = TileStatus.Merged;
      this.reset();
    }
  }

  moveTo(tile) {
    if (!this.isEmpty) {
      tile.level = this.level;
      tile.prevLevel = this.prevLevel;
      tile.prevIndex = this.prevIndex;
      tile.status = TileStatus.Moved;
      this.reset();
    }
  }

  equals(tile) {
    return (this.index === tile.index && this.level === tile.level);
  }

  get copy() {
    let copiedTile = new Tile(this.index);
    copiedTile.level = this.level;
    copiedTile.prevLevel = this.prevLevel;
    copiedTile.prevIndex = this.prevIndex;
    copiedTile.status = this.status;
    return copiedTile;
  }
}

class GameState {
  constructor(rows, columns, targetTileLevel) {
    this.rows = rows;
    this.columns = columns;
    this.targetTileLevel = targetTileLevel;
    this.tiles = [];
    for (let index = 0; index < this.boardSize; index++) {
      this.tiles.push(new Tile(index));
    }
    this.score = 0;
    this.status = GameStatus.InProgress;
    this.spawnTile();
    this.spawnTile();
  }

  // @returns random integer from range [0..n)
  random(n) {
    return Math.min(n - 1, Math.floor(Math.random() * n));
  }

  get boardSize() {
    return (this.rows * this.columns);
  }

  isInsideBoard(index) {
    return (0 <= index && index < this.boardSize);
  }

  areNeighboring(index1, index2) {
    const dRow = Math.floor(index2 / this.columns) - Math.floor(index1 / this.columns);
    const dCol = index2 % this.columns - index1 % this.columns;
    return (Math.abs(dRow) == 1 && Math.abs(dCol) == 0 || Math.abs(dRow) == 0 && Math.abs(dCol) == 1);
  }

  // returns true if there are no empty tiles on board
  get isFull() {
    let result = true;
    for (let index = 0; index < this.boardSize; index++) {
      if (this.tiles[index].isEmpty) {
        result = false;
        break;
      }
    }
    return result;
  }

  get copy() {
    let copiedState = new GameState(this.rows, this.columns);
    copiedState.score = this.score;
    copiedState.tiles = [];
    for (let index = 0; index < this.boardSize; index++) {
      copiedState.tiles.push(this.tiles[index].copy);
    }
    return copiedState;
  }

  equals(state) {
    let result = (this.score === state.score && this.rows === state.rows && this.columns === state.columns);
    if (result) {
      for (let index = 0; index < this.boardSize; index++) {
        if (!this.tiles[index].equals(state.tiles[index])) {
          result = false;
          break;
        }
      }
    }
    return result;
  }

  get gameOver() {
    let dead = this.isFull;
    if (dead) {
      for (let dir in Direction) {
        if (this.copy.move(Direction[dir])) {
          dead = false;
          break;
        }
      }
    }
    return dead;
  }

  get goalReached() {
    let won = false;
    for (let index = 0; index < this.boardSize; index++) {
      if (this.tiles[index].level >= this.targetTileLevel) {
        won = true;
        break;
      }
    }
    return won;
  }

  updateStatus() {
    if (this.gameOver) {
      this.status = GameStatus.Lost;
    } else if (this.status == GameStatus.InProgress && this.goalReached) {
      this.status = GameStatus.Won;
    } else if (this.status == GameStatus.Won) {
      this.status = GameStatus.Continued;
    }
  }

  spawnTile() {
    if (!this.isFull) {
      let index;
      do {
        index = this.random(this.boardSize);
      } while (!this.tiles[index].isEmpty);
      this.tiles[index].spawn();
    }
  }

  gravitateTile(index, indexChange) {
    const nextIndex = index + indexChange;
    let tile = this.tiles[index];
    let nextTile = this.tiles[nextIndex];
    if (this.isInsideBoard(nextIndex) && this.areNeighboring(index, nextIndex)) {
      if (!nextTile.isEmpty) {
        this.gravitateTile(nextIndex, indexChange);
      }
      if (nextTile.isEmpty) {
        tile.moveTo(nextTile);
        this.gravitateTile(nextIndex, indexChange);
      } else if (tile.ableToMerge && nextTile.ableToMerge && tile.level == nextTile.level) {
        tile.mergeWith(nextTile);
        this.score += nextTile.value;
      }
    }
  }

  gravitate(direction) {
    const indexChange = {
      right: 1,
      up: -this.columns,
      left: -1,
      down: this.columns,
    }

    for (let index = 0; index < this.boardSize; index++) {
      this.tiles[index].prepareForMove();
    }

    for (let index = 0; index < this.boardSize; index++) {
      this.gravitateTile(index, indexChange[direction]);
    }
  }

  move(direction) {
    let oldState = this.copy;
    this.gravitate(direction);
    if (!this.equals(oldState)) {
      this.spawnTile();
      this.updateStatus();
      return true;
    } else {
      return false;
    }
  }
}

class GameGraphics {
  constructor(canvas, rows, columns) {
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.rows = rows;
    this.columns = columns;
    this.marginToTileSizeRatio = 1 / 8;
    this.dimensions = { x: null, y: null };
    this.resize();
    window.addEventListener("resize", () => { this.resize(); });
  }

  resize() {
    const maxWidth = window.innerWidth - 100;
    const maxHeight = window.innerHeight - 100;
    const ratio = 1 / this.marginToTileSizeRatio;
    const aspectRatio = (1 + this.columns * (1 + ratio)) / (1 + this.rows * (1 + ratio));
    const width = Math.min(maxWidth, aspectRatio * maxHeight);
    const height = width / aspectRatio;

    this.margin = width / (1 + this.columns * (1 + ratio));
    this.tileSize = this.margin * ratio;
    this.canvas.style.width = width + "px";
    this.canvas.width = width;
    this.canvas.style.height = height + "px";
    this.canvas.height = height;
    this.dimensions = {
      x: width,
      y: height,
    };
  }

  drawRoundRectangle(x, y, width, height, color, radius = 0) {
    this.context.fillStyle = color;
    this.context.beginPath();
    let pointX = x + radius;
    let pointY = y;
    this.context.moveTo(pointX, pointY);

    pointX += width - 2 * radius;
    this.context.lineTo(pointX, pointY);

    pointY += radius;
    this.context.arc(pointX, pointY, radius, -Math.PI / 2, 0);

    pointX += radius;
    pointY += height - 2 * radius;
    this.context.lineTo(pointX, pointY);

    pointX -= radius;
    this.context.arc(pointX, pointY, radius, 0, Math.PI / 2);

    pointX -= width - 2 * radius;
    pointY += radius;
    this.context.lineTo(pointX, pointY);

    pointY -= radius;
    this.context.arc(pointX, pointY, radius, Math.PI / 2, Math.PI);

    pointX -= radius;
    pointY -= height - 2 * radius;
    this.context.lineTo(pointX, pointY);

    pointX += radius;
    this.context.arc(pointX, pointY, radius, Math.PI, 3 * Math.PI / 2);
    this.context.fill();
  }

  drawText(x, y, width, height, color, text) {
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    this.context.fillStyle = color;
    this.context.font = height * 2 / 3 + "px Arial";
    this.context.fillText(text, x + width / 2, y + height / 2, width);
  }

  drawBackground() {
    const dx = this.dimensions.x;
    const dy = this.dimensions.y;
    const marginColor = "#BBADA0";
    this.context.clearRect(0, 0, this.dimensions.x, this.dimensions.y);
    this.drawRoundRectangle(0, 0, dx, dy, marginColor, dx / 50);
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        const x = this.margin + col * (this.tileSize + this.margin);
        const y = this.margin + row * (this.tileSize + this.margin);
        const emptyTileColor = "#CDC1B4";
        this.drawRoundRectangle(x, y, this.tileSize, this.tileSize, emptyTileColor, this.tileSize / 25);
      }
    }
  }

  getTileColor(tileLevel) {
    const tileColors = [
      "#EEE4DA", //2
      "#EDE0C8", //4
      "#F2B179", //8
      "#F59563", //16
      "#F67C5F", //32
      "#F76E4F", //64
      "#EDCF72", //128
      "#EDCC61", //256
      "#EDC850", //512
      "#EDC53F", //1024
      "#EDC22E", //2048
    ];
    if (tileLevel > 11)
      return tileColors[10]; // 4096, 8192, ...
    else
      return tileColors[tileLevel - 1]; // 2, 4, ..., 2048
  }

  getTileText(tileLevel) {
    const multipliers = ["", "K", "M"];
    return Math.pow(2, tileLevel % 10).toString() + multipliers[Math.floor(tileLevel / 10)];
  }

  getTileTextColor(tileLevel) {
    if (tileLevel > 2)
      return "#F9F6F2"; // 8, 16, ...
    else
      return "#776E65"; // 2 or 4
  }

  drawTile(row, col, tileLevel, scale = 1) {
    const color = this.getTileColor(tileLevel);
    const text = this.getTileText(tileLevel);
    const textColor = this.getTileTextColor(tileLevel);
    const x = this.margin + col * (this.tileSize + this.margin) + this.tileSize / 2;
    const y = this.margin + row * (this.tileSize + this.margin) + this.tileSize / 2;
    const size = this.tileSize * scale;
    this.drawRoundRectangle(x - size / 2, y - size / 2, size, size, color, size / 25);
    this.drawText(x - size / 2, y - size / 2, size, size, textColor, text)
  }

  drawAnimatedTile(tile, animationProgress = 1) {
    const row = Math.floor(tile.index / this.columns);
    const col = tile.index % this.columns
    const movingPhaseEnd = .5;
    if (tile.status != TileStatus.Empty && tile.status != TileStatus.Spawned) {
      for (let id = 0; id < tile.prevIndex.length; id++) {
        const prevRow = Math.floor(tile.prevIndex[id] / this.columns);
        const prevCol = tile.prevIndex[id] % this.columns;
        const phaseProgress = Math.min(animationProgress / movingPhaseEnd, 1);
        const movementProgress = 3 * phaseProgress ** 2 - 2 * phaseProgress ** 3; // Smoothstep
        const tileRow = prevRow + (row - prevRow) * movementProgress;
        const tileCol = prevCol + (col - prevCol) * movementProgress;
        this.drawTile(tileRow, tileCol, tile.prevLevel[id]);
      }
    }
    const appearingPhaseStart = movingPhaseEnd;
    if (animationProgress > appearingPhaseStart) {
      const phaseProgress = (animationProgress - appearingPhaseStart) / (1 - appearingPhaseStart);
      if (tile.status == TileStatus.Spawned) {
        const scale = phaseProgress;
        this.drawTile(row, col, tile.level, scale);
      }
      if (tile.status == TileStatus.Merged) {
        const scale = -(phaseProgress ** 2) + phaseProgress + 1;
        this.drawTile(row, col, tile.level, scale);
      }
    }
  }

  drawTiles(state, animationProgress = 1) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        const index = row * this.columns + col;
        if (!state.tiles[index].isEmpty) {
          this.drawAnimatedTile(state.tiles[index], animationProgress);
        }
      }
    }
  }

  draw(state, animationProgress = 1) {
    this.drawBackground();
    this.drawTiles(state, animationProgress);
  }
}

class GameAnimationController {
  constructor(graphics) {
    this.graphics = graphics;
    this.animationProgress = 0;
    this.stateHistory = [];
    this.prevTime = new Date();
  }

  addState(state) {
    this.stateHistory.push(state.copy);
  }

  get animationStep() {
    const baseAnimationDuration = 0.2;
    const time = new Date();
    const FPS = 1000 / (time - this.prevTime);
    return (this.stateHistory.length / baseAnimationDuration / FPS);
  }

  advance() {
    if (this.stateHistory.length != 1 || this.animationProgress != 1) {
      if (this.animationProgress == 1) {
        this.animationProgress = 0;
        this.stateHistory.shift();
      }
      this.animationProgress += this.animationStep;
      if (this.animationProgress > 1) {
        this.animationProgress = 1;
      }
    }
    this.prevTime = new Date();
  }

  draw() {
    this.advance();
    this.graphics.draw(this.stateHistory[0], this.animationProgress);
  }
}

class GameOverlay {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.settings = {
      inProgress: {
        textHidden: true,
        color: { r: 255, g: 255, b: 255, a: 0 }
      },
      continued: {
        textHidden: true,
        color: { r: 255, g: 255, b: 255, a: 0 }
      },
      won: {
        textHidden: false,
        text: "You win!",
        textColor: "#F8F5F1",
        color: { r: 237, g: 194, b: 46, a: 0.5 }
      },
      lost: {
        textHidden: false,
        text: "Game over!",
        textColor: "#776E65",
        color: { r: 237, g: 227, b: 217, a: 0.5 }
      },
    };
    this.setting = this.settings[GameStatus.InProgress];
    this.color = { r: 255, g: 255, b: 255, a: 0 };
  }

  drawText(x, y, width, height, color, text) {
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    this.context.fillStyle = color;
    this.context.font = height + "px Arial";
    this.context.fillText(text, x, y, width);
  }

  updateColor() {
    const weight = 24;
    this.color.r = (weight * this.color.r + this.setting.color.r) / (weight + 1);
    this.color.g = (weight * this.color.g + this.setting.color.g) / (weight + 1);
    this.color.b = (weight * this.color.b + this.setting.color.b) / (weight + 1);
    this.color.a = (weight * this.color.a + this.setting.color.a) / (weight + 1);
  }

  update(status) {
    this.setting = this.settings[status];
  }

  draw() {
    const width = this.canvas.scrollWidth;
    const height = this.canvas.scrollHeight;
    this.updateColor();
    this.context.fillStyle = "rgba(" +
      this.color.r.toFixed() + "," +
      this.color.g.toFixed() + "," +
      this.color.b.toFixed() + "," +
      this.color.a.toFixed(2) + ")";
    this.context.fillRect(0, 0, width, height);
    if (!this.setting.textHidden) {
      this.drawText(width / 2, height / 2, width * 7 / 8, height / 5, this.setting.textColor, this.setting.text);
    }
  }
}

class GameInputController {
  constructor() {
    this.moves = [];
    window.addEventListener("keydown", (e) => { this.processKeyboard(e); });
    this.blockedUntil = new Date();
  }

  processKeyboard(e) {
    const key = e.code;
    if (new Date() >= this.blockedUntil) {
      const mapping = {
        "KeyW": Direction.Up,
        "ArrowUp": Direction.Up,
        "KeyA": Direction.Left,
        "ArrowLeft": Direction.Left,
        "KeyS": Direction.Down,
        "ArrowDown": Direction.Down,
        "KeyD": Direction.Right,
        "ArrowRight": Direction.Right,
      };
      const direction = mapping[key];
      if (direction !== undefined) {
        this.moves.push(direction);
      }
    }
    if (key == "ArrowUp" || key == "ArrowDown") {
      e.preventDefault();
    }
  }

  reset() {
    this.moves = [];
  }

  blockFor(duration = 1000) {
    this.reset;
    this.blockedUntil = new Date((new Date()).valueOf() + duration);
  }
}

class GameController {
  constructor(canvas, rows, columns, targetTileLevel) {
    this.rows = rows;
    this.columns = columns;
    this.targetTileLevel = targetTileLevel;
    this.graphics = new GameGraphics(canvas, rows, columns);
    this.animation = new GameAnimationController(this.graphics);
    this.overlay = new GameOverlay(canvas);
    this.input = new GameInputController();
    this.bestScore = 0;
    this.restart();
    restartButton.addEventListener("mousedown", () => { this.restart(); });
  }

  restart() {
    this.state = new GameState(this.rows, this.columns, this.targetTileLevel);
    this.input.reset();
    this.animation.addState(this.state);
    this.updateScore();
  }

  doMoves() {
    while (this.input.moves.length) {
      const direction = this.input.moves.shift();
      if (this.state.move(direction)) {
        this.animation.addState(this.state);
      }
      if (this.state.status == GameStatus.Won) {
        const keyboardIgnoreTime = 2500; //ms
        this.input.blockFor(keyboardIgnoreTime);
      }
    }
  }

  updateScore() {
    if (this.score != this.state.score) {
      this.score = this.state.score
      gameScore.innerHTML = this.score;
    }
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      bestScore.innerHTML = this.bestScore;
    }
  }

  tick() {
    // this.input.moves.push(["up", "left", "right"][Math.floor(Math.random() * 3)]);
    this.doMoves();
    this.updateScore();
    this.animation.draw();
    this.overlay.update(this.state.status);
    this.overlay.draw();
    window.requestAnimationFrame(() => { this.tick(); });
  }

  start() {
    this.tick();
  }
}

function main() {
  let game = new GameController(gameCanvas, 4, 4, 11); //4x4 board, 2^11 = 2048 tile to win
  game.start();
}

main();