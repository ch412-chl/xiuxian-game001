import { gameState } from '../gameState';
import { SHENGTONG, REALM_GROUPS } from '../data';

export class StPanel {
  constructor(main) {
    this.main = main;
    this.buttons = [];
    this.listItems = [];
    this.slotItems = [];
    this.modalOpen = false;
    this.modalRect = null;
    this.modalStId = null;
    this.modalSlotIdx = null;
    this.selectedSlotIdx = 0;
    this.msg = null;
    this.msgTimer = 0;
  }

  onTouch(x, y) {
    if (this.modalOpen) {
      if (!this.modalRect || x < this.modalRect.x1 || x > this.modalRect.x2 || y < this.modalRect.y1 || y > this.modalRect.y2) {
        this.modalOpen = false;
        return;
      }
      const btn = this.buttons.find((b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
      if (btn?.type === 'remove' && this.modalSlotIdx !== null) {
        const res = gameState.removeStFromSlot(this.modalSlotIdx);
        if (!res.ok) this.showMsg(res.msg);
        this.modalOpen = false;
      }
      return;
    }

    const slotHit = this.slotItems.find((r) => x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2);
    if (slotHit) {
      if (this.selectedSlotIdx === slotHit.slotIdx && slotHit.id) {
        this.modalOpen = true;
        this.modalStId = slotHit.id;
        this.modalSlotIdx = slotHit.slotIdx;
        return;
      }
      this.selectedSlotIdx = slotHit.slotIdx;
      this.showMsg(`已选中第 ${slotHit.slotIdx + 1} 位，点击下方神通直接替换`);
      return;
    }
    const listHit = this.listItems.find((r) => x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2);
    if (listHit) {
      const currentIdx = gameState.state.equippedSt.findIndex((id) => id === listHit.id);
      if (listHit.unlocked && currentIdx !== this.selectedSlotIdx) {
        const slotIdx = Math.max(0, Math.min(2, this.selectedSlotIdx ?? 0));
        const res = gameState.equipStToSlot(listHit.id, slotIdx);
        if (res.ok) {
          this.showMsg(`已装配到第 ${slotIdx + 1} 位`);
        } else {
          this.showMsg(res.msg);
        }
        return;
      }
      this.modalOpen = true;
      this.modalStId = listHit.id;
      this.modalSlotIdx = gameState.state.equippedSt.findIndex((id) => id === listHit.id);
    }
  }

  renderEmbedded(ctx, W, H, startY, maxH, realmGroup = null) {
    const s = gameState.state;
    this.buttons = [];
    this.listItems = [];
    this.slotItems = [];

    const areaH = Math.max(184, Math.min(222, maxH || 220));
    const areaX = W * 0.06;
    const areaW = W * 0.88;
    ctx.strokeStyle = '#9c8764';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(areaX, startY, areaW, areaH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2cfa3';
    ctx.font = 'bold 13px serif';
    const realmName = REALM_GROUPS[realmGroup] || '神通';
    ctx.fillText(`—— ${realmName}神通 ——`, W / 2, startY + 18);
    ctx.fillStyle = '#bca680';
    ctx.font = 'bold 10px serif';
    ctx.fillText(`1~3 槽为出手顺序 · 当前选择第 ${Math.max(1, (this.selectedSlotIdx ?? 0) + 1)} 位`, W / 2, startY + 34);

    const slotY = startY + 48;
    const slotGap = 8;
    const slotW = (areaW - slotGap * 2) / 3;
    const slotH = 44;
    (s.equippedSt || []).slice(0, 3).forEach((stId, i) => {
      const x = areaX + i * (slotW + slotGap);
      const y = slotY;
      const selected = i === this.selectedSlotIdx;
      ctx.fillStyle = selected ? 'rgba(83,67,46,0.45)' : 'rgba(0,0,0,0)';
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeStyle = selected ? '#e4c891' : '#8e7a5b';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, slotW, slotH);
      ctx.textAlign = 'center';
      ctx.fillStyle = selected ? '#f3e2bb' : '#d8c59b';
      ctx.font = 'bold 10px serif';
      ctx.fillText(`${i + 1}`, x + slotW / 2, y + 12);
      if (stId) {
        const stState = s.shengtong.find((t) => t.id === stId) || { lv: 1, totalUses: 0 };
        ctx.fillStyle = '#f3e2bb';
        ctx.font = 'bold 11px serif';
        ctx.fillText(SHENGTONG[stId]?.name || stId, x + slotW / 2, y + 28);
        ctx.fillStyle = '#c8af86';
        ctx.font = 'bold 10px serif';
        ctx.fillText(gameState.getStTierName(stState.lv), x + slotW / 2, y + 40);
      } else {
        ctx.fillStyle = '#7c6d55';
        ctx.font = 'bold 11px serif';
        ctx.fillText('空位', x + slotW / 2, y + 29);
      }
      this.slotItems.push({ id: stId, slotIdx: i, x1: x, x2: x + slotW, y1: y, y2: y + slotH });
    });

    const focusIds = Object.keys(SHENGTONG)
      .filter((id) => {
        const g = SHENGTONG[id].realmGroup;
        return g >= Math.max(0, realmGroup - 1) && g <= Math.min(REALM_GROUPS.length - 1, realmGroup + 1);
      })
      .sort((a, b) => SHENGTONG[a].realmGroup - SHENGTONG[b].realmGroup);

    const listTop = slotY + slotH + 18;
    const cardGap = 8;
    const cardW = (areaW - cardGap * 2 - 20) / 3;
    const cardH = 72;
    focusIds.slice(0, 3).forEach((stId, idx) => {
      const x = areaX + 10 + idx * (cardW + cardGap);
      const y = listTop;
      const w = cardW;
      const st = SHENGTONG[stId];
      const unlocked = !!s.shengtong.find((item) => item.id === stId);
      const stState = s.shengtong.find((item) => item.id === stId) || { lv: 1, totalUses: 0 };
      const progress = gameState.getStUseProgress(stState);
      const equipped = gameState.state.equippedSt.includes(stId);
      ctx.fillStyle = equipped ? 'rgba(83,67,46,0.35)' : 'rgba(0,0,0,0)';
      ctx.fillRect(x, y, w, cardH);
      ctx.strokeStyle = equipped ? '#e4c891' : '#8e7a5b';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, w, cardH);
      ctx.textAlign = 'center';
      ctx.fillStyle = unlocked ? '#f0ddb1' : '#9b8667';
      ctx.font = 'bold 11px serif';
      ctx.fillText(REALM_GROUPS[st.realmGroup], x + w / 2, y + 18);
      ctx.fillStyle = unlocked ? '#f3e2bb' : '#a79270';
      ctx.font = 'bold 12px serif';
      ctx.fillText(st.name, x + w / 2, y + 38);
      ctx.fillStyle = '#c8af86';
      ctx.font = 'bold 10px serif';
      const foot = unlocked
        ? `${gameState.getStTierName(stState.lv)}${equipped ? ' · 已装配' : progress.done ? ' · 已满' : ` · ${progress.cur}/${progress.need}`}`
        : '入门 · 可查看';
      ctx.fillText(foot, x + w / 2, y + 58);
      this.listItems.push({ id: stId, unlocked, equipped, x1: x, x2: x + w, y1: y, y2: y + cardH });
    });

    if (this.msgTimer > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(243,226,187,${this.msgTimer / 100})`;
      ctx.font = 'bold 11px serif';
      ctx.fillText(this.msg, W / 2, startY + areaH - 10);
    }
    if (this.modalOpen && this.modalStId) this.renderStModal(ctx, W, H, this.modalStId, this.modalSlotIdx);
  }

  renderStModal(ctx, W, H, stId, slotIdx) {
    const st = SHENGTONG[stId];
    const stState = gameState.state.shengtong.find((t) => t.id === stId) || { lv: 1, totalUses: 0 };
    const boxW = Math.min(W - 70, 220);
    const boxH = 146;
    const x = (W - boxW) / 2;
    const y = H / 2 - boxH / 2;
    this.modalRect = { x1: x, x2: x + boxW, y1: y, y2: y + boxH };

    ctx.fillStyle = 'rgba(82,70,56,0.96)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = '#b79b67';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 13px serif';
    ctx.fillText(`${REALM_GROUPS[st.realmGroup]}·${st.name}`, W / 2, y + 24);
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 12px serif';
    ctx.fillText(`等级：${gameState.getStTierName(stState.lv)}`, W / 2, y + 48);
    ctx.fillText(`伤害：${Math.floor(100 * st.dmgPct * gameState.getStPowerMul(stState.lv))}`, W / 2, y + 68);
    if (st.skillType === 'heal_hit' && st.healPct) ctx.fillText(`特殊：回复气血`, W / 2, y + 88);

    const equippedCount = gameState.state.equippedSt.filter(Boolean).length;
    const equipped = gameState.state.equippedSt.includes(stId);
    const btnY = y + 116;
    if (equipped) {
      this.drawModalBtn(ctx, W / 2, btnY, 88, 22, equippedCount <= 1 ? '不可移除' : '移除', equippedCount <= 1 ? null : 'remove');
      this.modalSlotIdx = slotIdx ?? gameState.state.equippedSt.findIndex((id) => id === stId);
    } else {
      ctx.fillStyle = '#8e7b5a';
      ctx.font = 'bold 11px serif';
      ctx.fillText('点外层槽位后，直接点神通替换', W / 2, btnY + 4);
    }
  }

  drawModalBtn(ctx, cx, cy, w, h, label, type) {
    const x = cx - w / 2;
    const y = cy - h / 2;
    ctx.strokeStyle = type ? '#b79b67' : '#6e604a';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = type ? '#f3e2bb' : '#8e7b5a';
    ctx.font = 'bold 11px serif';
    ctx.fillText(label, cx, cy + 4);
    if (type) this.buttons.push({ type, x1: x, x2: x + w, y1: y, y2: y + h });
  }

  showMsg(msg) {
    this.msg = msg;
    this.msgTimer = 100;
  }

  update() {
    if (this.msgTimer > 0) this.msgTimer--;
  }
}
