'use strict';

const Direction = {
  Right: "right",
  Up: "up",
  Left: "left",
  Down: "down",
}

const GameStatus = {
  Unknown: "unknown",
  Won: "won",
  Lose: "lose",
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
    this.drawRoundRectangle(0, 0, dx, dy, "#BBADA0", dx / 50);
    const margin = dx / (1 + this.columns * (1 + 1 / this.marginToTileSizeRatio));
    const tileSize = margin / this.marginToTileSizeRatio;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        this.drawRoundRectangle(margin + col * (tileSize + margin), margin + row * (tileSize + margin), tileSize, tileSize, "#CDC1B4", tileSize / 25);
      }
    }
  }

  getTileColor(tileLevel) {
    let tileColors = [
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
    let multipliers = ["", "K", "M"];
    return Math.pow(2, tileLevel % 10).toString() + multipliers[Math.floor(tileLevel / 10)];
  }

  getTileTextColor(tileLevel) {
    if (tileLevel > 2)
      return "#F9F6F2"; // 8, 16, ...
    else
      return "#776E65"; // 2 or 4
  }

  drawTile(x, y, size, tileLevel) {
    let color = this.getTileColor(tileLevel);
    let text = this.getTileText(tileLevel);
    let textColor = this.getTileTextColor(tileLevel);
    this.drawRoundRectangle(x, y, size, size, color, size / 25);
    this.drawText(x, y, size, size, textColor, text)
  }

  drawTiles(tiles) {
    let dx = this.dimensions.x;
    let dy = this.dimensions.y;
    let margin = dx / (1 + this.columns * (1 + 1 / this.marginToTileSizeRatio));
    let tileSize = margin / this.marginToTileSizeRatio;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        if (tiles[row][col] > 0) {
          this.drawTile(margin + col * (tileSize + margin), margin + row * (tileSize + margin), tileSize, tiles[row][col]);
        }
      }
    }
  }

  showEndGameScreen() {
    if (this.dead) {
      // TODO: implement end screen
    }
  }

  draw(tiles) {
    this.drawBackground();
    this.drawTiles(tiles);
  }
}

// TODO: rename to GameState
class GameMechanics {
  constructor(rows, columns) {
    this.rows = rows;
    this.columns = columns;
    // TODO: make method instead of property emptyTilesCount
    this.emptyTilesCount = this.rows * this.columns;
    this.tiles = [];
    for (let ri = 0; ri < this.rows; ri++) {
      this.tiles[ri] = [];
      for (let ci = 0; ci < this.columns; ci++) {
        this.tiles[ri][ci] = 0;
      }
    }
    this.score = 0;

    this.spawnTile();
  }

  // @returns number in range [0..n)
  random(n) {
    return Math.min(n - 1, Math.floor(Math.random() * n));
  }

  isInsideBoard(row, col) {
    return (0 <= row && row < this.rows && 0 <= col && col < this.columns);
  }

  spawnTile() {
    if (this.emptyTilesCount) {
      let row;
      let col;
      do {
        row = this.random(this.rows);
        col = this.random(this.columns);
      }
      while (this.tiles[row][col] > 0);
      // 90% to get 2 and 10% to get 4
      this.tiles[row][col] = 1 + Math.floor(this.random(10) / 9);
      this.emptyTilesCount--;
    }
  }

