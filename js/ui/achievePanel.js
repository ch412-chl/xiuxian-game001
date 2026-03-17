import { gameState } from '../gameState';

export class AchievePanel {
  constructor(main) {
    this.main = main;
  }

  onTouch(x, y) {}

  render(ctx, W, H, headerH) {
    const s = gameState.state;
    const startY = headerH + 60;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#6a5a40';
    ctx.font = '14px serif';
    ctx.fillText("—— 成 就 ——", W / 2, startY);

    const rows = this.buildAchievements(s);
    const listY = startY + 40;
    rows.forEach((a, i) => {
      const y = listY + i * 26;
      ctx.textAlign = 'left';
      ctx.fillStyle = a.done ? '#d4b88a' : '#5a4a30';
      ctx.font = '12px serif';
      ctx.fillText(a.name, W * 0.12, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = a.done ? '#8a7a60' : '#3a2a1a';
      ctx.fillText(a.done ? '已达成' : `${a.cur}/${a.need}`, W * 0.88, y);
    });
  }

  buildAchievements(s) {
    const list = [];
    list.push({ name: '击杀·初试', cur: s.killCount, need: 100 });
    list.push({ name: '击杀·千斩', cur: s.killCount, need: 1000 });
    list.push({ name: '财富·小成', cur: s.stone, need: 10000 });
    list.push({ name: '财富·巨贾', cur: s.stone, need: 100000 });
    list.push({ name: '历练·一境', cur: s.dungeonProgress?.dungeonIdx || 0, need: 1 });
    list.push({ name: '历练·三境', cur: s.dungeonProgress?.dungeonIdx || 0, need: 3 });
    list.push({ name: '境界·筑基', cur: s.realmIdx, need: 3 });
    list.push({ name: '境界·结丹', cur: s.realmIdx, need: 6 });
    list.push({ name: '境界·元婴', cur: s.realmIdx, need: 9 });
    return list.map(a => ({ ...a, done: a.cur >= a.need }));
  }
}
