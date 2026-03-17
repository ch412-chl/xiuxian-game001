import { gameState } from '../gameState';
import { RECIPES, ITEMS } from '../data';

export class CavePanel {
  constructor(main) {
    this.main = main;
    this.buttons = [];
    this.msg = null;
    this.msgTimer = 0;
  }

  onTouch(x, y) {
    const hit = this.buttons.find(
      (b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2
    );
    if (!hit) return;

    if (hit.type === 'claimIdle') {
      const reward = gameState.claimCaveIdle();
      this.showMsg(reward ? '已领取洞府收益' : '暂无收益可领');
      return;
    }

    if (hit.type === 'upgradeCave') {
      const res = gameState.upgradeCave();
      this.showMsg(res.msg);
      return;
    }

    if (hit.type === 'startAlchemy') {
      const res = gameState.startAlchemy(hit.id);
      this.showMsg(res.msg);
      const s = gameState.state;
      if (!s.guide.firstAlchemy) {
        s.guide.firstAlchemy = true;
        this.showMsg('首次炼丹已开始，稍等片刻即可收丹');
        gameState.save();
      }
      return;
    }

    if (hit.type === 'claimAlchemy') {
      const res = gameState.claimAlchemy();
      this.showMsg(res.msg);
      return;
    }

    if (hit.type === 'minePlus') {
      const res = gameState.adjustServants({ mineDelta: 1 });
      this.showMsg(res ? '灵仆已调度' : '无法调度');
    }
    if (hit.type === 'mineMinus') {
      const res = gameState.adjustServants({ mineDelta: -1 });
      this.showMsg(res ? '灵仆已调度' : '无法调度');
    }
    if (hit.type === 'herbPlus') {
      const res = gameState.adjustServants({ herbDelta: 1 });
      this.showMsg(res ? '灵仆已调度' : '无法调度');
    }
    if (hit.type === 'herbMinus') {
      const res = gameState.adjustServants({ herbDelta: -1 });
      this.showMsg(res ? '灵仆已调度' : '无法调度');
    }
  }

  render(ctx, W, H, headerH) {
    this.buttons = [];
    const s = gameState.state;
    const startY = headerH + 60;

    // 标题
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d4b88a';
    ctx.font = '20px serif';
    ctx.fillText(`洞府：${s.cave.lv === 1 ? '一阶（寒舍）' : s.cave.lv + ' 阶'}`, W / 2, startY);

    ctx.fillStyle = '#6a5a40';
    ctx.font = '14px serif';
    ctx.fillText(`聚灵阵：灵石 +${s.stonePerHour}/h  修为 +${s.xpPerHour}/h`, W / 2, startY + 35);

    // 洞府升级
    ctx.fillStyle = '#d4b88a';
    ctx.font = '12px serif';
    ctx.fillText('升级洞府', W * 0.82, startY + 4);
    this.buttons.push({ type: 'upgradeCave', x1: W * 0.72, x2: W * 0.92, y1: startY - 16, y2: startY + 12 });

    // 分割线
    ctx.strokeStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.moveTo(W * 0.25, startY + 70);
    ctx.lineTo(W * 0.75, startY + 70);
    ctx.stroke();

    // 灵仆分配
    const servantY = startY + 100;
    ctx.fillStyle = '#8a7a60';
    ctx.fillText("【 灵 仆 分 配 】", W / 2, servantY);
    const total = gameState.getTotalServants();
    const mine = s.cave.servants?.mine || 0;
    const herb = s.cave.servants?.herb || 0;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#5a4a30';
    ctx.font = '12px serif';
    ctx.fillText(`总灵仆：${total}  已分配：${mine + herb}`, W * 0.18, servantY + 28);

    ctx.fillStyle = '#d4b88a';
    ctx.fillText(`灵矿：${mine}`, W * 0.18, servantY + 52);
    ctx.fillText('＋', W * 0.7, servantY + 52);
    ctx.fillText('－', W * 0.78, servantY + 52);
    this.buttons.push({ type: 'minePlus', x1: W * 0.68, x2: W * 0.74, y1: servantY + 38, y2: servantY + 60 });
    this.buttons.push({ type: 'mineMinus', x1: W * 0.76, x2: W * 0.82, y1: servantY + 38, y2: servantY + 60 });

    ctx.fillStyle = '#d4b88a';
    ctx.fillText(`药园：${herb}`, W * 0.18, servantY + 76);
    ctx.fillText('＋', W * 0.7, servantY + 76);
    ctx.fillText('－', W * 0.78, servantY + 76);
    this.buttons.push({ type: 'herbPlus', x1: W * 0.68, x2: W * 0.74, y1: servantY + 62, y2: servantY + 84 });
    this.buttons.push({ type: 'herbMinus', x1: W * 0.76, x2: W * 0.82, y1: servantY + 62, y2: servantY + 84 });

    // 洞府产出收益
    const idleY = servantY + 110;
    const reward = gameState.getCaveIdleReward();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8a7a60';
    ctx.fillText("【 洞 府 挂 机 】", W / 2, idleY);
    ctx.fillStyle = '#d4b88a';
    ctx.font = '12px serif';
    const idleText = reward ? `累积 ${reward.hours.toFixed(1)}h  灵石 ${reward.stone}` : '暂无收益';
    ctx.fillText(idleText, W / 2, idleY + 26);
    ctx.fillStyle = '#6a5a40';
    ctx.fillText('点击领取', W / 2, idleY + 48);
    this.buttons.push({ type: 'claimIdle', x1: W * 0.4, x2: W * 0.6, y1: idleY + 30, y2: idleY + 54 });

    // 丹房区域
    const sectionY = idleY + 90;
    ctx.fillStyle = '#8a7a60';
    ctx.fillText("【 丹 房 】", W / 2, sectionY);

    const status = gameState.getAlchemyStatus();
    if (status) {
      const recipe = RECIPES[status.recipeId];
      const remaining = this.formatMs(status.remainingMs);
      ctx.fillStyle = '#d4b88a';
      ctx.font = '12px serif';
      ctx.fillText(`炉中：${recipe.name}  剩余 ${remaining}`, W / 2, sectionY + 30);
      if (status.done) {
        ctx.fillStyle = '#d4b88a';
        ctx.fillText('收丹', W * 0.78, sectionY + 52);
        this.buttons.push({ type: 'claimAlchemy', x1: W * 0.7, x2: W * 0.86, y1: sectionY + 38, y2: sectionY + 60 });
      }
    } else {
      const list = (s.recipesKnown || []).filter(id => RECIPES[id]);
      list.forEach((id, i) => {
        const r = RECIPES[id];
        const y = sectionY + 30 + i * 22;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#d4b88a';
        ctx.font = '12px serif';
        ctx.fillText(`· ${r.name}`, W * 0.2, y);
        const mats = Object.keys(r.mats).map(k => `${ITEMS[k]?.name || k}×${r.mats[k]}`).join(' ');
        ctx.fillStyle = '#5a4a30';
        ctx.fillText(mats, W * 0.5, y);
        this.buttons.push({ type: 'startAlchemy', id, x1: W * 0.18, x2: W * 0.88, y1: y - 12, y2: y + 8 });
      });
    }

    // 消息提示
    if (this.msgTimer > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(212, 184, 138, ${this.msgTimer / 100})`;
      ctx.fillText(this.msg, W / 2, H - 120);
    }
  }

  showMsg(msg) {
    this.msg = msg;
    this.msgTimer = 100;
  }

  update() {
    if (this.msgTimer > 0) this.msgTimer--;
  }

  formatMs(ms) {
    const sec = Math.ceil(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}分${s}秒`;
  }
}
