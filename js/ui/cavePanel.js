import { gameState } from '../gameState';

export class CavePanel {
  constructor(main) {
    this.main = main;
    this.buttons = [];
    this.msg = null;
    this.msgTimer = 0;
    this.goalOpen = false;
    this.goalRect = null;
  }

  onTouch(x, y) {
    if (this.goalOpen) {
      if (!this.goalRect || x < this.goalRect.x1 || x > this.goalRect.x2 || y < this.goalRect.y1 || y > this.goalRect.y2) {
        this.goalOpen = false;
      }
      return;
    }
    const hit = this.buttons.find((b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
    if (!hit) return;
    if (hit.type === 'achieve') {
      this.main.activeTab = 'achieve';
      return;
    }
    if (hit.type === 'monster') {
      this.main.activeTab = 'monster';
      return;
    }
    if (hit.type === 'goal') {
      this.goalOpen = true;
    }
  }

  render(ctx, W, H, headerH) {
    this.buttons = [];
    const startY = headerH + 48;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 18px serif';
    ctx.fillText('洞府', W / 2, startY);

    ctx.fillStyle = '#bca680';
    ctx.font = 'bold 12px serif';
    ctx.fillText('当前仅开放功能中枢入口', W / 2, startY + 24);

    const cardW = W - 52;
    const cardH = 58;
    const x = 26;
    const listTop = startY + 62;
    this.drawEntry(ctx, x, listTop, cardW, cardH, '成就', '查看历练、击杀、境界与资源成就进度', 'achieve');
    this.drawEntry(ctx, x, listTop + 76, cardW, cardH, '图鉴', '查看已遭遇妖物档案与图鉴收集进度', 'monster');
    const goal = gameState.getStageGoals();
    this.drawEntry(ctx, x, listTop + 152, cardW, cardH, '阶段目标', '查看当前境界推进、副本与突破条件', 'goal');

    ctx.strokeStyle = '#3a332d';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(22, listTop - 18, W - 44, 248);

    ctx.fillStyle = '#bca680';
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'center';
    ctx.fillText('洞府不再提供挂机、灵矿、药园、丹房或产出领取。', W / 2, H - 92);

    if (this.msgTimer > 0) {
      ctx.fillStyle = `rgba(212,184,138,${this.msgTimer / 100})`;
      ctx.font = 'bold 12px serif';
      ctx.fillText(this.msg, W / 2, H - 124);
    }

    if (this.goalOpen) {
      this.renderGoalModal(ctx, W, H, goal);
    }
  }

  drawEntry(ctx, x, y, w, h, title, desc, type) {
    ctx.fillStyle = 'rgba(50,42,34,0.8)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#b79b67';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 14px serif';
    ctx.fillText(title, x + 14, y + 22);
    ctx.fillStyle = '#c8af86';
    ctx.font = 'bold 11px serif';
    ctx.fillText(desc, x + 14, y + 42);
    this.buttons.push({ type, x1: x, x2: x + w, y1: y, y2: y + h });
  }

  showMsg(msg) {
    this.msg = msg;
    this.msgTimer = 100;
  }

  update() {
    if (this.msgTimer > 0) this.msgTimer--;
  }

  renderGoalModal(ctx, W, H, goal) {
    const boxW = Math.min(W - 40, 304);
    const boxH = Math.min(H - 120, 352);
    const x = (W - boxW) / 2;
    const y = H / 2 - boxH / 2;
    this.goalRect = { x1: x, x2: x + boxW, y1: y, y2: y + boxH };

    ctx.fillStyle = 'rgba(18,16,13,0.96)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = '#b79b67';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 14px serif';
    ctx.fillText(goal.title, W / 2, y + 26);
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 11px serif';
    this.wrapText(ctx, goal.focus, W / 2, y + 48, boxW - 36, 16);

    let cardY = y + 82;
    goal.cards.forEach((card) => {
      ctx.fillStyle = 'rgba(50,42,34,0.9)';
      ctx.fillRect(x + 14, cardY, boxW - 28, 74);
      ctx.strokeStyle = '#6f5e42';
      ctx.strokeRect(x + 14, cardY, boxW - 28, 74);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f3e2bb';
      ctx.font = 'bold 12px serif';
      ctx.fillText(card.title, x + 26, cardY + 18);
      ctx.fillStyle = '#c8af86';
      ctx.font = 'bold 11px serif';
      card.lines.forEach((line, idx) => {
        ctx.fillText(line, x + 26, cardY + 40 + idx * 18);
      });
      cardY += 86;
    });
  }

  wrapText(ctx, text, centerX, startY, maxW, lineH) {
    let line = '';
    let y = startY;
    for (const ch of text) {
      const next = line + ch;
      if (ctx.measureText(next).width > maxW && line) {
        ctx.fillText(line, centerX, y);
        line = ch;
        y += lineH;
      } else {
        line = next;
      }
    }
    if (line) ctx.fillText(line, centerX, y);
  }
}
