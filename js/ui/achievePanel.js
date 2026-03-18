import { gameState } from '../gameState';

export class AchievePanel {
  constructor(main) {
    this.main = main;
    this.buttons = [];
    this.scrollY = 0;
    this.maxScroll = 0;
    this.listRect = null;
    this.msg = null;
    this.msgTimer = 0;
    this.modalOpen = false;
    this.modalRect = null;
    this.modalAch = null;
  }

  onTouch(x, y) {
    if (this.modalOpen) {
      if (!this.modalRect || x < this.modalRect.x1 || x > this.modalRect.x2 || y < this.modalRect.y1 || y > this.modalRect.y2) {
        this.modalOpen = false;
        return;
      }
      const hitModal = this.buttons.find(b => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
      if (hitModal && hitModal.type === 'claim' && this.modalAch) {
        const res = gameState.claimAchievement(this.modalAch.id);
        this.showMsg(res.msg);
      }
      this.modalOpen = false;
      return;
    }
    const hit = this.buttons.find(b => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
    if (hit) {
      if (hit.type === 'back') {
        this.main.activeTab = 'cave';
        return;
      }
      if (hit.type === 'open') {
        this.modalAch = hit.ach;
        this.modalOpen = true;
        return;
      }
    }

    if (this.listRect && x >= this.listRect.x1 && x <= this.listRect.x2 && y >= this.listRect.y1 && y <= this.listRect.y2) {
      const step = this.listRect.rowStep || 66;
      const mid = (this.listRect.y1 + this.listRect.y2) * 0.5;
      if (y > mid) this.scrollY = Math.min(this.maxScroll, this.scrollY + step);
      else this.scrollY = Math.max(0, this.scrollY - step);
    }
  }

  render(ctx, W, H, headerH) {
    const s = gameState.state;
    this.buttons = [];
    const startY = headerH + 42;
    const rows = this.buildAchievements(s);

    this.drawBack(ctx, 26, startY - 12, 52, 22);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 14px serif';
    ctx.fillText('成就', 88, startY + 4);

    const bx = W * 0.08;
    const bw = W * 0.84;
    const top = startY + 20;
    const bottom = H - 56;
    const rowH = 66;
    const totalH = rows.length * rowH;
    const viewportH = Math.max(120, bottom - top);
    this.maxScroll = Math.max(0, totalH - viewportH);
    if (this.scrollY > this.maxScroll) this.scrollY = this.maxScroll;
    this.listRect = { x1: bx, x2: bx + bw, y1: top, y2: bottom, rowStep: rowH };

    ctx.fillStyle = 'rgba(66,56,44,0.36)';
    ctx.fillRect(bx, top, bw, viewportH);
    ctx.strokeStyle = '#8e7a5b';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, top, bw, viewportH);

    rows.forEach((a, i) => {
      const y = top + i * rowH - this.scrollY;
      if (y + rowH < top || y > bottom) return;
      const pct = Math.max(0, Math.min(1, a.cur / a.need));
      const done = a.cur >= a.need;
      const claimed = !!a.claimed;
      const barX = bx + 10;
      const barY = y + 40;
      const barW = bw - 20;

      ctx.fillStyle = done ? 'rgba(84,70,52,0.75)' : 'rgba(54,46,38,0.7)';
      ctx.fillRect(bx + 2, y + 2, bw - 4, rowH - 6);
      ctx.strokeStyle = '#8e7a5b';
      ctx.strokeRect(bx + 2, y + 2, bw - 4, rowH - 6);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#f0ddb1';
      ctx.font = 'bold 12px serif';
      ctx.fillText(`【${a.group}】${a.name}`, bx + 10, y + 18);

      ctx.textAlign = 'right';
      ctx.fillStyle = done ? '#f4dfb0' : '#c8af86';
      ctx.font = 'bold 11px serif';
      ctx.fillText(done ? '已达成' : `${a.cur}/${a.need}`, bx + bw - 10, y + 18);

      ctx.fillStyle = 'rgba(26,22,18,0.85)';
      ctx.fillRect(barX, barY, barW, 8);
      ctx.fillStyle = done ? '#e8cd87' : '#b59f75';
      ctx.fillRect(barX, barY, Math.max(2, barW * pct), 8);
      ctx.strokeStyle = '#8a7357';
      ctx.strokeRect(barX, barY, barW, 8);

      ctx.textAlign = 'right';
      ctx.font = 'bold 10px serif';
      ctx.fillStyle = claimed ? '#9f8c66' : '#bca680';
      ctx.fillText(claimed ? '奖励已领' : '点击查看奖励', bx + bw - 10, y + 56);
      this.buttons.push({ type: 'open', ach: a, x1: bx + 2, x2: bx + bw - 2, y1: y + 2, y2: y + rowH - 4 });
    });

    const doneCount = rows.filter(r => r.cur >= r.need).length;
    const claimedCount = rows.filter(r => r.claimed).length;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 11px serif';
    ctx.fillText(`达成 ${doneCount}/${rows.length} ｜ 已领 ${claimedCount}`, W * 0.9, H - 26);

    if (this.msgTimer > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(243,226,187,${this.msgTimer / 100})`;
      ctx.font = 'bold 12px serif';
      ctx.fillText(this.msg, W / 2, H - 112);
    }

    if (this.modalOpen && this.modalAch) {
      this.renderAchModal(ctx, W, H, this.modalAch);
    }
  }

  buildAchievements(s) {
    const defs = gameState.getAchievementDefs();
    const claimed = s.achieveClaimed || {};
    return defs.map(d => ({ ...d, claimed: !!claimed[d.id] }));
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

  renderAchModal(ctx, W, H, a) {
    const boxW = Math.min(W - 60, 280);
    const boxH = 146;
    const x = (W - boxW) / 2;
    const y = H / 2 - boxH / 2;
    this.modalRect = { x1: x, x2: x + boxW, y1: y, y2: y + boxH };

    const done = a.cur >= a.need;
    const claimed = !!a.claimed;
    const canClaim = done && !claimed;
    ctx.fillStyle = 'rgba(82,70,56,0.96)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = '#b79b67';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 13px serif';
    ctx.fillText(`【${a.group}】${a.name}`, W / 2, y + 24);
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 12px serif';
    ctx.fillText(`进度：${a.cur}/${a.need}`, W / 2, y + 50);
    ctx.fillText(`奖励：灵石 +${a.rewardStone}`, W / 2, y + 72);
    ctx.fillStyle = canClaim ? '#f3e2bb' : '#bfae86';
    ctx.fillText(canClaim ? '点击领取奖励' : (claimed ? '奖励已领取' : '未达成，暂不可领取'), W / 2, y + 106);
    if (canClaim) {
      this.buttons.push({ type: 'claim', x1: W / 2 - 60, x2: W / 2 + 60, y1: y + 92, y2: y + 114 });
    }
  }

  showMsg(msg) {
    this.msg = msg;
    this.msgTimer = 100;
  }

  update() {
    if (this.msgTimer > 0) this.msgTimer--;
  }
}
