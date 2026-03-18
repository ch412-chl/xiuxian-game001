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
    if (hit.type === 'back') {
      this.main.activeTab = 'role';
      return;
    }
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
    const startY = headerH + 44;
    this.buttons = [];

    this.drawBack(ctx, 26, startY - 12, 52, 22);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 14px serif';
    ctx.fillText('纳戒', 88, startY + 4);

    const items = gameState.getInventoryItems();
    if (items.length === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4a3a28';
      ctx.fillText('暂无物品', W / 2, H / 2);
      return;
    }

    // 列表排版
    const listY = startY + 50;
    items.forEach((item, i) => {
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