  gravitateTile(tiles, row, col, dx, dy, updateScore) {
    let nextRow = row + dy;
    let nextCol = col + dx;
    if (this.isInsideBoard(nextRow, nextCol)) {
      if (tiles[nextRow][nextCol] != 0) {
        this.gravitateTile(tiles, nextRow, nextCol, dx, dy, updateScore);
      }
      if (tiles[nextRow][nextCol] > 0 && tiles[row][col] == tiles[nextRow][nextCol]) {
        tiles[nextRow][nextCol] += 1;
        tiles[row][col] = 0;
        if (updateScore) {
          // TODO: extract to method
          // TODO: check score after gravitate finished
          this.score += Math.pow(2, tiles[nextRow][nextCol]);
          gameScore.innerHTML = this.score;
          bestScore.innerHTML = Math.max(bestScore.innerHTML, gameScore.innerHTML);
          if (tiles[nextRow][nextCol] == 11) {
            window.alert("You win!");
          }
          this.emptyTilesCount++;
        }
        tiles[nextRow][nextCol] *= -1;
      }
      if (tiles[nextRow][nextCol] == 0) {
        tiles[nextRow][nextCol] = tiles[row][col];
        tiles[row][col] = 0;
        this.gravitateTile(tiles, nextRow, nextCol, dx, dy, updateScore);
      }
    }
  }

  gravitate(tiles, direction, updateScore) {
    let dir = direction;
    let dx = { right: 1, up: 0, left: -1, down: 0 };
    let dy = { right: 0, up: -1, left: 0, down: 1 };
    let x0 = { right: 0, up: this.columns - 1, left: this.columns - 1, down: 0 };
    let y0 = { right: this.rows - 1, up: this.rows - 1, left: 0, down: 0 };
    // Maps to perpendicular direction
    const perpDirectionMapping = {
      right: Direction.Up,
      up: Direction.Left,
      left: Direction.Down,
      down: Direction.Right,
    };
    let perp = perpDirectionMapping[dir];

    // TODO: Move to method `clone()`, remove updateScore parameter,
    //  use cloned state to check if game over
    let newTiles = [];
    for (let row = 0; row < this.rows; row++) {
      newTiles[row] = tiles[row].slice();
    }

    let row = y0[dir];
    let col = x0[dir];
    while (row >= 0 && col >= 0 && row < this.rows && col < this.columns) {
      this.gravitateTile(newTiles, row, col, dx[dir], dy[dir], updateScore);
      row += dy[perp];
      col += dx[perp];
    }

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        newTiles[row][col] = Math.abs(newTiles[row][col]);
      }
    }

    return newTiles;
  }

  doMoves(moves) {
    if (moves.length) {
      while (moves.length) {
        let moveDirection = moves.shift();
        let newTiles = this.gravitate(this.tiles, moveDirection, true);
        if (newTiles.toString() != this.tiles.toString()) {
          this.tiles = newTiles;
          this.spawnTile();
        }
      }
      this.checkForGameOver();
    }
  }

  checkForGameOver() {
    // TODO: remove property dead - method is enough
    if (!(this.dead)) {
      this.dead = true;
      for (let dir in Direction) {
        let newTiles = this.gravitate(this.tiles, Direction[dir], false);
        // TODO: extract to method `equals()`
        if (newTiles.toString() != this.tiles.toString()) {
          this.dead = false;
          break;
        }
      }
      if (this.dead) {
        window.alert("Game over!");
      }
      return this.dead;
    }
  }
}

class GameInputController {
  constructor() {
    this.moves = [];
    window.addEventListener("keydown", (e) => { this.processKeyboard(e); });
  }

  processKeyboard(e) {
    const key = e.code;
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
    if (key == "ArrowUp" || key == "ArrowDown") {
      e.preventDefault();
    }
  }
}

class GameController {
  constructor(canvas, rows, columns) {
    this.graphics = new GameGraphics(canvas, rows, columns);
    this.mechanics = new GameMechanics(rows, columns);
    this.input = new GameInputController();
  }

  tick() {
    this.mechanics.doMoves(this.input.moves);
    this.graphics.draw(this.mechanics.tiles);
    window.requestAnimationFrame(() => { this.tick(); });
  }

  restart() {
    this.dead = false;
    this.win = false;
  }

  start() {
    this.restart();
    this.tick();
  }

}

function main() {
  let game = new GameController(gameCanvas, 4, 4);
  game.start();
}

main();