import { gameState } from '../gameState';
import { ITEMS } from '../data';

export class RolePanel {
  constructor(main) {
    this.main = main;
    this.msg = null;
    this.msgTimer = 0;
    this.entryButtons = [];
    this.tribulationFx = 0;
  }

  render(ctx, W, H, headerH) {
    const s = gameState.state;
    const contentY = headerH + 30;
    this.entryButtons = [];

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 28px serif';
    ctx.fillText(s.name, W / 2, contentY + 50);
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 14px serif';
    ctx.fillText('「 仙道漫漫，唯道是从 」', W / 2, contentY + 85);

    ctx.strokeStyle = '#3a332d';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(W * 0.2, contentY + 130);
    ctx.lineTo(W * 0.8, contentY + 130);
    ctx.stroke();

    ctx.fillStyle = s.canBreak ? '#8b5bff' : '#f0d8a8';
    ctx.font = 'bold 22px serif';
    ctx.fillText(s.realmDisplayName || s.realmName, W / 2, contentY + 175);

    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 12px serif';
    ctx.fillText(`修为：${s.xp}/${s.xpNeed}（${s.xpPct}%）`, W / 2, contentY + 200);

    const barW = 210;
    const barH = 12;
    const barX = (W - barW) / 2;
    const barY = contentY + 236;
    const hpPct = Math.max(0, Math.min(1, s.hp / Math.max(1, s.maxHp)));
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 12px serif';
    ctx.fillText('气血', W / 2, barY - 10);
    ctx.fillStyle = 'rgba(26,22,18,0.85)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#e8cd87';
    ctx.fillRect(barX, barY, Math.max(2, barW * hpPct), barH);
    ctx.strokeStyle = '#8a7357';
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#1f1b16';
    ctx.font = 'bold 11px serif';
    ctx.fillText(`${s.hp}`, W / 2, barY + 10);

    const equipY = barY + 76;
    const equip = s.equip || {};
    const equipList = [
      { label: '兵器', id: equip.weapon },
      { label: '法衣', id: equip.robe },
      { label: '戒指', id: equip.ring },
    ];
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 12px serif';
    ctx.fillText('—— 装 备 ——', W / 2, equipY - 20);
    equipList.forEach((eq, i) => {
      const y = equipY + i * 22;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#d8c59b';
      ctx.fillText(eq.label, W * 0.28, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f3e2bb';
      ctx.fillText(eq.id ? (ITEMS[eq.id]?.name || eq.id) : '无', W * 0.72, y);
    });

    if (s.currentTitle) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e2cfa3';
      ctx.font = 'bold 12px serif';
      ctx.fillText(`称号：${s.currentTitle}`, W / 2, equipY + 80);
    }

    const entryY = equipY + 118;
    this.drawEntry(ctx, W / 2 - 40, entryY, 80, 24, '纳戒', 'bag');

    const cooldown = s.breakCooldownUntil && Date.now() < s.breakCooldownUntil;
    if (s.canBreak || cooldown) {
      ctx.textAlign = 'center';
      ctx.fillStyle = cooldown ? '#b59f75' : '#8b5bff';
      ctx.font = 'bold 20px serif';
      ctx.fillText(cooldown ? '「 冷 却 中 」' : '「 破 境 」', W / 2, H - 180);
      ctx.fillStyle = '#d0bd94';
      ctx.font = 'bold 12px serif';
      ctx.fillText(cooldown ? '—— 可看广告清除冷却 ——' : '—— 修为已满，可窥后境 ——', W / 2, H - 150);
    }

    if (this.msgTimer > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(212,184,138,${this.msgTimer / 100})`;
      ctx.fillText(this.msg, W / 2, H / 2);
    }
    if (this.tribulationFx > 0) this.renderTribulationFx(ctx, W, H, contentY);
  }

  onTouch(x, y) {
    const { H } = this.main;
    const s = gameState.state;
    const entryHit = this.entryButtons.find((b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
    if (entryHit) {
      this.main.activeTab = entryHit.tab;
      return;
    }
    if ((s.canBreak || (s.breakCooldownUntil && Date.now() < s.breakCooldownUntil)) && y > H - 220 && y < H - 140) {
      if (s.breakCooldownUntil && Date.now() < s.breakCooldownUntil) {
        gameState.skipBreakCooldownWithAd((ok, msg) => this.showMsg(msg));
      } else {
        const result = gameState.breakThrough();
        this.showMsg(result.msg);
        if (result.ok) this.tribulationFx = 70;
      }
    }
  }

  showMsg(msg) {
    this.msg = msg;
    this.msgTimer = 100;
  }

  update() {
    if (this.msgTimer > 0) this.msgTimer--;
    if (this.tribulationFx > 0) this.tribulationFx--;
  }

  drawEntry(ctx, x, y, w, h, label, tab) {
    ctx.fillStyle = 'rgba(76,64,50,0.85)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#b79b67';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 12px serif';
    ctx.fillText(label, x + w / 2, y + 16);
    this.entryButtons.push({ tab, x1: x, x2: x + w, y1: y, y2: y + h });
  }

  renderTribulationFx(ctx, W, H, contentY) {
    const t = this.tribulationFx;
    const alpha = Math.min(0.45, t / 120);
    ctx.fillStyle = `rgba(30,20,10,${alpha})`;
    ctx.fillRect(0, 0, W, H);
    const bolts = 3 + (t % 3);
    for (let i = 0; i < bolts; i++) {
      let px = W * (0.2 + Math.random() * 0.6);
      let py = contentY + 90;
      ctx.beginPath();
      ctx.moveTo(px, py);
      for (let s = 0; s < 6; s++) {
        px += (Math.random() - 0.5) * 24;
        py += 20 + Math.random() * 22;
        ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(191,162,255,${Math.min(0.7, t / 80)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
}
