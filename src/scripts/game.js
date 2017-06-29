'use strict';

/**
 * Enum for directions
 * @enum {string}
 */
const Direction = {
  Right: "right",
  Up: "up",
  Left: "left",
  Down: "down",
}

/**
 * Enum for game status
 * @enum {string}
 */
const GameStatus = {
  InProgress: "inProgress",
  Won: "won",
  Continued: "continued",
  Lost: "lost",
}

/**
 * Enum for tile status
 * @enum {string}
 */
const TileStatus = {
  Empty: "empty",
  Spawned: "spawned",
  Still: "still",
  Moved: "moved",
  Merged: "merged",
}

/**
 *  @type {Object}
 */
let MathUtils = {
  randomInRange: function(n) {
    return Math.min(n - 1, Math.floor(Math.random() * n));
  }
}

/**
 * Represents a tile
 * @class
 */
class Tile {
  /**
   * @constructs Tile
   * @param {number} index - Index of tile on board
   */
  constructor(index) {
    this.index = index;
    this.level = null;
    this.prevIndex = null;
    this.prevLevel = null;
    this.status = TileStatus.Empty;
  }

  /**
   * Resets tile to an empty state
   * @method
   */
  reset() {
    this.level = null;
    this.prevIndex = null;
    this.prevLevel = null;
    this.status = TileStatus.Empty;
  }

  /**
   * Checks if tile is empty
   * @method
   * @returns {boolean}
   */
  get isEmpty() {
    return (this.status == TileStatus.Empty);
  }

  /**
   * Checks if tile is able to merge
   * @method
   * @returns {boolean}
   */
  get ableToMerge() {
    return (this.status != TileStatus.Merged && this.status != TileStatus.Empty);
  }

  /**
   * Returns increment of game score after creating the tile via merge
   * @method
   * @returns {?number}
   */
  get scoreValue() {
    if (this.isEmpty) {
      return null;
    } else {
      return Math.pow(2, this.level);
    }
  }

  /**
   * Prepares tile for move
   * @method
   */
  prepareForMove() {
    if (!this.isEmpty) {
      this.prevIndex = [this.index];
      this.prevLevel = [this.level];
      this.status = TileStatus.Still;
    }
  }

  /**
   * Sets level of tile to value 1 with 90% chance or to value 2 with 10% chance
   * @method
   */
  spawn() {
    this.level = 1 + Math.floor(MathUtils.randomInRange(10) / 9);
    this.status = TileStatus.Spawned;
  }

  /**
   * Merges with another tile by increaing its level and resetting itself
   * @param {Tile} tile - Tile to merge with
   * @method
   */
  mergeWith(tile) {
    if (!this.isEmpty) {
      tile.level++;
      tile.prevIndex.push(this.prevIndex[0]);
      tile.prevLevel.push(this.prevLevel[0]);
      tile.status = TileStatus.Merged;
      this.reset();
    }
  }

  /**
   * Moves to another tile by overwriting its parameters and resetting itself
   * @param {Tile} tile - Tile to move to
   * @method
   */
  moveTo(tile) {
    if (!this.isEmpty) {
      tile.level = this.level;
      tile.prevLevel = this.prevLevel;
      tile.prevIndex = this.prevIndex;
      tile.status = TileStatus.Moved;
      this.reset();
    }
  }

  /**
   * Checks if tile is same as another tile
   * @param {Tile} tile - Tile to compare with
   * @method
   * @returns {boolean}
   */
  equals(tile) {
    return (this.index === tile.index && this.level === tile.level);
  }

  /**
   * Returns a clone of the tile
   * @method
   * @returns {Tile} 
   */
  clone() {
    let clonedTile = new Tile(this.index);
    clonedTile.level = this.level;
    clonedTile.prevLevel = this.prevLevel;
    clonedTile.prevIndex = this.prevIndex;
    clonedTile.status = this.status;
    return clonedTile;
  }
}

/**
 * Represents game state
 * @class
 */
class GameState {
  /**
   * @constructs GameState
   * @param {number} rows - Number of rows on board
   * @param {number} columns - Number of columns on board
   * @param {number} targetTileLevel - Tile level to win the game 
   * @method
   */
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

