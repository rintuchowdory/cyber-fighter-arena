import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
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

    // Floor glow
    this.add.rectangle(W / 2, H - 10, W, 20, 0x1a2a55);
    this.add.rectangle(W / 2, H - 19, W, 3, 0x3355ff);

    // Title glow (layered)
    this.add.text(W / 2 + 2, H / 4 + 2, 'CYBER FIGHTER', {
      fontSize: '60px',
      color: '#003322',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const title = this.add.text(W / 2, H / 4, 'CYBER FIGHTER', {
      fontSize: '60px',
      color: '#00ff88',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#004422',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 4 + 58, 'ARENA', {
      fontSize: '38px',
      color: '#00ccff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#002244',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Pulse the title
    this.tweens.add({
      targets: title,
      alpha: 0.75,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Controls card
    const cardX = W / 2;
    const cardY = H / 2 + 20;
    this.add.rectangle(cardX, cardY, 420, 180, 0x0d1a33, 0.9)
      .setStrokeStyle(2, 0x224488);

    this.add.text(cardX, cardY - 70, 'CONTROLS', {
      fontSize: '16px',
      color: '#334466',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const controls = [
      ['← →', 'Move'],
      ['↑', 'Jump'],
      ['Z', 'Attack'],
      ['ESC', 'Menu'],
    ];

    controls.forEach(([key, action], i) => {
      const row = cardY - 44 + i * 34;
      this.add.text(cardX - 90, row, key, {
        fontSize: '20px',
        color: '#00ccff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      this.add.text(cardX - 10, row, action, {
        fontSize: '20px',
        color: '#aabbcc',
        fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
    });

    // Start prompt (blinking)
    const prompt = this.add.text(W / 2, H * 0.78, '▶  CLICK OR PRESS SPACE TO START  ◀', {
      fontSize: '20px',
      color: '#ffff44',
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

    // High score display
    const hs = this.registry.get('highScore') || 0;
    if (hs > 0) {
      this.add.text(W / 2, H * 0.88, `HIGH SCORE: ${hs}`, {
        fontSize: '18px',
        color: '#ff8800',
        fontFamily: 'monospace',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5);
    }

    // Input
    this.input.on('pointerdown', () => this.scene.start('GameScene'));
    this.input.keyboard?.on('keydown-SPACE', () => this.scene.start('GameScene'));
  }
}
