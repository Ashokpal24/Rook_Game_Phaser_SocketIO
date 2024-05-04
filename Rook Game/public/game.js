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
  // antialias: false,
};
const game = new Phaser.Game(config);
var bg;
var player;
var playerTweens = null;
var selectBox;
var selectBoxXidx = 0;
var selectBoxYidx = 0;
var selectTweens = null;
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
}
function update() {
  cursors = this.input.keyboard.createCursorKeys();
  var t = this;
  limitX = (player.x - startX) / boxSize - 1;
  limitY = (player.y - startY) / boxSize + 1;
  if (cursors != null) {
    if (cursors.down.isDown) {
      if (selectBoxYidx != 7 && valueAdded == false) {
        selectBoxYidx++;
        valueAdded = true;
      }
      selectBox.visible = true;
      selectBox.x = player.x;
      selectBox.y = startY + boxSize * selectBoxYidx;

      destroyBoxObject();
    } else if (cursors.up.isDown) {
      if (selectBoxYidx != limitY && valueAdded == false) {
        selectBoxYidx--;
        valueAdded = true;
      }
      selectBox.visible = true;
      selectBox.x = player.x;
      selectBox.y = startY + boxSize * selectBoxYidx;

      destroyBoxObject();
    } else if (cursors.right.isDown) {
      if (selectBoxXidx != limitX && valueAdded == false) {
        selectBoxXidx++;
        valueAdded = true;
      }
      selectBox.visible = true;
      selectBox.x = startX + boxSize * selectBoxXidx;
      selectBox.y = player.y;

      destroyBoxObject();
    } else if (cursors.left.isDown) {
      if (selectBoxXidx != 0 && valueAdded == false) {
        selectBoxXidx--;
        valueAdded = true;
      }
      selectBox.visible = true;
      selectBox.x = startX + boxSize * selectBoxXidx;
      selectBox.y = player.y;

      destroyBoxObject();
    } else if (cursors.space.isDown) {
      console.log(selectBoxXidx, selectBoxYidx);
      if (selectTweens == null) {
        selectTweens = this.tweens.add({
          targets: selectBox,
          scale: 1.3,
          duration: 100,
          ease: "Power1",
          onComplete: () => {
            selectTweens = this.tweens.add({
              targets: selectBox,
              scale: 1,
              duration: 100,
              ease: "Linear",
              onComplete: () => {
                selectBox.scale = 1;
                selectTweens.destroy();
                selectTweens = null;
                playerTweens = this.tweens.add({
                  targets: player,
                  props: {
                    x: {
                      value: selectBox.x,
                      duration: 1000,
                      ease: "Power1",
                    },
                    y: {
                      value: selectBox.y,
                      duration: 1000,
                      ease: "Power1",
                    },
                  },
                  onStart: () => {
                    selectBox.visible = false;
                    destroyBoxObject();
                  },
                  onComplete: () => {
                    addMarker(t);
                    playerTweens.destroy();
                    playerTweens = null;
                  },
                });
              },
            });
          },
        });
      }
      // destroyBoxObject();
    } else {
      valueAdded = false;
      // addMarker(t);
      // selectBox.visible = false;
    }
  }
}
function addMarker(t) {
  if (
    boxDownList.length != 8 - (player.y - startY) / boxSize + 1 &&
    boxSideList.length != 8 - (8 - (player.x - startX) / boxSize)
  ) {
    var count = (player.y - startY) / boxSize;
    // console.log(count);
    for (let i = count; i < 7; i++) {
      if (player.y == startY + boxSize * count) {
        count++;
      }

      const box = t.add.image(player.x, startY + boxSize * count, "box");
      boxDownList.push(box);
      count++;
    }
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
