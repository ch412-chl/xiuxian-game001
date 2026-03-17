import { gameState } from '../gameState';
import { drawMonsterIllustration } from './monsterArt';

export class MonsterPanel {
  constructor(main) {
    this.main = main;
    this.buttons = [];
    this.scrollY = 0;
    this.maxScroll = 0;
    this.listRect = null;
    this.detailOpen = false;
    this.detailRect = null;
    this.detailMonster = null;
  }

  onTouch(x, y) {
    if (this.detailOpen) {
      if (!this.detailRect || x < this.detailRect.x1 || x > this.detailRect.x2 || y < this.detailRect.y1 || y > this.detailRect.y2) {
        this.detailOpen = false;
        return;
      }
      return;
    }
    const hit = this.buttons.find((b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
    if (hit) {
      if (hit.type === 'back') {
        this.main.activeTab = 'role';
        return;
      }
      if (hit.type === 'open') {
        this.detailMonster = hit.monster;
        this.detailOpen = true;
        return;
      }
    }
    if (this.listRect && x >= this.listRect.x1 && x <= this.listRect.x2 && y >= this.listRect.y1 && y <= this.listRect.y2) {
      const step = this.listRect.rowStep || 70;
      const mid = (this.listRect.y1 + this.listRect.y2) * 0.5;
      if (y > mid) this.scrollY = Math.min(this.maxScroll, this.scrollY + step);
      else this.scrollY = Math.max(0, this.scrollY - step);
    }
  }

  render(ctx, W, H, headerH) {
    this.buttons = [];
    const startY = headerH + 42;
    const rows = gameState.getMonsterCodexRows();
    const unlockedCount = rows.filter((r) => r.unlocked).length;

    this.drawBack(ctx, 26, startY - 12, 52, 22);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 14px serif';
    ctx.fillText('妖物图鉴', 88, startY + 4);
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px serif';
    ctx.fillStyle = '#bfa57a';
    ctx.fillText(`${unlockedCount}/${rows.length}`, W - 28, startY + 2);

    const x = W * 0.08;
    const w = W * 0.84;
    const top = startY + 26;
    const bottom = H - 34;
    const rowH = 74;
    const totalH = rows.length * rowH;
    const viewportH = Math.max(160, bottom - top);
    this.maxScroll = Math.max(0, totalH - viewportH);
    if (this.scrollY > this.maxScroll) this.scrollY = this.maxScroll;
    this.listRect = { x1: x, x2: x + w, y1: top, y2: bottom, rowStep: rowH };

    rows.forEach((row, idx) => {
      const ry = top + idx * rowH - this.scrollY;
      if (ry + rowH < top || ry > bottom) return;
      ctx.fillStyle = row.unlocked ? 'rgba(50,42,34,0.82)' : 'rgba(28,24,20,0.62)';
      ctx.fillRect(x, ry, w, rowH - 8);
      ctx.strokeStyle = row.unlocked ? '#b89c69' : '#5e5140';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x, ry, w, rowH - 8);

      drawMonsterIllustration(ctx, { x: x + 10, y: ry + 8, w: 56, h: 50 }, row.unlocked ? row : { artType: 'void_eye', aura: '灰金' }, { alpha: row.unlocked ? 1 : 0.35 });

      ctx.textAlign = 'left';
      ctx.fillStyle = row.unlocked ? '#f3e2bb' : '#8f7b5c';
      ctx.font = 'bold 12px serif';
      ctx.fillText(row.unlocked ? row.name : '未识别妖物', x + 76, ry + 24);
      ctx.fillStyle = row.unlocked ? '#d8c59b' : '#746450';
      ctx.font = 'bold 10px serif';
      ctx.fillText(row.unlocked ? row.title : '尚未遭遇', x + 76, ry + 42);
      ctx.fillText(row.unlocked ? `${row.chapter} · ${row.isBoss ? '首领' : '妖物'}` : '？？？', x + 76, ry + 58);

      if (row.unlocked) {
        this.buttons.push({ type: 'open', monster: row, x1: x, x2: x + w, y1: ry, y2: ry + rowH - 8 });
      }
    });

    if (this.detailOpen && this.detailMonster) {
      this.renderDetail(ctx, W, H, this.detailMonster);
    }
  }

  renderDetail(ctx, W, H, monster) {
    const boxW = Math.min(W - 44, 302);
    const boxH = Math.min(H - 120, 390);
    const x = (W - boxW) / 2;
    const y = H / 2 - boxH / 2;
    this.detailRect = { x1: x, x2: x + boxW, y1: y, y2: y + boxH };

    ctx.fillStyle = 'rgba(18,16,13,0.97)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = '#b89c69';
    ctx.lineWidth = 0.9;
    ctx.strokeRect(x, y, boxW, boxH);

    drawMonsterIllustration(ctx, { x: x + 18, y: y + 18, w: boxW - 36, h: 156 }, monster, { alpha: 1 });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 15px serif';
    ctx.fillText(monster.name, W / 2, y + 196);
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 11px serif';
    ctx.fillText(`${monster.chapter} · ${monster.isBoss ? '首领' : '妖物'} · ${monster.habitat}`, W / 2, y + 216);

    const lines = [
      monster.title,
      `气息：${monster.aura}`,
      `出没：${monster.habitat}`,
      monster.lore,
    ];
    let ty = y + 246;
    lines.forEach((line, idx) => {
      const wrapped = wrapText(ctx, line, boxW - 32);
      ctx.fillStyle = idx === 3 ? '#c7b08a' : '#e2cfa3';
      ctx.font = idx === 3 ? 'bold 11px serif' : 'bold 12px serif';
      wrapped.forEach((seg) => {
        ctx.fillText(seg, W / 2, ty);
        ty += 18;
      });
      ty += 4;
    });
  }

  drawBack(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(76,64,50,0.85)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#b79b67';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 11px serif';
    ctx.fillText('←', x + w / 2, y + 15);
    this.buttons.push({ type: 'back', x1: x, x2: x + w, y1: y, y2: y + h });
  }
}

function wrapText(ctx, text, maxW) {
  const arr = [];
  let line = '';
  for (const ch of text) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxW && line) {
      arr.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) arr.push(line);
  return arr;
}
