import Phaser from 'phaser';
import {
  drawPlayerFrames,
  drawEnemyFrames,
  PLAYER_FRAME_W,
  PLAYER_FRAME_H,
  PLAYER_TOTAL_FRAMES,
  ENEMY_TOTAL_FRAMES,
} from '../utils/SpriteGenerator';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.text('mapData', '/assets/map.json');
  }

  create() {
    const FW = PLAYER_FRAME_W;
    const FH = PLAYER_FRAME_H;

    // ── Player spritesheet ──────────────────────────────────────────────────
    const playerTex = this.textures.createCanvas(
      'player_anim',
      FW * PLAYER_TOTAL_FRAMES,
      FH
    )!;
    drawPlayerFrames(playerTex.getCanvas().getContext('2d')!);
    playerTex.refresh();
    for (let i = 0; i < PLAYER_TOTAL_FRAMES; i++) {
      playerTex.add(i, 0, i * FW, 0, FW, FH);
    }

    // ── Enemy spritesheet ───────────────────────────────────────────────────
    const enemyTex = this.textures.createCanvas(
      'enemy_anim',
      FW * ENEMY_TOTAL_FRAMES,
      FH
    )!;
    drawEnemyFrames(enemyTex.getCanvas().getContext('2d')!);
    enemyTex.refresh();
    for (let i = 0; i < ENEMY_TOTAL_FRAMES; i++) {
      enemyTex.add(i, 0, i * FW, 0, FW, FH);
    }

    this.scene.start('MenuScene');
  }
}
