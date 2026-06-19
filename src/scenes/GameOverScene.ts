import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  private finalScore: number = 0;
  private finalWave: number = 1;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number; wave: number }) {
    this.finalScore = data.score || 0;
    this.finalWave = data.wave || 1;

    // Save high score
    const prev = this.registry.get('highScore') || 0;
    if (this.finalScore > prev) {
      this.registry.set('highScore', this.finalScore);
    }
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.cameras.main.setBackgroundColor('#0a0a18');

    // Decorative grid
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x1a1a44, 0.8);
    for (let x = 0; x <= W; x += 64) gfx.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += 64) gfx.lineBetween(0, y, W, y);

    this.add.rectangle(W / 2, H - 10, W, 20, 0x1a2a55);
    this.add.rectangle(W / 2, H - 19, W, 3, 0x3355ff);

    // GAME OVER shadow
    this.add.text(W / 2 + 3, H / 4 + 3, 'GAME OVER', {
      fontSize: '72px',
      color: '#220000',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const gameOverText = this.add.text(W / 2, H / 4, 'GAME OVER', {
      fontSize: '72px',
      color: '#ff2222',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#440000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // Pulse effect
    this.tweens.add({
      targets: gameOverText,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Stats card
    const cardY = H / 2 + 10;
    this.add.rectangle(W / 2, cardY, 440, 180, 0x0d1a33, 0.95)
      .setStrokeStyle(2, 0x442222);

    // Score row
    this.add.text(W / 2 - 100, cardY - 50, 'SCORE', {
      fontSize: '18px',
      color: '#668899',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    this.add.text(W / 2 + 100, cardY - 50, `${this.finalScore}`, {
      fontSize: '28px',
      color: '#ffdd00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    // Wave row
    this.add.text(W / 2 - 100, cardY, 'WAVE REACHED', {
      fontSize: '18px',
      color: '#668899',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    this.add.text(W / 2 + 100, cardY, `${this.finalWave}`, {
      fontSize: '28px',
      color: '#00ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    // High score row
    const hs = this.registry.get('highScore') || 0;
    const isNew = this.finalScore === hs && hs > 0;

    this.add.text(W / 2 - 100, cardY + 50, 'HIGH SCORE', {
      fontSize: '18px',
      color: '#668899',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    const hsText = this.add.text(W / 2 + 100, cardY + 50, `${hs}`, {
      fontSize: '28px',
      color: isNew ? '#ff8800' : '#aaaaaa',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    if (isNew) {
      this.add.text(W / 2 + 110, cardY + 50, '★ NEW!', {
        fontSize: '16px',
        color: '#ff8800',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      this.tweens.add({
        targets: hsText,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    // Restart prompt
    const prompt = this.add.text(W / 2, H * 0.82, '▶  CLICK OR PRESS SPACE TO PLAY AGAIN  ◀', {
      fontSize: '18px',
      color: '#00ff88',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Input
    this.input.on('pointerdown', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-SPACE', () => this.scene.start('MenuScene'));
  }
}
