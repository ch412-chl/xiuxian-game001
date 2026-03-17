import { gameState } from '../gameState';
import { ITEMS } from '../data';

export class BagPanel {
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
    const item = hit.item;
    const cfg = ITEMS[item.id];
    if (!cfg) return;

    if (cfg.type === 'equip') {
      const ok = gameState.toggleEquipItem(item.id);
      this.showMsg(ok ? '已切换装备' : '无法装备');
      return;
    }

    if (cfg.type === 'dan') {
      const res = gameState.useDanItem(item.id);
      this.showMsg(res.msg);
      return;
    }

    if (cfg.type === 'recipe') {
      const res = gameState.useRecipeItem(item.id);
      this.showMsg(res.msg);
      return;
    }

    if (cfg.type === 'seed') {
      const res = gameState.useSeedItem(item.id);
      this.showMsg(res.msg);
    }
  }

  render(ctx, W, H, headerH) {
    const s = gameState.state;
    const startY = headerH + 60;
    this.buttons = [];

    ctx.textAlign = 'center';
    ctx.fillStyle = '#6a5a40';
    ctx.font = '14px serif';
    ctx.fillText("—— 纳 戒 ——", W / 2, startY);

    if (s.bag.length === 0) {
      ctx.fillStyle = '#4a3a28';
      ctx.fillText("空无一物，唯有清风", W / 2, H / 2);
      return;
    }

    // 列表排版
    const listY = startY + 60;
    s.bag.forEach((item, i) => {
      const cfg = ITEMS[item.id];
      const y = listY + i * 40;
      const name = cfg ? cfg.name : item.id;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#d4b88a';
      ctx.font = '16px serif';
      ctx.fillText(`· ${name}`, W * 0.2, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#5a4a30';
      ctx.font = '14px serif';
      ctx.fillText(`数量：${item.count}`, W * 0.8, y);

      const tag = cfg?.type === 'equip' ? '装备' : (cfg?.type === 'dan' ? '丹药' : (cfg?.type === 'recipe' ? '丹方' : (cfg?.type === 'seed' ? '种子' : '材料')));
      ctx.textAlign = 'right';
      ctx.fillStyle = '#3a2a1a';
      ctx.font = '10px serif';
      ctx.fillText(tag, W * 0.82, y - 14);
      
      // 装饰虚线
      ctx.strokeStyle = '#1a1a1a';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(W * 0.2, y + 15);
      ctx.lineTo(W * 0.8, y + 15);
      ctx.stroke();
      ctx.setLineDash([]);

      this.buttons.push({ item, x1: W * 0.18, x2: W * 0.88, y1: y - 20, y2: y + 12 });
    });

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
}
