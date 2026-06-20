import Phaser from 'phaser';

interface LeaderboardEntry {
  name: string;
  score: number;
  wave: number;
}

export default class GameOverScene extends Phaser.Scene {
  private finalScore: number = 0;
  private finalWave: number = 1;
  private playerName: string = '';
  private nameChars: string[] = ['A', 'A', 'A'];
  private cursorIndex: number = 0;
  private nameTexts: Phaser.GameObjects.Text[] = [];
  private leaderboard: LeaderboardEntry[] = [];
  private phase: 'name' | 'board' = 'name';
  private submitted: boolean = false;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number; wave: number }) {
    this.finalScore = data.score || 0;
    this.finalWave = data.wave || 1;
    this.nameChars = ['A', 'A', 'A'];
    this.cursorIndex = 0;
    this.phase = 'name';
    this.submitted = false;

    const prev = this.registry.get('highScore') || 0;
    if (this.finalScore > prev) {
      this.registry.set('highScore', this.finalScore);
    }
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.cameras.main.setBackgroundColor('#0a0a18');

    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x1a1a44, 0.8);
    for (let x = 0; x <= W; x += 64) gfx.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += 64) gfx.lineBetween(0, y, W, y);

    this.add.rectangle(W / 2, H - 10, W, 20, 0x1a2a55);
    this.add.rectangle(W / 2, H - 19, W, 3, 0x3355ff);

    this.add.text(W / 2 + 3, H / 5 + 3, 'GAME OVER', {
      fontSize: '72px', color: '#220000', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    const gameOverText = this.add.text(W / 2, H / 5, 'GAME OVER', {
      fontSize: '72px', color: '#ff2222', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#440000', strokeThickness: 5,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: gameOverText, scaleX: 1.04, scaleY: 1.04,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut',
    });

    const cardY = H / 2 - 40;
    this.add.rectangle(W / 2, cardY, 440, 130, 0x0d1a33, 0.95).setStrokeStyle(2, 0x442222);

    this.add.text(W / 2 - 100, cardY - 30, 'SCORE', {
      fontSize: '18px', color: '#668899', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);
    this.add.text(W / 2 + 100, cardY - 30, `${this.finalScore}`, {
      fontSize: '28px', color: '#ffdd00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    this.add.text(W / 2 - 100, cardY + 20, 'WAVE REACHED', {
      fontSize: '18px', color: '#668899', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);
    this.add.text(W / 2 + 100, cardY + 20, `${this.finalWave}`, {
      fontSize: '28px', color: '#00ccff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    const hs = this.registry.get('highScore') || 0;
    const isNew = this.finalScore === hs && hs > 0;
    this.add.text(W / 2 - 100, cardY + 70, 'HIGH SCORE', {
      fontSize: '18px', color: '#668899', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);
    const hsText = this.add.text(W / 2 + 100, cardY + 70, `${hs}`, {
      fontSize: '28px', color: isNew ? '#ff8800' : '#aaaaaa', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    if (isNew) {
      this.add.text(W / 2 + 110, cardY + 70, '★ NEW!', {
        fontSize: '16px', color: '#ff8800', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.tweens.add({ targets: hsText, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
    }

    this.createNameEntry(W, H);
  }

  private createNameEntry(W: number, H: number) {
    const baseY = H * 0.68;

    this.add.text(W / 2, baseY - 30, 'ENTER YOUR NAME', {
      fontSize: '18px', color: '#00ff88', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(W / 2 - 120, baseY + 14, '◄', {
      fontSize: '18px', color: '#446688', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);
    this.add.text(W / 2 + 100, baseY + 14, '►', {
      fontSize: '18px', color: '#446688', fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    this.nameTexts = [];
    const spacing = 52;
    for (let i = 0; i < 3; i++) {
      const x = W / 2 - spacing + i * spacing;
      const box = this.add.rectangle(x, baseY + 14, 44, 44, 0x112233).setStrokeStyle(2, 0x224488);
      const t = this.add.text(x, baseY + 14, this.nameChars[i], {
        fontSize: '32px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.nameTexts.push(t);
      (box as any)._idx = i;
    }

    this.add.text(W / 2, baseY + 60, '↑↓ change  ←→ move  ENTER confirm', {
      fontSize: '13px', color: '#445566', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const kbd = this.input.keyboard!;
    kbd.on('keydown-UP', () => this.changeLetter(1));
    kbd.on('keydown-DOWN', () => this.changeLetter(-1));
    kbd.on('keydown-LEFT', () => this.moveCursor(-1));
    kbd.on('keydown-RIGHT', () => this.moveCursor(1));
    kbd.on('keydown-ENTER', () => this.confirmName());
    kbd.on('keydown-SPACE', () => this.confirmName());

    this.updateCursorHighlight();
  }

  private changeLetter(dir: number) {
    if (this.phase !== 'name') return;
    const code = this.nameChars[this.cursorIndex].charCodeAt(0) + dir;
    const clamped = Math.max(65, Math.min(90, code));
    this.nameChars[this.cursorIndex] = String.fromCharCode(clamped);
    this.nameTexts[this.cursorIndex].setText(this.nameChars[this.cursorIndex]);
  }

  private moveCursor(dir: number) {
    if (this.phase !== 'name') return;
    this.cursorIndex = (this.cursorIndex + dir + 3) % 3;
    this.updateCursorHighlight();
  }

  private updateCursorHighlight() {
    this.nameTexts.forEach((t, i) => {
      t.setColor(i === this.cursorIndex ? '#ffff00' : '#ffffff');
    });
  }

  private async confirmName() {
    if (this.phase !== 'name' || this.submitted) return;
    this.submitted = true;
    this.phase = 'board';
    this.playerName = this.nameChars.join('');

    this.input.keyboard!.removeAllListeners();
    this.input.removeAllListeners();

    if (this.finalScore > 0) {
      try {
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.playerName,
            score: this.finalScore,
            wave: this.finalWave,
          }),
        });
      } catch { /* offline / server not available */ }
    }

    try {
      const res = await fetch('/api/leaderboard');
      this.leaderboard = await res.json();
    } catch {
      this.leaderboard = [];
    }

    this.showLeaderboard();
  }

  private showLeaderboard() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    const boardY = H * 0.67;
    const boardH = Math.min(220, 30 + this.leaderboard.length * 26 + 20);

    this.add.rectangle(W / 2, boardY + boardH / 2 - 20, 480, boardH, 0x080d1a, 0.97)
      .setStrokeStyle(2, 0x1a3366);

    this.add.text(W / 2, boardY - 10, '— GLOBAL TOP 10 —', {
      fontSize: '15px', color: '#3366aa', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (this.leaderboard.length === 0) {
      this.add.text(W / 2, boardY + 30, 'No scores yet — you\'re first!', {
        fontSize: '14px', color: '#446688', fontFamily: 'monospace',
      }).setOrigin(0.5);
    } else {
      this.leaderboard.forEach((entry, i) => {
        const y = boardY + 14 + i * 24;
        const isMe = entry.name === this.playerName && entry.score === this.finalScore;
        const color = isMe ? '#ffff44' : i === 0 ? '#ffd700' : '#aabbcc';
        const rank = `${i + 1}`.padStart(2, ' ');
        this.add.text(W / 2 - 210, y, `${rank}.`, {
          fontSize: '14px', color: '#445566', fontFamily: 'monospace',
        }).setOrigin(0, 0.5);
        this.add.text(W / 2 - 185, y, entry.name, {
          fontSize: '14px', color, fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0, 0.5);
        this.add.text(W / 2 + 80, y, `${entry.score}`, {
          fontSize: '14px', color, fontFamily: 'monospace',
        }).setOrigin(1, 0.5);
        this.add.text(W / 2 + 160, y, `W${entry.wave}`, {
          fontSize: '13px', color: '#334455', fontFamily: 'monospace',
        }).setOrigin(1, 0.5);
      });
    }

    const restartY = boardY + boardH + 14;
    const prompt = this.add.text(W / 2, restartY, '▶  CLICK OR PRESS SPACE TO PLAY AGAIN  ◀', {
      fontSize: '17px', color: '#00ff88', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({ targets: prompt, alpha: 0, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.input.on('pointerdown', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on('keydown-SPACE', () => this.scene.start('MenuScene'));
  }
}
