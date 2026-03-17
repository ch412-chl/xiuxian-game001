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
  }

  // 接收 Main.js 传来的 headerH，确保文字位置正确
  render(ctx, W, H, headerH) {
    const s = gameState.state;
    // 这里的 contentY 决定了文字起始高度，避开顶部胶囊
    const contentY = headerH + 30; 
    this.statButtons = [];

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

    ctx.fillStyle = s.xp >= s.xpNeed ? '#8b5bff' : '#f0d8a8';
    ctx.font = 'bold 22px serif';
    ctx.fillText(s.realmName, W / 2, contentY + 175);
    
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 12px serif';
    ctx.fillText(`修为：${Math.floor(s.xpPct)}%`, W / 2, contentY + 200);

    // --- 4. 命籍属性 (取代原本的蓝色方块) ---
    const stats = [
      { key: 'hp', l: '气 · 血', v: `${s.hp}/${s.maxHp}`, desc: '角色生命值，归零则战斗失败。' },
      { key: 'atk', l: '攻 · 伐', v: s.totalAtk, desc: '影响造成伤害的基础数值。' },
      { key: 'def', l: '御 · 守', v: s.totalDef, desc: '影响承受伤害的减免比例。' },
      { key: 'spd', l: '神 · 识', v: s.totalSpd || s.spd, desc: '影响命中与闪避。' },
      { key: 'shaqi', l: '煞 · 气', v: `${s.shaqi}%`, desc: '提高暴击概率，溢出转为暴击伤害。' }
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

    // --- 6. 交互文字 (取代原本的深蓝色按钮) ---
    const cooldown = s.breakCooldownUntil && Date.now() < s.breakCooldownUntil;
    if (s.xp >= s.xpNeed) {
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
    // 点击“破境”文字区域触发
    if (s.xp >= s.xpNeed && y > H - 220 && y < H - 140) {
      if (s.breakCooldownUntil && Date.now() < s.breakCooldownUntil) {
        gameState.skipBreakCooldownWithAd((ok, msg) => {
          this.showMsg(msg);
        });
      } else {
        const result = gameState.breakThrough();
        this.showMsg(result.msg);
      }
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
    const boxW = Math.min(W - 60, 220);
    const boxH = 70;
    const x = (W - boxW) / 2;
    const y = H / 2 - boxH / 2;
    this.infoRect = { x1: x, y1: y, x2: x + boxW, y2: y + boxH };

    ctx.fillStyle = 'rgba(20,16,12,0.9)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = '#3a332d';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 13px serif';
    ctx.fillText('属性说明', W / 2, y + 24);

    // 不展示说明文案
  }
}
