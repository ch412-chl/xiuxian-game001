import { gameState } from '../gameState';
import { ITEMS } from '../data';

export class RolePanel {
  constructor(main) {
    this.main = main;
    this.msg = null;
    this.msgTimer = 0;
    this.statButtons = [];
    this.infoOpen = false;
    this.infoRect = null;
    this.infoText = '';
    this.entryButtons = [];
    this.tribulationFx = 0;
  }

  // 接收 Main.js 传来的 headerH，确保文字位置正确
  render(ctx, W, H, headerH) {
    const s = gameState.state;
    // 这里的 contentY 决定了文字起始高度，避开顶部胶囊
    const contentY = headerH + 30; 
    this.statButtons = [];
    this.entryButtons = [];

    // --- 1. 彻底清除背景 ---
    // 只要 Main.js 里画了黑底，这里就不需要再画任何背景色块

    // --- 2. 角色名与头衔 ---
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 28px serif';
    ctx.fillText(s.name, W / 2, contentY + 50);
    
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 14px serif';
    ctx.fillText("「 仙道漫漫，唯道是从 」", W / 2, contentY + 85);

    // --- 3. 境界文字 (取代原本的发光进度条) ---
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
    const stageTimeText = s.stageMinutes === Infinity ? '已抵万道尽头' : `本小境界约${s.stageMinutes}分钟`;
    ctx.fillText(`修为：${s.realmLayerName}${Math.floor(s.xpPct)}%  ·  ${stageTimeText}`, W / 2, contentY + 200);

    // --- 4. 命籍属性 (取代原本的蓝色方块) ---
    const stats = [
      { key: 'hp', l: '气 · 血', v: `${s.maxHp}`, desc: '角色生命值，归零则战斗失败。' },
      { key: 'shaqi', l: '煞 · 气', v: `${s.shaqi}`, desc: '每10点煞气增加1%暴击率，但受到伤害增加0.1%，死亡损失10点煞气。' }
    ];

    const statsY = contentY + 260;
    stats.forEach((st, i) => {
      const y = statsY + i * 40;
      const centerX = W * 0.35;
      const textW = ctx.measureText(st.l).width;
      const labelW = Math.max(70, textW + 20);
      const labelH = 18;
      const labelX = centerX - labelW / 2;

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(42,36,30,0.7)';
      ctx.fillRect(labelX, y - 12, labelW, labelH);
      ctx.strokeStyle = '#3a332d';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(labelX, y - 12, labelW, labelH);
      ctx.fillStyle = '#d8c59b';
      ctx.fillText(st.l, centerX, y + 2);
      this.statButtons.push({ key: st.key, text: st.desc, x1: labelX, x2: labelX + labelW, y1: y - 12, y2: y - 12 + labelH });
      
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f3e2bb';
      ctx.fillText(st.v, W * 0.65, y);
    });

    // --- 5. 装备栏 ---
    const equipY = statsY + 230;
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
      const name = eq.id ? (ITEMS[eq.id]?.name || eq.id) : '无';
      ctx.fillText(name, W * 0.72, y);
    });

    // 称号
    if (s.currentTitle) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e2cfa3';
      ctx.font = 'bold 12px serif';
      ctx.fillText(`称号：${s.currentTitle}`, W / 2, equipY + 80);
    }

    // 入口迁移：纳戒 / 成就
    const entryY = equipY + 110;
    const btnW = 78;
    const btnH = 24;
    this.drawEntry(ctx, W * 0.22 - btnW / 2, entryY, btnW, btnH, '纳戒', 'bag');
    this.drawEntry(ctx, W * 0.5 - btnW / 2, entryY, btnW, btnH, '成就', 'achieve');
    this.drawEntry(ctx, W * 0.78 - btnW / 2, entryY, btnW, btnH, '图鉴', 'monster');

    // --- 6. 交互文字 (取代原本的深蓝色按钮) ---
    const cooldown = s.breakCooldownUntil && Date.now() < s.breakCooldownUntil;
    if (s.canBreak) {
      ctx.textAlign = 'center';
      ctx.fillStyle = cooldown ? '#b59f75' : '#8b5bff';
      ctx.font = 'bold 20px serif';
      ctx.fillText(cooldown ? '「 冷 却 中 」' : "「 破 境 」", W / 2, H - 180);
      
      ctx.fillStyle = '#d0bd94';
      ctx.font = 'bold 12px serif';
      ctx.fillText(cooldown ? "—— 可看广告清除冷却 ——" : "—— 灵气已盈，可窥后境 ——", W / 2, H - 150);
    }

    // 消息提示
    if (this.msgTimer > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(212, 184, 138, ${this.msgTimer / 100})`;
      ctx.fillText(this.msg, W / 2, H / 2);
    }

    if (this.infoOpen) {
      this.renderInfoModal(ctx, W, H);
    }
    if (this.tribulationFx > 0) {
      this.renderTribulationFx(ctx, W, H, contentY);
    }
  }

  onTouch(x, y) {
    const { W, H } = this.main;
    const s = gameState.state;
    if (this.infoOpen) {
      if (!this.infoRect || x < this.infoRect.x1 || x > this.infoRect.x2 || y < this.infoRect.y1 || y > this.infoRect.y2) {
        this.infoOpen = false;
      }
      return;
    }
    const hit = this.statButtons.find(b => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
    if (hit) {
      this.infoText = hit.text;
      this.infoOpen = true;
      return;
    }
    const entryHit = this.entryButtons.find(b => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2);
    if (entryHit) {
      this.main.activeTab = entryHit.tab;
      return;
    }
    // 点击“破境”文字区域触发
    if (s.canBreak && y > H - 220 && y < H - 140) {
      if (s.breakCooldownUntil && Date.now() < s.breakCooldownUntil) {
        gameState.skipBreakCooldownWithAd((ok, msg) => {
          this.showMsg(msg);
        });
      } else {
        const result = gameState.breakThrough();
        this.showMsg(result.msg);
        if (result.ok) {
          this.tribulationFx = 70;
        }
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

  renderInfoModal(ctx, W, H) {
    const boxW = Math.min(W - 60, 220);
    const text = this.infoText || '';
    const maxTextW = boxW - 24;
    const lines = [];
    let line = '';
    for (const ch of text) {
      const next = line + ch;
      if (ctx.measureText(next).width > maxTextW && line) {
        lines.push(line);
        line = ch;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    const lineH = 18;
    const textTopPad = 16;
    const textBottomPad = 14;
    const boxH = Math.max(70, textTopPad + lines.length * lineH + textBottomPad);
    const x = (W - boxW) / 2;
    const y = H / 2 - boxH / 2;
    this.infoRect = { x1: x, y1: y, x2: x + boxW, y2: y + boxH };

    ctx.fillStyle = 'rgba(82,70,56,0.96)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = '#b79b67';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 13px serif';
    const contentH = lines.length * lineH;
    const startY = y + (boxH - contentH) / 2 + 12;
    lines.forEach((ln, idx) => ctx.fillText(ln, W / 2, startY + idx * lineH));
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
      let x = W * (0.2 + Math.random() * 0.6);
      let y = contentY + 90;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (Math.random() - 0.5) * 26;
        y += 20 + Math.random() * 16;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(185,210,255,${0.45 + Math.random() * 0.35})`;
      ctx.lineWidth = 1 + Math.random() * 1.2;
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(220,235,255,${0.35 + alpha})`;
    ctx.font = 'bold 14px serif';
    ctx.fillText('雷劫降世，破境而升', W / 2, contentY + 126);
  }
}
