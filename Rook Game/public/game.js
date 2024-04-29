import Phaser from "phaser";

const config = {
  type: Phaser.AUTO,
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
  scene: {
    key: "main",
    preload: preload,
    create: create,
    update: update,
  },
};
const game = new Phaser.Game(config);
function preload() {
  this.load.svg("background", "./assets/board.svg");
}
function create() {
  var bg = this.add.image(config.width / 2, config.height / 2, "background");
}
function update() {}
export default game;