  /**
   * Returns size of board
   * @method
   * @returns {number}
   */
  get boardSize() {
    return (this.rows * this.columns);
  }

  /**
   * Checks if given index is inside board
   * @param {number} index - Index to check
   * @method
   * @returns {boolean}
   */
  isInsideBoard(index) {
    return (0 <= index && index < this.boardSize);
  }

  /**
   * Checks if two given indicies are neighboring
   * @param {number} index1 - First index 
   * @param {number} index2 - Second index
   * @method
   * @returns {boolean}
   */
  areNeighboring(index1, index2) {
    const dRow = Math.floor(index2 / this.columns) - Math.floor(index1 / this.columns);
    const dCol = index2 % this.columns - index1 % this.columns;
    return (Math.abs(dRow) == 1 && Math.abs(dCol) == 0 || Math.abs(dRow) == 0 && Math.abs(dCol) == 1);
  }

  /**
   * Checks if there are no empty tiles on board
   * @method
   * @returns {boolean}
   */
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

  /**
   * Returns a clone of the game state
   * @method
   * @returns {GameState} 
   */
  clone() {
    let clonedState = new GameState(this.rows, this.columns, this.targetTileLevel);
    clonedState.score = this.score;
    clonedState.tiles = [];
    for (let index = 0; index < this.boardSize; index++) {
      clonedState.tiles.push(this.tiles[index].clone());
    }
    return clonedState;
  }

  /**
   * Checks if game state is same as another game state
   * @param {GameState} state - State to compare with
   * @method
   * @returns {boolean}
   */
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

  /**
   * Checks if game is lost
   * @method
   * @returns {boolean}
   */
  get isGameOver() {
    let dead = this.isFull;
    if (dead) {
      for (let dir in Direction) {
        if (this.clone().move(Direction[dir])) {
          dead = false;
          break;
        }
      }
    }
    return dead;
  }

  /**
   * Checks if tile level needed to win the game is achieved
   * @method
   * @return {boolean}
   */
  get hasAchievedGoal() {
    let won = false;
    for (let index = 0; index < this.boardSize; index++) {
      if (this.tiles[index].level >= this.targetTileLevel) {
        won = true;
        break;
      }
    }
    return won;
  }

  /**
   * Updates game status
   * @method
   */
  updateStatus() {
    if (this.isGameOver) {
      this.status = GameStatus.Lost;
    } else if (this.status == GameStatus.InProgress && this.hasAchievedGoal) {
      this.status = GameStatus.Won;
    } else if (this.status == GameStatus.Won) {
      this.status = GameStatus.Continued;
    }
  }

  /**
   * Spawns new tile on board
   */
  spawnTile() {
    if (!this.isFull) {
      let index;
      do {
        index = MathUtils.randomInRange(this.boardSize);
      } while (!this.tiles[index].isEmpty);
      this.tiles[index].spawn();
    }
  }

