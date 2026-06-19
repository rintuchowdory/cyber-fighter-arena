import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private attackHitbox!: Phaser.Physics.Arcade.Image;

  private score: number = 0;
  private health: number = 3;
  private maxHealth: number = 3;
  private combo: number = 0;
  private comboTimer?: Phaser.Time.TimerEvent;
  private waveNumber: number = 1;

  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private healthBars: Phaser.GameObjects.Rectangle[] = [];

  private isAttacking: boolean = false;
  private attackCooldown: boolean = false;
  private isInvincible: boolean = false;

  constructor() {
    super('GameScene');
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.score = 0;
    this.health = this.maxHealth;
    this.combo = 0;
    this.waveNumber = 1;
    this.isAttacking = false;
    this.attackCooldown = false;
    this.isInvincible = false;
    this.healthBars = [];

    this.cameras.main.setBackgroundColor('#0a0a18');

    // Decorative grid
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x1a1a44, 0.8);
    for (let x = 0; x <= W; x += 64) gfx.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += 64) gfx.lineBetween(0, y, W, y);

    // Floor bar
    this.add.rectangle(W / 2, H - 10, W, 20, 0x1a2a55).setDepth(1);
    // Floor glow line
    this.add.rectangle(W / 2, H - 19, W, 3, 0x3355ff).setDepth(2);

    // Player
    this.player = this.physics.add.sprite(W / 2, H - 100, 'player');
    this.player.setScale(2);
    this.player.setTint(0x00ff88);
    this.player.setBounce(0.05);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);

    // Invisible attack hitbox — uses 'player' texture, stays off-screen when idle
    this.attackHitbox = this.physics.add.image(-999, -999, 'player');
    this.attackHitbox.setVisible(false);
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setSize(60, 60);
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Enemy group
    this.enemies = this.physics.add.group();
    this.spawnWave();

    // Overlap: player vs enemies (take damage)
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.playerHitByEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Overlap: attack hitbox vs enemies (deal damage)
    this.physics.add.overlap(
      this.attackHitbox,
      this.enemies,
      this.attackHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });

    this.setupHUD(W, H);
  }

  private setupHUD(W: number, H: number) {
    // Score (top-left)
    this.scoreText = this.add.text(16, 14, 'SCORE: 0', {
      fontSize: '26px',
      color: '#00ff88',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(10);

    // Wave (top-center)
    this.waveText = this.add.text(W / 2, 14, 'WAVE 1', {
      fontSize: '26px',
      color: '#ffff44',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(10);

    // HP label (top-right)
    this.add.text(W - 14, 14, '❤ HP', {
      fontSize: '18px',
      color: '#ff5555',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(10);

    this.drawHealthBars(W);

    // Combo text (center screen)
    this.comboText = this.add.text(W / 2, H / 2 - 110, '', {
      fontSize: '48px',
      color: '#ffaa00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

    // Controls hint (bottom)
    this.add.text(W / 2, H - 36, '← → MOVE   ↑ JUMP   Z ATTACK   ESC MENU', {
      fontSize: '13px',
      color: '#334466',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(10);
  }

  private drawHealthBars(W?: number) {
    this.healthBars.forEach(b => b.destroy());
    this.healthBars = [];
    const w = W ?? this.cameras.main.width;
    for (let i = 0; i < this.maxHealth; i++) {
      const filled = i < this.health;
      const x = w - 14 - (this.maxHealth - 1 - i) * 32;
      const bar = this.add.rectangle(x, 46, 24, 12, filled ? 0xff3333 : 0x2a0a0a)
        .setDepth(10)
        .setOrigin(0, 0);
      if (filled) {
        // Glow effect on filled bars
        this.add.rectangle(x, 46, 24, 12, 0xff8888, 0.3)
          .setDepth(10)
          .setOrigin(0, 0)
          .setBlendMode(Phaser.BlendModes.ADD);
      }
      this.healthBars.push(bar);
    }
  }

  private spawnWave() {
    const W = this.cameras.main.width;
    const count = 3 + Math.floor((this.waveNumber - 1) * 1.5);
    const speed = 80 + (this.waveNumber - 1) * 22;

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(60, W - 60);
      const e = this.enemies.create(x, 60, 'enemy') as Phaser.Physics.Arcade.Sprite;
      e.setScale(1.5);
      e.setTint(0xff2222);
      e.setBounce(0.5, 0);
      e.setCollideWorldBounds(true);
      e.setDepth(4);
      const vx = (Phaser.Math.Between(0, 1) === 0 ? -1 : 1) * Phaser.Math.Between(speed, speed + 40);
      e.setVelocity(vx, 0);
    }
  }

  private playerHitByEnemy(_player: unknown, _enemy: unknown) {
    if (this.isInvincible) return;

    this.health = Math.max(0, this.health - 1);
    this.drawHealthBars();
    this.combo = 0;
    this.comboText.setAlpha(0);

    if (this.health <= 0) {
      this.cameras.main.shake(300, 0.022);
      this.player.setTint(0xff0000);
      this.time.delayedCall(350, () => {
        this.scene.start('GameOverScene', { score: this.score, wave: this.waveNumber });
      });
      return;
    }

    this.cameras.main.shake(180, 0.013);
    this.isInvincible = true;

    this.tweens.add({
      targets: this.player,
      alpha: 0.15,
      duration: 90,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        this.player.setAlpha(1);
        this.isInvincible = false;
      },
    });
  }

  private attackHitEnemy(_hitbox: unknown, enemyObj: unknown) {
    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    if (!enemy.active) return;

    const pts = 100 * Math.max(1, this.combo);
    this.score += pts;
    this.scoreText.setText(`SCORE: ${this.score}`);

    this.combo += 1;

    if (this.comboTimer) this.comboTimer.remove();
    this.comboTimer = this.time.delayedCall(2000, () => { this.combo = 0; });

    // Combo display
    if (this.combo >= 2) {
      const colors = ['#ffaa00', '#ff7700', '#ff3300', '#ff00ff'];
      const ci = Math.min(this.combo - 2, colors.length - 1);
      this.comboText.setText(`${this.combo}x COMBO!`);
      this.comboText.setColor(colors[ci]);
      this.comboText.setAlpha(1);
      this.comboText.setScale(1.3);
      this.tweens.killTweensOf(this.comboText);
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        scaleX: 1,
        scaleY: 1,
        y: { from: this.cameras.main.height / 2 - 110, to: this.cameras.main.height / 2 - 140 },
        duration: 1400,
        ease: 'Power2',
      });
    }

    // Floating score popup
    const ft = this.add.text(enemy.x, enemy.y - 20, `+${pts}`, {
      fontSize: '22px',
      color: '#ffdd00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    }).setDepth(20).setOrigin(0.5);

    this.tweens.add({
      targets: ft,
      y: ft.y - 65,
      alpha: 0,
      duration: 950,
      ease: 'Power1',
      onComplete: () => ft.destroy(),
    });

    // Screen flash on kill
    this.cameras.main.flash(70, 255, 80, 0, false);

    // Small shockwave ring
    const ring = this.add.circle(enemy.x, enemy.y, 10, 0xff8800, 0.8).setDepth(6);
    this.tweens.add({
      targets: ring,
      scaleX: 4, scaleY: 4,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });

    enemy.destroy();

    // Wave cleared?
    if (this.enemies.countActive(true) === 0) {
      this.waveNumber += 1;
      this.waveText.setText(`WAVE ${this.waveNumber}`);

      // Bounce-scale the wave label
      this.tweens.add({
        targets: this.waveText,
        scaleX: 1.7, scaleY: 1.7,
        duration: 200,
        yoyo: true,
        ease: 'Back.Out',
      });

      // "WAVE CLEAR!" announcement
      const ann = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'WAVE CLEAR!',
        {
          fontSize: '56px',
          color: '#00ffff',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          stroke: '#000',
          strokeThickness: 6,
        }
      ).setOrigin(0.5).setDepth(15);

      this.tweens.add({
        targets: ann,
        alpha: 0,
        y: ann.y - 80,
        duration: 900,
        delay: 300,
        onComplete: () => ann.destroy(),
      });

      this.time.delayedCall(900, () => this.spawnWave());
    }
  }

  update() {
    if (!this.player || !this.cursors) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-210);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(210);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump (only when on ground)
    if (this.cursors.up.isDown && body.blocked.down) {
      this.player.setVelocityY(-430);
    }

    // Attack
    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.attackCooldown) {
      this.doAttack();
    }

    // Keep hitbox locked to player front while attacking
    if (this.isAttacking) {
      const ox = this.player.flipX ? -58 : 58;
      const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
      hb.reset(this.player.x + ox, this.player.y);
    }
  }

  private doAttack() {
    this.attackCooldown = true;
    this.isAttacking = true;

    // Player flash white → green
    this.player.setTint(0xffffff);
    this.time.delayedCall(80, () => this.player.setTint(0x00ff88));

    // Attack arc circle
    const ox = this.player.flipX ? -58 : 58;
    const arc = this.add.circle(this.player.x + ox, this.player.y, 32, 0x00ffff, 0.65).setDepth(6);
    this.tweens.add({
      targets: arc,
      alpha: 0,
      scaleX: 2.2,
      scaleY: 2.2,
      duration: 230,
      ease: 'Power2',
      onComplete: () => arc.destroy(),
    });

    // Place hitbox
    const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
    hb.reset(this.player.x + ox, this.player.y);

    // Deactivate hitbox window
    this.time.delayedCall(170, () => {
      this.isAttacking = false;
      hb.reset(-999, -999);
    });

    // Cooldown
    this.time.delayedCall(360, () => {
      this.attackCooldown = false;
    });
  }
}
