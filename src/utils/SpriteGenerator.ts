const FW = 32;
const FH = 48;

function px(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  fi: number,
  opt: {
    bodyBob?: number;
    leftLegY?: number;
    rightLegY?: number;
    leftArmY?: number;
    rightArmY?: number;
    punchExt?: number;
    squat?: number;
  }
) {
  const {
    bodyBob = 0,
    leftLegY = 0,
    rightLegY = 0,
    leftArmY = 0,
    rightArmY = 0,
    punchExt = 0,
    squat = 0,
  } = opt;

  const bx = fi * FW;
  const by = Math.round(bodyBob) + squat;

  // HEAD
  px(ctx, '#005533', bx + 11, by + 1, 10, 11);
  px(ctx, '#00cc77', bx + 12, by + 2, 8, 9);
  px(ctx, '#00aa66', bx + 12, by + 2, 8, 2);
  px(ctx, '#00ffcc', bx + 12, by + 5, 8, 3);
  px(ctx, '#aaffee', bx + 12, by + 5, 3, 1);
  px(ctx, '#00cc77', bx + 12, by + 9, 8, 2);

  // NECK
  px(ctx, '#003322', bx + 14, by + 11, 4, 4);

  // TORSO
  const torsoH = 13 + squat;
  px(ctx, '#003322', bx + 8, by + 14, 16, torsoH + 2);
  px(ctx, '#00aa66', bx + 9, by + 15, 14, torsoH);
  px(ctx, '#00cc77', bx + 9, by + 15, 3, torsoH);
  px(ctx, '#008855', bx + 20, by + 15, 3, torsoH);
  px(ctx, '#00ffcc', bx + 12, by + 17, 8, 3);
  px(ctx, '#aaffee', bx + 12, by + 17, 3, 1);
  px(ctx, '#003322', bx + 12, by + 21, 8, 1);

  // LEFT ARM
  const laY = Math.round(leftArmY);
  px(ctx, '#003322', bx + 3, by + 15 + laY, 7, 11);
  px(ctx, '#007744', bx + 4, by + 16 + laY, 5, 9);
  px(ctx, '#00aa66', bx + 4, by + 16 + laY, 2, 9);
  px(ctx, '#00ffcc', bx + 4, by + 23 + laY, 5, 2);

  // RIGHT ARM or PUNCH
  if (punchExt > 0) {
    px(ctx, '#003322', bx + 22, by + 17, punchExt + 2, 7);
    px(ctx, '#007744', bx + 23, by + 18, punchExt, 5);
    px(ctx, '#00ffcc', bx + 23 + punchExt - 4, by + 18, 4, 5);
    px(ctx, '#aaffee', bx + 23 + punchExt - 4, by + 18, 4, 1);
  } else {
    const raY = Math.round(rightArmY);
    px(ctx, '#003322', bx + 22, by + 15 + raY, 7, 11);
    px(ctx, '#007744', bx + 23, by + 16 + raY, 5, 9);
    px(ctx, '#008855', bx + 26, by + 16 + raY, 2, 9);
    px(ctx, '#00ffcc', bx + 23, by + 23 + raY, 5, 2);
  }

  // LEGS
  const legBase = by + 27 + squat;

  const ll = Math.round(leftLegY);
  if (ll < 0) {
    px(ctx, '#003322', bx + 9, legBase, 8, 10);
    px(ctx, '#006644', bx + 10, legBase + 1, 6, 8);
    px(ctx, '#003322', bx + 8, legBase + 9, 10, 4);
    px(ctx, '#004433', bx + 9, legBase + 10, 8, 3);
  } else {
    const legH = 14 + ll;
    px(ctx, '#003322', bx + 9, legBase, 8, legH + 3);
    px(ctx, '#006644', bx + 10, legBase + 1, 6, legH);
    px(ctx, '#00aa66', bx + 10, legBase + 1, 2, legH);
    px(ctx, '#003322', bx + 8, legBase + legH, 10, 4);
    px(ctx, '#004433', bx + 9, legBase + legH + 1, 8, 3);
  }

  const rl = Math.round(rightLegY);
  if (rl < 0) {
    px(ctx, '#003322', bx + 16, legBase, 8, 10);
    px(ctx, '#006644', bx + 17, legBase + 1, 6, 8);
    px(ctx, '#003322', bx + 15, legBase + 9, 10, 4);
    px(ctx, '#004433', bx + 16, legBase + 10, 8, 3);
  } else {
    const legH = 14 + rl;
    px(ctx, '#003322', bx + 16, legBase, 8, legH + 3);
    px(ctx, '#006644', bx + 17, legBase + 1, 6, legH);
    px(ctx, '#00aa66', bx + 19, legBase + 1, 2, legH);
    px(ctx, '#003322', bx + 15, legBase + legH, 10, 4);
    px(ctx, '#004433', bx + 16, legBase + legH + 1, 8, 3);
  }
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  fi: number,
  opt: {
    bodyBob?: number;
    leftLegY?: number;
    rightLegY?: number;
  }
) {
  const { bodyBob = 0, leftLegY = 0, rightLegY = 0 } = opt;

  const bx = fi * FW;
  const by = Math.round(bodyBob);

  // HEAD
  px(ctx, '#440000', bx + 9, by + 1, 14, 13);
  px(ctx, '#cc2200', bx + 10, by + 2, 12, 11);
  px(ctx, '#aa1100', bx + 10, by + 2, 12, 3);
  px(ctx, '#ff6600', bx + 11, by + 5, 4, 3);
  px(ctx, '#ff6600', bx + 17, by + 5, 4, 3);
  px(ctx, '#ffff00', bx + 12, by + 6, 2, 1);
  px(ctx, '#ffff00', bx + 18, by + 6, 2, 1);
  px(ctx, '#cc2200', bx + 10, by + 9, 12, 4);
  px(ctx, '#440000', bx + 11, by + 12, 2, 2);
  px(ctx, '#440000', bx + 14, by + 12, 2, 2);
  px(ctx, '#440000', bx + 17, by + 12, 2, 2);

  // NECK
  px(ctx, '#330000', bx + 13, by + 13, 6, 3);

  // TORSO
  px(ctx, '#330000', bx + 6, by + 15, 20, 14);
  px(ctx, '#aa1100', bx + 7, by + 16, 18, 12);
  px(ctx, '#cc2200', bx + 7, by + 16, 3, 12);
  px(ctx, '#880000', bx + 22, by + 16, 3, 12);
  px(ctx, '#330000', bx + 13, by + 17, 2, 10);
  px(ctx, '#330000', bx + 17, by + 17, 2, 10);
  px(ctx, '#ff2200', bx + 11, by + 19, 10, 2);

  // ARMS
  px(ctx, '#330000', bx + 1, by + 16, 7, 14);
  px(ctx, '#880000', bx + 2, by + 17, 5, 12);
  px(ctx, '#aa1100', bx + 2, by + 17, 2, 12);
  px(ctx, '#ff2200', bx + 2, by + 27, 5, 3);
  px(ctx, '#330000', bx + 1, by + 29, 7, 2);
  px(ctx, '#330000', bx + 24, by + 16, 7, 14);
  px(ctx, '#880000', bx + 25, by + 17, 5, 12);
  px(ctx, '#880000', bx + 28, by + 17, 2, 12);
  px(ctx, '#ff2200', bx + 25, by + 27, 5, 3);
  px(ctx, '#330000', bx + 24, by + 29, 7, 2);

  // LEGS
  const legBase = by + 29;

  const ll = Math.round(leftLegY);
  if (ll < 0) {
    px(ctx, '#330000', bx + 8, legBase, 9, 11);
    px(ctx, '#880000', bx + 9, legBase + 1, 7, 9);
    px(ctx, '#330000', bx + 7, legBase + 10, 11, 4);
    px(ctx, '#550000', bx + 8, legBase + 11, 9, 3);
  } else {
    const legH = 12 + ll;
    px(ctx, '#330000', bx + 8, legBase, 9, legH + 3);
    px(ctx, '#880000', bx + 9, legBase + 1, 7, legH);
    px(ctx, '#aa1100', bx + 9, legBase + 1, 2, legH);
    px(ctx, '#330000', bx + 7, legBase + legH, 11, 4);
    px(ctx, '#550000', bx + 8, legBase + legH + 1, 9, 3);
  }

  const rl = Math.round(rightLegY);
  if (rl < 0) {
    px(ctx, '#330000', bx + 16, legBase, 9, 11);
    px(ctx, '#880000', bx + 17, legBase + 1, 7, 9);
    px(ctx, '#330000', bx + 15, legBase + 10, 11, 4);
    px(ctx, '#550000', bx + 16, legBase + 11, 9, 3);
  } else {
    const legH = 12 + rl;
    px(ctx, '#330000', bx + 16, legBase, 9, legH + 3);
    px(ctx, '#880000', bx + 17, legBase + 1, 7, legH);
    px(ctx, '#880000', bx + 21, legBase + 1, 2, legH);
    px(ctx, '#330000', bx + 15, legBase + legH, 11, 4);
    px(ctx, '#550000', bx + 16, legBase + legH + 1, 9, 3);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: draw onto a Phaser CanvasTexture's 2D context
// ─────────────────────────────────────────────────────────────────────────────

/** Draws 16 player frames (idle×4, walk×6, jump×2, attack×4) */
export function drawPlayerFrames(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, FW * 16, FH);

  // idle (0-3)
  [0, 0.5, 1, 0.5].forEach((bob, i) => drawPlayer(ctx, i, { bodyBob: bob }));

  // walk (4-9)  [leftLegY, rightLegY, leftArmY, rightArmY, bodyBob]
  const walkData: [number, number, number, number, number][] = [
    [0, 0, 0, 0, 0],
    [-4, 3, 2, -2, 0.5],
    [-2, 5, 3, -3, 1],
    [0, 0, 0, 0, 0],
    [3, -4, -2, 2, 0.5],
    [5, -2, -3, 3, 1],
  ];
  walkData.forEach(([ll, rl, la, ra, bob], i) =>
    drawPlayer(ctx, 4 + i, { leftLegY: ll, rightLegY: rl, leftArmY: la, rightArmY: ra, bodyBob: bob })
  );

  // jump (10-11)
  drawPlayer(ctx, 10, { squat: 3, leftLegY: -3, rightLegY: -3 });
  drawPlayer(ctx, 11, { squat: -2, leftLegY: -5, rightLegY: -5, leftArmY: -3, rightArmY: -3 });

  // attack (12-15)
  drawPlayer(ctx, 12, { rightArmY: -4, leftArmY: 2 });
  drawPlayer(ctx, 13, { punchExt: 10 });
  drawPlayer(ctx, 14, { punchExt: 6 });
  drawPlayer(ctx, 15, { rightArmY: 2 });
}

/** Draws 10 enemy frames (walk×6, idle×4) */
export function drawEnemyFrames(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, FW * 10, FH);

  const walkData: [number, number, number][] = [
    [0, 0, 0],
    [0.5, -4, 3],
    [1, -2, 5],
    [0, 0, 0],
    [0.5, 3, -4],
    [1, 5, -2],
  ];
  walkData.forEach(([bob, ll, rl], i) =>
    drawEnemy(ctx, i, { bodyBob: bob, leftLegY: ll, rightLegY: rl })
  );

  for (let f = 0; f < 4; f++) {
    drawEnemy(ctx, 6 + f, { bodyBob: Math.sin(f * Math.PI / 2) * 0.8 });
  }
}

export const PLAYER_FRAME_W = FW;
export const PLAYER_FRAME_H = FH;
export const PLAYER_TOTAL_FRAMES = 16;
export const ENEMY_TOTAL_FRAMES = 10;