  /**
   * Gravitates tile to a given direction
   * @param {number} index - Index of the tile 
   * @param {number} indexChange - Index change to get to the next tile
   * @method
   */
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
        this.score += nextTile.scoreValue;
      }
    }
  }

  /**
   * Gravitates all tiles on board to a given direction
   * @param {Direction} direction - Direction of gravitation
   * @method
   */
  gravitate(direction) {
    let indexChange = {}
    indexChange[Direction.Right] = 1;
    indexChange[Direction.Up] = -this.columns;
    indexChange[Direction.Left] = -1;
    indexChange[Direction.Down] = this.columns;

    for (let index = 0; index < this.boardSize; index++) {
      this.tiles[index].prepareForMove();
    }

    for (let index = 0; index < this.boardSize; index++) {
      this.gravitateTile(index, indexChange[direction]);
    }
  }

  /**
   * Does a move in a given direction;
   * Returns true if game state has changed;
   * @param {Direction} direction - Direction to move to
   * @returns {boolean}
   */
  move(direction) {
    let oldState = this.clone();
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

/**
 * Represents game graphics controller 
 * @class
 */
class GameGraphicsController {
  /**
   * @constructs GameGraphicsController
   * @method
   * @param {Element} canvas - Canvas
   * @param {number} rows - Number of rows on board
   * @param {number} columns - Number of columns on board 
   */
  constructor(canvas, rows, columns) {
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
    this.rows = rows;
    this.columns = columns;
    this.marginToTileSizeRatio = 1 / 8;
    this.margin = null;
    this.tileSize = null;
    this.dimensions = { x: null, y: null };
    this.resize();
    window.addEventListener("resize", () => { this.resize(); });
  }

  /**
   * Window resize event handler
   * @method
   */
  resize() {
    const maxWidth = window.innerWidth * 0.7;
    const maxHeight = window.innerHeight * 0.7;
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

  /**
   * Draws rounded rectangle
   * @method
   * @param {number} x - X coordinate of a rectange
   * @param {number} y - Y coordinate of a rectange
   * @param {?number} width - Width of a rectange
   * @param {?number} height - Height of a rectange
   * @param {string} color - Color of a rectange
   * @param {number=} radius - Radius of a rectange
   */
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

  /**
   * Draws text of a given color in a given rectange
   * @method
   * @param {number} x - X coordinate of a text's bounding rectange
   * @param {number} y - X coordinate of a text's bounding rectange
   * @param {number} width - Width of a text's bounding rectange
   * @param {number} height - Height of a text's bounding rectange
   * @param {string} color - Color of text
   * @param {string} text - Text to draw
   */
  drawText(x, y, width, height, color, text) {
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    this.context.fillStyle = color;
    this.context.font = height * 2 / 3 + "px Arial";
    this.context.fillText(text, x + width / 2, y + height / 2, width);
  }

  /**
   * Draws game's background
   * @method
   */
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

  /**
   * Returns color of a tile with a given level
   * @method
   * @param {?number} tileLevel - Level of tile 
   * @returns {string}
   */
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

  /**
   * Returns text of a tile with a given level
   * @method
   * @param {?number} tileLevel - Level of tile 
   * @returns {string}
   */
  getTileText(tileLevel) {
    const multipliers = ["", "K", "M"];
    return Math.pow(2, tileLevel % 10).toString() + multipliers[Math.floor(tileLevel / 10)];
  }

  /**
   * Returns text color of a tile with a given level
   * @method
   * @param {?number} tileLevel - Level of tile 
   * @returns {string}
   */
  getTileTextColor(tileLevel) {
    if (tileLevel > 2)
      return "#F9F6F2"; // 8, 16, ...
    else
      return "#776E65"; // 2 or 4
  }

  /**
   * Draws a tile
   * @method
   * @param {number} row - Row of tile
   * @param {number} col - Column of tile
   * @param {?number} tileLevel - Level of tile
   * @param {number=} scale - Scale 
   */
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

  /**
   * Draws tile's animation 
   * @method
   * @param {Tile} tile 
   * @param {number=} animationProgress 
   */
  drawAnimatedTile(tile, animationProgress = 1) {
    const row = Math.floor(tile.index / this.columns);
    const col = tile.index % this.columns
    const movingPhaseEnd = .5;
    if (tile.status != TileStatus.Empty && tile.status != TileStatus.Spawned) {
      for (let id = 0; id < tile.prevIndex.length; id++) {
        const prevRow = Math.floor(tile.prevIndex[id] / this.columns);
        const prevCol = tile.prevIndex[id] % this.columns;
        const phaseProgress = Math.min(animationProgress / movingPhaseEnd, 1);
        const movementProgress = 3 * Math.pow(phaseProgress, 2) - 2 * Math.pow(phaseProgress, 3); // Smoothstep
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
        const scale = -Math.pow(phaseProgress, 2) + phaseProgress + 1;
        this.drawTile(row, col, tile.level, scale);
      }
    }
  }

  /**
   * Draws all tiles from a game state
   * @method
   * @param {GameState} state 
   * @param {number=} animationProgress 
   */
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

  /**
   * Draws game state
   * @method
   * @param {GameState} state 
   * @param {number} animationProgress 
   */
  draw(state, animationProgress = 1) {
    this.drawBackground();
    this.drawTiles(state, animationProgress);
  }
}

/**
 * Represents game animation controller
 * @class
 */
class GameAnimationController {
  /**
   * @constructs GameAnimationController
   * @method
   * @param {GameGraphicsController} graphics - Game Graphics Controller to use
   */
  constructor(graphics) {
    this.graphics = graphics;
    this.animationProgress = 0;
    this.stateHistory = [];
    this.prevTime = new Date();
  }

  /**
   * Adds state to the drawing queue
   * @method
   * @param {GameState} state - State to add to queue
   */
  addState(state) {
    this.stateHistory.push(state.clone());
  }

  /**
   * Returns animation step to get to the next frame
   * @method
   * @returns {number}
   */
  get animationStep() {
    const baseAnimationDuration = 0.2;
    const time = new Date();
    const deltaSeconds = (time - this.prevTime) / 1000;
    const deltaPhase = deltaSeconds / baseAnimationDuration;
    return (this.stateHistory.length * deltaPhase);
  }

  /**
   * Advances to the next frame
   * @method
   */
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

  /**
   * Advances to the next frame and draws it
   * @method
   */
  draw() {
    this.advance();
    this.graphics.draw(this.stateHistory[0], this.animationProgress);
  }
}

/**
 * Represents color
 * @class
 */
class Color {
  /**
   * @constructs Color
   * @method
   * @param {number} r - Red
   * @param {number} g - Green
   * @param {number} b - Blue
   * @param {number} a - Alpha
   */
  constructor(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  /**
   * Approaches to a given color using exponential moving average
   * @method
   * @param {Color} color 
   */
  approach(color) {
    const weight = 24;
    this.r = (weight * this.r + color.r) / (weight + 1);
    this.g = (weight * this.g + color.g) / (weight + 1);
    this.b = (weight * this.b + color.b) / (weight + 1);
    this.a = (weight * this.a + color.a) / (weight + 1);
  }

  /**
   * Returns style string representation of color
   * @method
   * @returns {string}
   */
  toStyleString() {
    return "rgba(" +
      this.r.toFixed() + "," + this.g.toFixed() + "," +
      this.b.toFixed() + "," + this.a.toFixed(2) + ")";
  }

  /**
   * Returns clone of a color
   * @method
   * @returns {Color}
   */
  clone() {
    return new Color(this.r, this.g, this.b, this.a);
  }
}

/**
 * Represents game overlay
 * @class
 */
class GameOverlay {
  /**
   * @constructs GameOverlay
   * @method
   * @param {Element} canvas - Canvas to draw on
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    /**
     * Enum for overlay settings
     * @enum {{
     *   textHidden: boolean,
     *   text: ?string,
     *   textColor: ?string,
     *   color: Color,
     * }}
     */
    this.settings = {};
    this.settings[GameStatus.InProgress] = {
      textHidden: true,
      text: null,
      textColor: null,
      color: new Color(255, 255, 255, 0),
    };
    this.settings[GameStatus.Continued] = {
      textHidden: true,
      text: null,
      textColor: null,
      color: new Color(255, 255, 255, 0),
    };
    this.settings[GameStatus.Won] = {
      textHidden: false,
      text: "You win!",
      textColor: "#F8F5F1",
      color: new Color(237, 194, 46, 0.5),
    };
    this.settings[GameStatus.Lost] = {
      textHidden: false,
      text: "Game over!",
      textColor: "#776E65",
      color: new Color(237, 227, 217, 0.5),
    };
    this.setting = this.settings[GameStatus.InProgress];
    this.color = this.setting.color.clone();
  }

  /**
   * Draws text of a given color in a given rectange
   * @method
   * @param {number} x - X coordinate of a text's bounding rectange
   * @param {number} y - X coordinate of a text's bounding rectange
   * @param {number} width - Width of a text's bounding rectange
   * @param {number} height - Height of a text's bounding rectange
   * @param {string} color - Color of text
   * @param {string} text - Text to draw
   */
  drawText(x, y, width, height, color, text) {
    this.context.textAlign = "center";
    this.context.textBaseline = "middle";
    this.context.fillStyle = color;
    this.context.font = height + "px Arial";
    this.context.fillText(text, x, y, width);
  }

  /**
   * Updates settings according to a game status
   * @param {GameStatus} status - Game Status
   */
  update(status) {
    this.setting = this.settings[status];
  }

  /**
   * Draws overlay
   * @method
   */
  draw() {
    const width = this.canvas.scrollWidth;
    const height = this.canvas.scrollHeight;
    this.color.approach(this.setting.color);
    this.context.fillStyle = this.color.toStyleString();
    this.context.fillRect(0, 0, width, height);
    if (!this.setting.textHidden) {
      this.drawText(width / 2, height / 2, width * 7 / 8, height / 5, this.setting.textColor, this.setting.text);
    }
  }
}

/**
 * Represents game input controller
 * @class
 */
class GameInputController {
  /**
   * @constructs GameInputConstoller
   * @method
   */
  constructor() {
    this.moves = [];
    window.addEventListener("keydown", (e) => { this.processKeyboard(e); });
    this.blockedUntil = new Date();
  }

  /**
   * Keyboard keydown event handler
   * @method
   * @param {Object} event - Event
   */
  processKeyboard(event) {
    const key = event.code;
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
      event.preventDefault();
    }
  }

  /**
   * Clears keyboard presses queuq
   * @method
   */
  reset() {
    this.moves = [];
  }

  /**
   * Ignores keyboard presses for a given duration
   * @method
   * @param {number} duration - Duration in milliseconds 
   */
  blockForMilliseconds(duration) {
    this.reset();
    this.blockedUntil = new Date((new Date()).valueOf() + duration);
  }
}

/**
 * Represents a game controller
 * @class
 */
class GameController {
  /**
   * @constructs GameController
   * @method
   * @param {Element} canvas - Game canvas
   * @param {number} rows - Number of rows
   * @param {number} columns - Number of columns
   * @param {number} targetTileLevel - Tile level to win the game
   */
  constructor(canvas, rows, columns, targetTileLevel) {
    this.rows = rows;
    this.columns = columns;
    this.targetTileLevel = targetTileLevel;
    this.graphics = new GameGraphicsController(canvas, rows, columns);
    this.animation = new GameAnimationController(this.graphics);
    this.overlay = new GameOverlay(canvas);
    this.input = new GameInputController();
    this.score = 0;
    this.bestScore = 0;
    this.state = new GameState(this.rows, this.columns, this.targetTileLevel);
    this.animation.addState(this.state);
    let restartButton = document.getElementById("restartButton");
    restartButton.addEventListener("mousedown", () => { this.restart(); });
  }

  /**
   * Restarts the game
   * @method
   */
  restart() {
    this.state = new GameState(this.rows, this.columns, this.targetTileLevel);
    this.input.reset();
    this.animation.addState(this.state);
    this.updateScore();
  }

  /**
   * Does moves according to keyboard presses from input
   * @method
   */
  doMoves() {
    while (this.input.moves.length) {
      const direction = this.input.moves.shift();
      if (this.state.move(direction)) {
        this.animation.addState(this.state);
      }
      if (this.state.status == GameStatus.Won) {
        const keyboardIgnoreTimeMs = 2500;
        this.input.blockForMilliseconds(keyboardIgnoreTimeMs);
      }
    }
  }

  /**
   * Updates game score containers on page
   * @method
   */
  updateScore() {
    if (this.score != this.state.score) {
      let gameScore = document.getElementById('gameScore');
      this.score = this.state.score
      gameScore.innerHTML = this.score;
    }
    if (this.score > this.bestScore) {
      let bestScore = document.getElementById('bestScore');
      this.bestScore = this.score;
      bestScore.innerHTML = this.bestScore;
    }
  }

  /**
   * Game tick function
   * @method
   */
  tick() {
    this.doMoves();
    this.updateScore();
    this.animation.draw();
    this.overlay.update(this.state.status);
    this.overlay.draw();
    window.requestAnimationFrame(() => { this.tick(); });
  }

  /**
   * Starts the game
   * @method
   */
  start() {
    this.tick();
  }
}

/**
 * Main function
 * @function
 */
function main() {
  let gameCanvas = document.getElementById("gameCanvas");
  let game = new GameController(gameCanvas, 4, 4, 11); //4x4 board, 2^11 = 2048 tile to win
  game.start();
}

main();