import Phaser from "phaser";

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
function preload() {
  this.load.svg("background", "./assets/board.svg", { scale: 2 });
}
function create() {
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
  var t = this;
  addMarker(t);

  xIdxTextDebug = this.add.text(config.width / 2 - 100, 20, "x:0", {
    fontSize: "48px",
    fill: "#ffffff",
  });
  yIdxTextDebug = this.add.text(config.width / 2 + 20, 20, "y:0", {
    fontSize: "48px",
    fill: "#ffffff",
  });
}
function update() {
  cursors = this.input.keyboard.createCursorKeys();
  var t = this;
  limitX = (player.x - startX) / boxSize - 1;
  limitY = (player.y - startY) / boxSize + 1;
  if (cursors != null) {
    if (cursors.down.isDown) {
      if (selectBoxYidx < 7 && valueAdded == false) {
        selectBoxYidx++;
        valueAdded = true;
      }
      changeSelectionPosition(player.x, startY + boxSize * selectBoxYidx, t);
      destroyBoxObject();
    } else if (cursors.up.isDown) {
      if (selectBoxYidx > limitY && valueAdded == false) {
        selectBoxYidx--;
        valueAdded = true;
      }
      changeSelectionPosition(player.x, startY + boxSize * selectBoxYidx, t);
      destroyBoxObject();
    } else if (cursors.right.isDown) {
      if (selectBoxXidx < limitX && valueAdded == false) {
        selectBoxXidx++;
        valueAdded = true;
      }
      changeSelectionPosition(startX + boxSize * selectBoxXidx, player.y, t);
      destroyBoxObject();
    } else if (cursors.left.isDown) {
      if (selectBoxXidx > 0 && valueAdded == false) {
        selectBoxXidx--;
        valueAdded = true;
      }
      changeSelectionPosition(startX + boxSize * selectBoxXidx, player.y, t);
      destroyBoxObject();
    } else if (cursors.space.isDown) {
      if (selectScaleTweens == null) {
        selectScaleTweens = this.tweens.add({
          targets: selectBox,
          scale: 1.3,
          duration: 100,
          ease: "Power1",
          onComplete: () => {
            selectScaleTweens = this.tweens.add({
              targets: selectBox,
              scale: 1,
              duration: 100,
              ease: "Linear",
              onComplete: () => {
                selectBox.scale = 1;
                selectScaleTweens.destroy();
                selectScaleTweens = null;
                playerTweens = this.tweens.add({
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
                      selectBoxYidx + 1 < 8 &&
                      (player.y - startY) / boxSize != selectBoxYidx + 1
                    ) {
                      selectBoxYidx = selectBoxYidx + 1;
                      changeSelectionPosition(
                        player.x,
                        startY + boxSize * selectBoxYidx,
                        t,
                      );
                    } else if (
                      selectBoxXidx - 1 > -1 &&
                      (player.x - startX) / boxSize != selectBoxXidx - 1
                    ) {
                      selectBoxXidx = selectBoxXidx - 1;
                      changeSelectionPosition(
                        startX + boxSize * selectBoxXidx,
                        player.y,
                        t,
                      );
                    } else {
                      changeSelectionPosition(
                        startX + boxSize * selectBoxXidx,
                        startY + boxSize * selectBoxYidx,
                        t,
                      );
                    }
                  },
                });
              },
            });
          },
        });
      }
    } else {
      valueAdded = false;
      // selectBox.visible = false;
    }
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
