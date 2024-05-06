import Phaser from "phaser";
import io from "socket.io-client";
const socket = io("https://pq9sks-3000.csb.app");
const config = {
  type: Phaser.CANVAS,
  width: 375,
  height: 667,
  antialias: true,
  physics: {
    default: "arcade",
    arcade: {
      fps: 60,
      gravity: { y: 0 },
    },
  },
  renderer: { mipmapFilter: "LINEAR_MIPMAP_LINEAR" },
  scene: {
    key: "main",
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);
var bg;
var player;
var playerTweens = null;
var selectBox;
var selectBoxXidx = 0;
var selectBoxYidx = 0;
var xIdxTextDebug = null;
var yIdxTextDebug = null;
var playerChanceDebug = null;
var winTextDebug = null;
var currentActivePlayer = 1;
var selectScaleTweens = null;
var selectPositionTweens = null;
var limitX = 0;
var limitY = 0;
var startX = 41.31;
var startY = 187.115;
var cursors;
var boxSize = 41.31;
var boxDownList = [];
var boxSideList = [];
var valueAdded = false;
var restart = false;
var move = 0;
var canMove = false;
var intervalId = null;
var timeoutId = null;
var angleIntervalId = null;
var maxAngle = 1;
var arcGraphics = null;
var t = null;

var multiPlayerflag = true;
var myPlayerNum = -1;

socket.on("connected", (data) => {
  console.log("handshake completed! " + data.handshakeNum);
  console.log("My Player Number " + data.playerNum);

  myPlayerNum = data.playerNum;
});
socket.on("currPlayerChanged", (data) => {
  // console.log(data.curr);
  currentActivePlayer = data.curr;
  if (playerChanceDebug != null) {
    playerChanceDebug.setText(`player chance:${currentActivePlayer}`);
  }
});
socket.on("changedSelect", (data) => {
  if (myPlayerNum != currentActivePlayer) {
    selectBoxXidx = data.selectX;
    selectBoxYidx = data.selectY;
    if (t != null) {
      destroyBoxObject();
      changeSelectionPosition(data.posX, data.posY, t);
    }
  }
});
socket.on("movePlayer", () => {
  if (t != null) {
    changePlayerPosition(t);
  }
});
function preload() {
  this.load.svg("background", "./assets/board.svg", { scale: 2 });
}
function create() {
  var t = this;
  this.ENTER = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  cursors = this.input.keyboard.createCursorKeys();

  bg = this.add.image(config.width / 2, config.height / 2, "background");
  bg.setScale(0.5);

  var graphics = this.add.graphics();
  graphics.fillStyle("0x07dcf0", 1);
  graphics.fillCircle(boxSize / 2, boxSize / 2, boxSize / 2);
  var playerTexture = graphics.generateTexture("ballPlayer", boxSize, boxSize);

  graphics.destroy();
  player = this.add.image(startX + boxSize * 7, startY, "ballPlayer");
  limitX = (player.x - startX) / boxSize - 1;
  limitY = (player.y - startY) / boxSize + 1;
  selectBoxXidx = limitX;
  selectBoxYidx = limitY;

  var graphics = this.add.graphics();
  graphics.lineStyle(4, 0xffffff, 1);
  graphics.strokeRect(0, 0, boxSize, boxSize);
  var boxTexture = graphics.generateTexture("box", boxSize, boxSize);
  graphics.destroy();

  var graphics = this.add.graphics();
  graphics.lineStyle(8, 0x32a83c, 1);
  graphics.strokeRect(0, 0, boxSize, boxSize);
  var selectBoxTexture = graphics.generateTexture(
    "selectbox",
    boxSize,
    boxSize,
  );

  graphics.destroy();
  selectBox = this.add.image(player.x, player.y + boxSize, "selectbox");
  destroyBoxObject();
  addMarker(t);

  xIdxTextDebug = this.add.text(0, 10, "x:0", {
    fontSize: "24px",
    fill: "#ffffff",
  });
  yIdxTextDebug = this.add.text(100, 10, "y:0", {
    fontSize: "24px",
    fill: "#ffffff",
  });

  playerChanceDebug = this.add.text(0, 50, "player chance:1", {
    fontSize: "24px",
    fill: "#ffffff",
  });
  winTextDebug = this.add.text(0, config.height / 2, "", {
    fontSize: "24px",
    fill: "#ffffff",
  });

  this.startAngle = 0;
  this.endAngle = 0;
  this.fillColor = 0x32a83c;
  this.timerEvent = null;

  this.resetArc = () => {
    this.endAngle = 0;
    if (this.timerEvent != null) this.timerEvent.remove();
    this.timerEvent = null;
  };

  var graphics = this.add.graphics();
  this.drawArc = (reset = false) => {
    graphics.clear();
    graphics.lineStyle(10, this.fillColor, 1);
    graphics.beginPath();
    if (reset == false) this.endAngle += Phaser.Math.DegToRad(36);
    if (this.endAngle >= Math.PI * 2) {
      this.resetArc();
      if (multiPlayerflag == false) {
        if (currentActivePlayer === 1) {
          currentActivePlayer = 2;
          canMove = true; //for bot
        } else {
          currentActivePlayer = 1;
        }
        playerChanceDebug.setText(`player chance:${currentActivePlayer}`);
      } else {
        socket.emit("nextPlayer");
      }
    }
    graphics.arc(
      config.width - 40,
      40,
      20,
      this.startAngle,
      this.endAngle,
      false,
      0.2,
    );
    graphics.strokePath();
  };
}

function update() {
  if (t == null) t = this;
  limitX = (player.x - startX) / boxSize - 1;
  limitY = (player.y - startY) / boxSize + 1;

  if (restart == true && this.ENTER.isDown) {
    restart = false;
    currentActivePlayer = 1;
    this.scene.restart();
  }
  if (multiPlayerflag == true && restart == false && myPlayerNum != -1) {
    if (myPlayerNum === currentActivePlayer) {
      playerController(t);
      addArc(t);
      console.log(`Player ${myPlayerNum} active`);
    } else {
      this.resetArc();
    }
  }

  if (multiPlayerflag == false && restart == false)
    if (currentActivePlayer == 1) {
      addArc(t);
      playerController(t);
    } else if (currentActivePlayer == 2 && canMove == true) {
      addArc(t);
      //bot section
      move = Math.random() < 0.5 ? 0 : 1;
      if (intervalId == null) {
        intervalId = setInterval(() => {
          genBotMove(t);
          if (move == 0) {
            changeSelectionPosition(
              startX + boxSize * selectBoxXidx,
              player.y,
              t,
            );
            destroyBoxObject();
          } else {
            changeSelectionPosition(
              player.x,
              startY + boxSize * selectBoxYidx,
              t,
            );
            destroyBoxObject();
          }
        }, 1000);
      }
      if (timeoutId == null) {
        timeoutId = setTimeout(() => {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          intervalId = null;
          timeoutId = null;
          changePlayerPosition(t);
          canMove = false;
          this.resetArc();
        }, 5000);
      }
    }
}

function addArc(t) {
  if (t.timerEvent == null) {
    t.timerEvent = t.time.addEvent({
      delay: 1000,
      callback: t.drawArc,
      loop: true,
      // args: [reset],
    });
  }
}
function playerController(t) {
  if (cursors != null) {
    if (cursors.down.isDown) {
      if (selectBoxYidx < 7 && valueAdded == false) {
        selectBoxYidx++;
        valueAdded = true;
        changeSelectionPosition(player.x, startY + boxSize * selectBoxYidx, t);
        destroyBoxObject();
      }
    } else if (cursors.up.isDown) {
      if (selectBoxYidx > limitY && valueAdded == false) {
        selectBoxYidx--;
        valueAdded = true;
        changeSelectionPosition(player.x, startY + boxSize * selectBoxYidx, t);
        destroyBoxObject();
      }
    } else if (cursors.right.isDown) {
      if (selectBoxXidx < limitX && valueAdded == false) {
        selectBoxXidx++;
        valueAdded = true;
        changeSelectionPosition(startX + boxSize * selectBoxXidx, player.y, t);
        destroyBoxObject();
      }
    } else if (cursors.left.isDown) {
      if (selectBoxXidx > 0 && valueAdded == false) {
        selectBoxXidx--;
        valueAdded = true;
        changeSelectionPosition(startX + boxSize * selectBoxXidx, player.y, t);
        destroyBoxObject();
      }
    } else if (cursors.space.isDown) {
      socket.emit("movePlayer");
      if (multiPlayerflag == false) {
        changePlayerPosition(t);
        canMove = true;
      }
    } else {
      valueAdded = false;
    }
  }
}
function genBotMove(t) {
  const calX = () => {
    // console.log((player.x - startX) / boxSize == 0);
    if ((player.x - startX) / boxSize != 0) {
      console.log("random x generator");
      return limitX > 0 ? Math.floor(Math.random() * (0 - limitX) + limitX) : 0;
    } else {
      console.log("random y generator");
      move = 1;
      selectBoxYidx = calY();
      return selectBoxXidx;
    }
  };
  const calY = () => {
    // console.log((player.y - startY) / boxSize == 7);
    if ((player.y - startY) / boxSize != 7) {
      console.log("random y generator");
      return limitY < 7 ? Math.floor(Math.random() * (limitY - 7) + 7) : 7;
    } else {
      console.log("random x generator");
      move = 0;
      selectBoxXidx = calX();
      return selectBoxYidx;
    }
  };
  if (move == 0) {
    selectBoxXidx = calX();
  } else {
    selectBoxYidx = calY();
  }
}

function changePlayerPosition(t) {
  if (selectScaleTweens == null) {
    selectScaleTweens = t.tweens.add({
      targets: selectBox,
      scale: 1.3,
      duration: 100,
      ease: "Power1",
      onComplete: () => {
        selectScaleTweens = t.tweens.add({
          targets: selectBox,
          scale: 1,
          duration: 100,
          ease: "Linear",
          onComplete: () => {
            selectBox.scale = 1;
            selectScaleTweens.destroy();
            selectScaleTweens = null;
            playerTweens = t.tweens.add({
              targets: player,
              props: {
                x: {
                  value: selectBox.x,
                  duration: 500,
                  ease: "Power1",
                },
                y: {
                  value: selectBox.y,
                  duration: 500,
                  ease: "Power1",
                },
              },
              onStart: () => {
                selectBox.visible = false;
                destroyBoxObject();
              },
              onComplete: () => {
                addMarker(t);
                selectBox.visible = true;
                playerTweens.destroy();
                playerTweens = null;
                if (
                  restart == false &&
                  player.x == startX &&
                  player.y == startY + boxSize * 7
                ) {
                  winTextDebug.setText(
                    `Player ${currentActivePlayer} wins\nplease enter to restart`,
                  );
                  restart = true;
                }
                if (
                  selectBoxYidx + 1 < 8 &&
                  (player.y - startY) / boxSize != 7
                ) {
                  selectBoxYidx = selectBoxYidx + 1;
                  changeSelectionPosition(
                    player.x,
                    startY + boxSize * selectBoxYidx,
                    t,
                  );
                  console.log("move y");
                } else if (
                  selectBoxXidx - 1 > -1 &&
                  (player.x - startX) / boxSize != 0
                ) {
                  selectBoxXidx = selectBoxXidx - 1;
                  changeSelectionPosition(
                    startX + boxSize * selectBoxXidx,
                    player.y,
                    t,
                  );
                  console.log("move x");
                } else {
                  changeSelectionPosition(
                    startX + boxSize * selectBoxXidx,
                    startY + boxSize * selectBoxYidx,
                    t,
                  );
                  console.log("meh");
                }
                if (multiPlayerflag == true) {
                  if (myPlayerNum == currentActivePlayer) {
                    t.resetArc();
                    t.drawArc(true);
                    socket.emit("nextPlayer");
                  }
                } else {
                  if (restart == false) {
                    if (currentActivePlayer === 1) {
                      currentActivePlayer = 2;
                    } else {
                      currentActivePlayer = 1;
                    }
                  }
                }
                playerChanceDebug.setText(
                  `player chance:${currentActivePlayer}`,
                );
              },
            });
          },
        });
      },
    });
  }
}
function changeSelectionPosition(posX, posY, t) {
  if (selectPositionTweens == null) {
    xIdxTextDebug.setText(`x:${selectBoxXidx}`);
    yIdxTextDebug.setText(`y:${selectBoxYidx}`);

    selectPositionTweens = t.tweens.add({
      targets: selectBox,
      props: {
        x: { value: posX, duration: 100, ease: "Power1" },
        y: { value: posY, duration: 100, ease: "Power1" },
      },
      onComplete: () => {
        addMarker(t);
        selectPositionTweens.destroy();
        selectPositionTweens = null;
        if (multiPlayerflag == true && myPlayerNum == currentActivePlayer) {
          socket.emit("changedSelect", {
            selectX: selectBoxXidx,
            selectY: selectBoxYidx,
            posX,
            posY,
          });
        }
      },
    });
  }
}
function addMarker(t) {
  var count = 0;
  if (boxDownList.length != 8 - (player.y - startY) / boxSize) {
    count = (player.y - startY) / boxSize;
    // console.log(count);
    for (let i = count; i < 7; i++) {
      if (player.y == startY + boxSize * count) {
        count++;
      }

      const box = t.add.image(player.x, startY + boxSize * count, "box");
      boxDownList.push(box);
      count++;
    }
  }
  if (boxSideList.length != 8 - (8 - (player.x - startX) / boxSize)) {
    count = (player.x - startX) / boxSize;

    // console.log(count);
    for (let i = count; i > 0; i--) {
      if (player.x == startX + boxSize * count) {
        count--;
      }
      const box = t.add.image(startX + boxSize * count, player.y, "box");
      boxSideList.push(box);
      count--;
    }
  }
  if (boxDownList.length != 0 || boxSideList.length != 0) {
    var tweens = t.tweens.add({
      targets: [...boxDownList, ...boxSideList],
      scale: 0.5,
      duration: 500,
      yoyo: true,
      ease: "Linear",
      repeat: -1,
    });
  }
}
function destroyBoxObject() {
  boxDownList.forEach((boxTemp) => {
    boxTemp.destroy();
  });
  boxSideList.forEach((boxTemp) => {
    boxTemp.destroy();
  });
  boxDownList = [];
  boxSideList = [];
}
export default game;
