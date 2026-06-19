import Phaser from 'phaser';

type PlayerAnim = 'idle' | 'walk' | 'jump' | 'attack';

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
  private currentAnim: PlayerAnim = 'idle';

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
    this.currentAnim = 'idle';
    this.healthBars = [];

    this.cameras.main.setBackgroundColor('#0a0a18');

    // Decorative grid
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x1a1a44, 0.8);
    for (let x = 0; x <= W; x += 64) gfx.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += 64) gfx.lineBetween(0, y, W, y);

    // Floor
    this.add.rectangle(W / 2, H - 10, W, 20, 0x1a2a55).setDepth(1);
    this.add.rectangle(W / 2, H - 19, W, 3, 0x3355ff).setDepth(2);

    // ── PLAYER ─────────────────────────────────────────────────────────────
    this.player = this.physics.add.sprite(W / 2, H - 100, 'player_anim', 0);
    this.player.setScale(2);
    // Body size in local pixels (multiplied by scale internally)
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(22, 40, true);
    this.player.setBounce(0.05);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);

    // ── ATTACK HITBOX ───────────────────────────────────────────────────────
    this.attackHitbox = this.physics.add.image(-999, -999, 'player_anim');
    this.attackHitbox.setVisible(false);
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setSize(60, 60);
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // ── DEFINE ANIMATIONS ───────────────────────────────────────────────────
    this.createAnims();

    // Start idle
    this.player.play('player_idle');

    // ── ENEMIES ─────────────────────────────────────────────────────────────
    this.enemies = this.physics.add.group();
    this.spawnWave();

    // ── OVERLAPS ────────────────────────────────────────────────────────────
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.playerHitByEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.attackHitbox,
      this.enemies,
      this.attackHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Attack animation complete → unlock
    this.player.on('animationcomplete-player_attack', () => {
      this.isAttacking = false;
      (this.attackHitbox.body as Phaser.Physics.Arcade.Body).reset(-999, -999);
    });

    // ── INPUT ────────────────────────────────────────────────────────────────
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'));

    // ── HUD ──────────────────────────────────────────────────────────────────
    this.setupHUD(W, H);
  }

  // ── ANIMATION DEFINITIONS ─────────────────────────────────────────────────
  private createAnims() {
    const add = (key: string, start: number, end: number, rate: number, repeat = -1) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('player_anim', { start, end }),
        frameRate: rate,
        repeat,
      });
    };

    add('player_idle',   0,  3,  6);          // 4 frames, loop
    add('player_walk',   4,  9, 10);          // 6 frames, loop
    add('player_jump',  10, 11,  8, 0);       // 2 frames, no loop
    add('player_attack',12, 15, 14, 0);       // 4 frames, no loop

    if (!this.anims.exists('enemy_walk')) {
      this.anims.create({
        key: 'enemy_walk',
        frames: this.anims.generateFrameNumbers('enemy_anim', { start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!this.anims.exists('enemy_idle')) {
      this.anims.create({
        key: 'enemy_idle',
        frames: this.anims.generateFrameNumbers('enemy_anim', { start: 6, end: 9 }),
        frameRate: 5,
        repeat: -1,
      });
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  private setupHUD(W: number, H: number) {
    this.scoreText = this.add.text(16, 14, 'SCORE: 0', {
      fontSize: '26px',
      color: '#00ff88',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
    }).setDepth(10);

    this.waveText = this.add.text(W / 2, 14, 'WAVE 1', {
      fontSize: '26px',
      color: '#ffff44',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(10);

    this.add.text(W - 14, 14, '❤ HP', {
      fontSize: '18px',
      color: '#ff5555',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(10);

    this.drawHealthBars(W);

    this.comboText = this.add.text(W / 2, H / 2 - 110, '', {
      fontSize: '48px',
      color: '#ffaa00',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(10).setAlpha(0);

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
        .setDepth(10).setOrigin(0, 0);
      if (filled) {
        this.add.rectangle(x, 46, 24, 12, 0xff8888, 0.3)
          .setDepth(10).setOrigin(0, 0)
          .setBlendMode(Phaser.BlendModes.ADD);
      }
      this.healthBars.push(bar);
    }
  }

  // ── WAVE SPAWNING ─────────────────────────────────────────────────────────
  private spawnWave() {
    const W = this.cameras.main.width;
    const count = 3 + Math.floor((this.waveNumber - 1) * 1.5);
    const speed = 80 + (this.waveNumber - 1) * 22;

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(80, W - 80);
      const e = this.enemies.create(x, 90, 'enemy_anim', 0) as Phaser.Physics.Arcade.Sprite;
      e.setScale(2);
      (e.body as Phaser.Physics.Arcade.Body).setSize(20, 38, true);
      e.setBounce(0.5, 0);
      e.setCollideWorldBounds(true);
      e.setDepth(4);
      const vx = (Phaser.Math.Between(0, 1) === 0 ? -1 : 1) * Phaser.Math.Between(speed, speed + 40);
      e.setVelocity(vx, 0);
      e.play('enemy_walk');
    }
  }

  // ── PLAYER ANIM STATE MACHINE ─────────────────────────────────────────────
  private setPlayerAnim(anim: PlayerAnim) {
    if (anim === this.currentAnim) return;
    if (this.currentAnim === 'attack' && this.isAttacking) return; // don't interrupt attack
    this.currentAnim = anim;
    this.player.play(`player_${anim}`);
  }

  // ── COMBAT ────────────────────────────────────────────────────────────────
  private playerHitByEnemy(_player: unknown, _enemy: unknown) {
    if (this.isInvincible) return;

    this.health = Math.max(0, this.health - 1);
    this.drawHealthBars();
    this.combo = 0;
    this.comboText.setAlpha(0);

    if (this.health <= 0) {
      this.cameras.main.shake(300, 0.022);
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

    // Combo text
    if (this.combo >= 2) {
      const colors = ['#ffaa00', '#ff7700', '#ff3300', '#ff00ff'];
      const ci = Math.min(this.combo - 2, colors.length - 1);
      this.comboText.setText(`${this.combo}x COMBO!`);
      this.comboText.setColor(colors[ci]);
      this.comboText.setAlpha(1).setScale(1.3);
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
    const ft = this.add.text(enemy.x, enemy.y - 30, `+${pts}`, {
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

    this.cameras.main.flash(70, 255, 80, 0, false);

    // Shockwave ring on death
    const ring = this.add.circle(enemy.x, enemy.y, 12, 0xff8800, 0.8).setDepth(6);
    this.tweens.add({
      targets: ring,
      scaleX: 4.5, scaleY: 4.5,
      alpha: 0,
      duration: 320,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });

    enemy.destroy();

    // Wave cleared?
    if (this.enemies.countActive(true) === 0) {
      this.waveNumber += 1;
      this.waveText.setText(`WAVE ${this.waveNumber}`);
      this.tweens.add({
        targets: this.waveText,
        scaleX: 1.7, scaleY: 1.7,
        duration: 200,
        yoyo: true,
        ease: 'Back.Out',
      });

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

  // ── UPDATE LOOP ───────────────────────────────────────────────────────────
  update() {
    if (!this.player || !this.cursors) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // ── Horizontal movement ─────────────────────────────────────
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-210);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(210);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // ── Jump ────────────────────────────────────────────────────
    if (this.cursors.up.isDown && onGround) {
      this.player.setVelocityY(-430);
    }

    // ── Attack ──────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.attackCooldown) {
      this.doAttack();
    }

    // ── Keep hitbox locked to player front while attacking ──────
    if (this.isAttacking) {
      const ox = this.player.flipX ? -70 : 70;
      const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
      hb.reset(this.player.x + ox, this.player.y);
    }

    // ── Enemy facing direction ───────────────────────────────────
    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Phaser.Physics.Arcade.Sprite;
      if (e.active) {
        e.setFlipX(e.body!.velocity.x < 0);
      }
    });

    // ── Player animation state machine ──────────────────────────
    if (!this.isAttacking) {
      if (!onGround) {
        this.setPlayerAnim('jump');
      } else if (Math.abs(body.velocity.x) > 10) {
        this.setPlayerAnim('walk');
      } else {
        this.setPlayerAnim('idle');
      }
    }
  }

  // ── ATTACK EXECUTION ──────────────────────────────────────────────────────
  private doAttack() {
    this.attackCooldown = true;
    this.isAttacking = true;
    this.currentAnim = 'attack';
    this.player.play('player_attack');

    // Place hitbox on frame 1 of attack (the "strike" frame)
    const ox = this.player.flipX ? -70 : 70;
    const hb = this.attackHitbox.body as Phaser.Physics.Arcade.Body;
    hb.reset(this.player.x + ox, this.player.y);

    // Arc visual
    const arc = this.add.circle(this.player.x + ox, this.player.y, 34, 0x00ffff, 0.6).setDepth(6);
    this.tweens.add({
      targets: arc,
      alpha: 0,
      scaleX: 2.4,
      scaleY: 2.4,
      duration: 240,
      ease: 'Power2',
      onComplete: () => arc.destroy(),
    });

    // Deactivate hitbox after strike window (~2 frames at 14fps ≈ 140ms)
    this.time.delayedCall(140, () => {
      hb.reset(-999, -999);
    });

    // Cooldown after full animation (~4 frames at 14fps ≈ 290ms + buffer)
    this.time.delayedCall(380, () => {
      this.attackCooldown = false;
      // If attack anim finished naturally, isAttacking was reset via event;
      // ensure consistency
      if (this.currentAnim === 'attack') {
        this.isAttacking = false;
        this.currentAnim = 'idle';
        this.player.play('player_idle');
      }
    });
  }
}
