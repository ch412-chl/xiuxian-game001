import { gameState } from '../gameState';
import { SHENGTONG } from '../data';

export class StPanel {
  constructor(main) {
    this.main = main;
    this.rows = [];
    this.selectedId = null;
    this.buttons = [];
    this.msg = null;
    this.msgTimer = 0;
    this.infoOpen = false;
    this.infoRect = null;
    this.listItems = [];
    this.slotItems = [];
    this.modalOpen = false;
    this.modalRect = null;
    this.modalStId = null;
    this.modalSlotIdx = null;
  }

  onTouch(x, y) {
    if (this.infoOpen) {
      if (!this.infoRect || x < this.infoRect.x1 || x > this.infoRect.x2 || y < this.infoRect.y1 || y > this.infoRect.y2) {
        this.infoOpen = false;
      }
      return;
    }

    if (this.modalOpen) {
      if (!this.modalRect || x < this.modalRect.x1 || x > this.modalRect.x2 || y < this.modalRect.y1 || y > this.modalRect.y2) {
        this.modalOpen = false;
      } else {
        const btn = this.buttons.find(b => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
        if (btn && btn.type === 'equip' && this.modalStId) {
          const res = gameState.equipStToSlot(this.modalStId, null);
          if (!res.ok) this.showMsg(res.msg);
          this.modalOpen = false;
        }
        if (btn && btn.type === 'remove' && this.modalSlotIdx !== null) {
          const res = gameState.removeStFromSlot(this.modalSlotIdx);
          if (!res.ok) this.showMsg(res.msg);
          this.modalOpen = false;
        }
      }
      return;
    }

    const listHit = this.listItems.find(r => x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2);
    if (listHit) {
      this.modalOpen = true;
      this.modalStId = listHit.id;
      this.modalSlotIdx = null;
      return;
    }

    const slotHit = this.slotItems.find(r => x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2);
    if (slotHit) {
      this.modalOpen = true;
      this.modalStId = slotHit.id;
      this.modalSlotIdx = slotHit.slotIdx;
      return;
    }
    const btn = this.buttons.find(b => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
    if (!btn) return;
    if (btn.type === 'upgrade' && this.modalStId) {
      const res = gameState.upgradeSt(this.modalStId);
      this.showMsg(res.msg);
      this.modalOpen = false;
    }
    if (btn.type === 'info') {
      this.infoOpen = true;
      return;
    }
  }

  render(ctx, W, H, headerH) {
    const s = gameState.state;
    const startY = headerH + 60;
    this.rows = [];
    this.buttons = [];
    this.listItems = [];
    this.slotItems = [];

    ctx.textAlign = 'center';
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 14px serif';
    ctx.fillText("—— 识海神通 ——", W / 2, startY);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 12px serif';
    ctx.fillText('！', W * 0.86, startY);
    this.buttons.push({ type: 'info', x1: W * 0.84, x2: W * 0.88, y1: startY - 10, y2: startY + 6 });

    const allIds = Object.keys(SHENGTONG);
    if (allIds.length === 0) {
      ctx.fillStyle = '#cdb88a';
      ctx.fillText("神识空空，尚未悟得法门", W / 2, H / 2);
      return;
    }

    // 竖排显示全部神通
    allIds.forEach((stId, i) => {
      const st = SHENGTONG[stId];
      const equipped = s.equippedSt.includes(stId);
      const stState = s.shengtong.find(t => t.id === stId) || { lv: 1, frag: 0 };
      const y = startY + 50 + i * 40;

      // 装饰性的小圆点
      ctx.fillStyle = equipped ? '#f3e2bb' : '#2a1a0a';
      ctx.beginPath();
      ctx.arc(W * 0.15, y - 4, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = equipped ? '#f3e2bb' : '#b59f75';
      ctx.font = 'bold 16px serif';
      ctx.fillText(st.name, W * 0.2, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = equipped ? '#e2cfa3' : '#8e7b5a';
      ctx.font = 'bold 11px serif';
      ctx.fillText(equipped ? '已装配' : '待装配', W * 0.85, y);
      ctx.fillStyle = '#d8c59b';
      ctx.fillText(`Lv.${stState.lv}  ${stState.frag}/${st.fragNeed[stState.lv] || '-'}`, W * 0.85, y + 14);
      this.listItems.push({ id: stId, x1: W * 0.12, x2: W * 0.88, y1: y - 20, y2: y + 18 });
    });

    // 详情不在外部展示，仅保留列表与提示

    if (this.msgTimer > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(243,226,187, ${this.msgTimer / 100})`;
      ctx.fillText(this.msg, W / 2, H - 120);
    }

    if (this.infoOpen) {
      this.renderInfoModal(ctx, W, H);
    }
    if (this.modalOpen && this.modalStId) {
      this.renderStModal(ctx, W, H, this.modalStId, this.modalSlotIdx);
    }
  }

  renderEmbedded(ctx, W, H, startY, maxH) {
    const s = gameState.state;
    const areaH = Math.max(200, maxH || 260);
    this.rows = [];
    this.buttons = [];
    this.listItems = [];
    this.slotItems = [];

    ctx.fillStyle = 'rgba(28,24,20,0.7)';
    ctx.fillRect(W * 0.06, startY, W * 0.88, areaH);
    ctx.strokeStyle = '#3a332d';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(W * 0.06, startY, W * 0.88, areaH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2cfa3';
    ctx.font = 'bold 13px serif';
    ctx.fillText("—— 识海神通 ——", W / 2, startY + 18);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 12px serif';
    ctx.fillText('！', W * 0.86, startY + 18);
    this.buttons.push({ type: 'info', x1: W * 0.84, x2: W * 0.88, y1: startY + 6, y2: startY + 22 });

    const allIds = Object.keys(SHENGTONG);
    if (allIds.length === 0) {
      ctx.fillStyle = '#cdb88a';
      ctx.fillText("神识空空，尚未悟得法门", W / 2, startY + areaH / 2);
      return;
    }

    const headerH = 26;
    const slotH = 44;
    const slotGap = 8;
    const slotRows = 2;
    const slotsAreaH = slotRows * slotH + slotGap;
    const listStartY = startY + headerH + slotsAreaH + 8;

    // 装配槽（固定6格）
    const areaX = W * 0.06;
    const areaW = W * 0.88;
    const slotW = (areaW - slotGap * 2) / 3;
    const slotStartY = startY + headerH + 4;
    const equipped = (s.equippedSt || []);
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = areaX + col * (slotW + slotGap);
      const y = slotStartY + row * (slotH + slotGap);
      ctx.fillStyle = 'rgba(32,28,24,0.6)';
      ctx.fillRect(x, y, slotW, slotH);
      ctx.strokeStyle = '#3a332d';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, slotW, slotH);
      const stId = equipped[i];
      if (stId) {
        const stState = s.shengtong.find(t => t.id === stId) || { lv: 1, frag: 0 };
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f3e2bb';
        ctx.font = 'bold 12px serif';
        ctx.fillText(SHENGTONG[stId]?.name || stId, x + slotW / 2, y + 22);
        ctx.fillStyle = '#d8c59b';
        ctx.font = 'bold 11px serif';
        ctx.fillText(`Lv.${stState.lv}`, x + slotW / 2, y + 36);
        this.slotItems.push({ id: stId, slotIdx: i, x1: x, x2: x + slotW, y1: y, y2: y + slotH });
      } else {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7c6d55';
        ctx.font = 'bold 11px serif';
        ctx.fillText('空位', x + slotW / 2, y + 26);
      }
    }

    // 待装配神通：格子排列（未装配可点）
    const unlockedIds = Object.keys(SHENGTONG);
    const gridCols = 4;
    const gridGap = 8;
    const gridW = areaW - 20;
    const cellW = (gridW - gridGap * (gridCols - 1)) / gridCols;
    const cellH = 52;
    let gridIdx = 0;
    const gridStartX = areaX + 10;
    const gridStartY = listStartY + 6;
    unlockedIds.forEach((stId) => {
      const st = SHENGTONG[stId];
      if (!st) return;
      const stState = s.shengtong.find(t => t.id === stId) || null;
      const unlocked = !!stState;
      const isEquipped = (equipped || []).includes(stId);
      const row = Math.floor(gridIdx / gridCols);
      const col = gridIdx % gridCols;
      const x = gridStartX + col * (cellW + gridGap);
      const y = gridStartY + row * (cellH + gridGap);
      ctx.fillStyle = !unlocked ? 'rgba(24,22,20,0.5)' : (isEquipped ? 'rgba(28,24,20,0.45)' : 'rgba(36,30,24,0.7)');
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = '#3a332d';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.textAlign = 'left';
      ctx.fillStyle = !unlocked ? '#6c5e49' : (isEquipped ? '#8e7b5a' : '#d8c59b');
      ctx.font = 'bold 12px serif';
      ctx.fillText(st.name, x + 6, y + 16);
      ctx.fillStyle = !unlocked ? '#6c5e49' : (isEquipped ? '#7c6d55' : '#bfae86');
      ctx.font = 'bold 11px serif';
      ctx.fillText(`Lv.${stState ? stState.lv : '-'}`, x + 6, y + 32);
      ctx.fillStyle = !unlocked ? '#6c5e49' : (isEquipped ? '#6c5e49' : '#9f8c66');
      ctx.fillText(unlocked ? `${stState.frag}/${st.fragNeed[stState.lv] || '-'}` : '未解锁', x + 6, y + 48);

      if (unlocked && !isEquipped) {
        this.listItems.push({ id: stId, x1: x, x2: x + cellW, y1: y, y2: y + cellH });
      }
      gridIdx += 1;
    });

    // 详情不在外部展示，仅保留列表与提示

    if (this.msgTimer > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(243,226,187, ${this.msgTimer / 100})`;
      ctx.fillText(this.msg, W / 2, startY + areaH - 18);
    }

    if (this.infoOpen) {
      this.renderInfoModal(ctx, W, H);
    }
    if (this.modalOpen && this.modalStId) {
      this.renderStModal(ctx, W, H, this.modalStId, this.modalSlotIdx);
    }
  }

  showMsg(msg) {
    this.msg = msg;
    this.msgTimer = 100;
  }

  update() {
    if (this.msgTimer > 0) this.msgTimer--;
  }

  renderInfoModal(ctx, W, H) {
    const boxW = Math.min(W - 60, 280);
    const boxH = 120;
    const x = (W - boxW) / 2;
    const y = H / 2 - boxH / 2;
    ctx.fillStyle = 'rgba(20,16,12,0.9)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = '#3a332d';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 13px serif';
    ctx.fillText('神通说明', W / 2, y + 24);

    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 12px serif';
    ctx.fillText('神通在战斗中按装配顺序循环释放。', W / 2, y + 54);
    ctx.fillText('你可随时调整装配顺序。', W / 2, y + 74);

    this.infoRect = { x1: x, y1: y, x2: x + boxW, y2: y + boxH };
  }

  renderStModal(ctx, W, H, stId, slotIdx) {
    const s = gameState.state;
    const st = SHENGTONG[stId];
    const stState = s.shengtong.find(t => t.id === stId) || { lv: 1, frag: 0 };
    const boxW = Math.min(W - 60, 300);
    const boxH = 200;
    const x = (W - boxW) / 2;
    const y = H / 2 - boxH / 2;
    this.modalRect = { x1: x, y1: y, x2: x + boxW, y2: y + boxH };

    ctx.fillStyle = 'rgba(20,16,12,0.9)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = '#3a332d';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 13px serif';
    ctx.fillText(st?.name || stId, W / 2, y + 24);

    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 12px serif';
    ctx.fillText(`等级：Lv.${stState.lv}`, W / 2, y + 50);
    ctx.fillText(`碎片：${stState.frag}/${st?.fragNeed?.[stState.lv] || '-'}`, W / 2, y + 70);
    if (st?.dmgPct || st?.dmgPct === 0) {
      const pct = Math.round(st.dmgPct * 100);
      ctx.fillText(`倍率：${pct}%`, W / 2, y + 90);
    }
    if (st?.desc) {
      ctx.font = 'bold 11px serif';
      ctx.fillStyle = '#cdb88a';
      const maxW = boxW - 32;
      const text = st.desc;
      const lines = [];
      let line = '';
      for (let i = 0; i < text.length; i++) {
        const next = line + text[i];
        if (ctx.measureText(next).width > maxW) {
          lines.push(line);
          line = text[i];
        } else {
          line = next;
        }
      }
      if (line) lines.push(line);
      lines.slice(0, 3).forEach((t, i) => {
        ctx.fillText(t, W / 2, y + 110 + i * 16);
      });
    }

    const hasEmpty = (s.equippedSt || []).some(x => !x);
    const isEquipped = (s.equippedSt || []).includes(stId);
    if (slotIdx !== null && slotIdx !== undefined) {
      ctx.fillStyle = '#f3e2bb';
      ctx.font = 'bold 12px serif';
      ctx.fillText('移除', W / 2, y + 178);
      this.buttons.push({ type: 'remove', x1: W / 2 - 30, x2: W / 2 + 30, y1: y + 164, y2: y + 186 });
    } else if (!isEquipped && hasEmpty) {
      ctx.fillStyle = '#f3e2bb';
      ctx.font = 'bold 12px serif';
      ctx.fillText('装配', W / 2, y + 178);
      this.buttons.push({ type: 'equip', x1: W / 2 - 30, x2: W / 2 + 30, y1: y + 164, y2: y + 186 });
    } else if (isEquipped) {
      ctx.fillStyle = '#bfae86';
      ctx.font = 'bold 12px serif';
      ctx.fillText('已装配', W / 2, y + 178);
    } else {
      ctx.fillStyle = '#bfae86';
      ctx.font = 'bold 12px serif';
      ctx.fillText('装配槽已满', W / 2, y + 178);
    }
  }
}
