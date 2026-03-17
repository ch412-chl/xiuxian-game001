// 境界配置（按章节生成）
export const REALM_GROUPS = [
  '炼气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙', '金仙', '太乙', '大罗', '道祖'
];
export const REALM_STAGES = ['初期', '中期', '后期'];

// 副本命名（每个境界三阶段）
export const REALM_DUNGEON_NAMES = {
  炼气: ['野狼谷外围', '野狼谷中心', '野狼谷深处'],
  筑基: ['青云剑墟', '剑阁回廊', '万剑峰'],
  结丹: ['火云洞口', '熔火回廊', '魔渊入口'],
  元婴: ['冰魄渊口', '玄冰长阶', '霜魂禁地'],
  化神: ['雷泽外域', '雷泽心渊', '天雷祭坛'],
  炼虚: ['虚空裂隙', '折光回廊', '空冥之眼'],
  合体: ['万灵原野', '合元秘径', '归一殿'],
  大乘: ['天门外域', '星阙长桥', '天阙神庭'],
  渡劫: ['劫云海口', '雷光断界', '天罚祭台'],
  真仙: ['仙庭云径', '紫微宫门', '太清仙阙'],
  金仙: ['金阙天街', '琉璃天廊', '金轮法界'],
  太乙: ['太乙玄原', '万象宫', '玄天法阵'],
  大罗: ['大罗界外', '寂灭长阶', '无尽道场'],
  道祖: ['道祖外庭', '混元大道', '万道之心'],
};

const buildRealms = () => {
  const list = [];
  for (let g = 0; g < REALM_GROUPS.length; g++) {
    const baseXp = 1000 * Math.pow(2, g);
    for (let s = 0; s < REALM_STAGES.length; s++) {
      const isLast = g === REALM_GROUPS.length - 1 && s === REALM_STAGES.length - 1;
      list.push({
        name: `${REALM_GROUPS[g]}${REALM_STAGES[s]}`,
        xpNeed: isLast ? Infinity : baseXp * (s + 1),
        atkBonus: Math.floor(20 * Math.pow(2, g) * (s + 1) * 0.8),
        defBonus: Math.floor(10 * Math.pow(2, g) * (s + 1) * 0.8),
      });
    }
  }
  return list;
};

export const REALMS = buildRealms();

// 洞府每级修炼速度加成（满级10）
export const CAVE_LEVELS = (() => {
  const list = [];
  for (let lv = 1; lv <= 10; lv++) {
    const xpPerHour = Math.floor(100 * Math.pow(1.25, lv - 1));
    const stonePerHour = Math.floor(50 * Math.pow(1.25, lv - 1));
    const upgradeCost = Math.floor(2000 * Math.pow(1.8, lv - 1));
    list.push({ lv, xpPerHour, stonePerHour, upgradeCost });
  }
  return list;
})();

// 神通配置
export const SHENGTONG = {
  thunder: {
    name: '雷霆诀',
    desc: '引天雷入体，凝于掌心一击而出，单体目标受到大量雷属性伤害。',
    icon: '⚡',
    dmgPct: 3.2,   // 攻击力倍率
    cdRound: 2,    // 冷却回合
    type: 'single',
    elem: '雷',
    fragNeed: [20, 30, 50, 80, 120], // 每级升级需要碎片
  },
  ice: {
    name: '寒冰掌',
    desc: '凝水成冰，以掌推出寒冰波动，单体目标受到寒冰伤害。',
    icon: '🌊',
    dmgPct: 1.8,
    cdRound: 2,
    type: 'single',
    elem: '水',
    fragNeed: [20, 30, 50, 80, 120],
  },
  fire: {
    name: '炎阳功',
    desc: '以真元催动体内阳火，形成持续燃烧场域，对群体造成伤害。',
    icon: '🔥',
    dmgPct: 0.6,
    cdRound: 1,
    type: 'aoe',
    elem: '火',
    fragNeed: [20, 30, 50, 80, 120],
  },
  vortex: {
    name: '混元气旋',
    desc: '混元一气化三清，气旋吸附周围敌人持续造成伤害。',
    icon: '🌀',
    dmgPct: 0.9,
    cdRound: 3,
    type: 'aoe',
    elem: '风',
    fragNeed: [20, 30, 50, 80, 120],
  },
  sword: {
    name: '御剑术',
    desc: '以神识御剑，剑气纵横，连续攻击造成单体伤害。',
    icon: '🗡️',
    dmgPct: 1.4,
    cdRound: 2,
    type: 'single',
    elem: '金',
    fragNeed: [20, 30, 50, 80, 120],
  },
  shield: {
    name: '金钟罩',
    desc: '运转护体真元，形成金色护盾抵挡伤害。',
    icon: '🛡️',
    dmgPct: 0,
    cdRound: 4,
    type: 'defense',
    elem: '金',
    fragNeed: [20, 30, 50, 80, 120],
  },
};

// 装备配置
export const EQUIPS = {
  bamboo_sword: { name: '青竹剑', slot: 'weapon', atk: 8, def: 0, spd: 2 },
  iron_sword: { name: '玄铁剑', slot: 'weapon', atk: 18, def: 0, spd: 3 },
  jade_ring: { name: '青玉戒', slot: 'ring', atk: 0, def: 4, spd: 4 },
  bronze_ring: { name: '青铜戒', slot: 'ring', atk: 3, def: 2, spd: 2 },
  cloth_robe: { name: '素衣', slot: 'robe', atk: 0, def: 6, spd: 0 },
  silk_robe: { name: '云丝袍', slot: 'robe', atk: 0, def: 12, spd: 1 },
};

// 丹药配方
export const RECIPES = {
  juling: {
    name: '聚灵丹',
    icon: '💊',
    desc: '服用后恢复修为，可加速突破进度。',
    mats: { herb: 2, dew: 1 },
    output: { id: 'juling', count: 2 },
    hours: 2,
    effect: { xp: 500 },
  },
  huiling: {
    name: '回灵丹',
    icon: '🌿',
    desc: '战斗中恢复气血法力。',
    mats: { herb: 1, water: 2 },
    output: { id: 'huiling', count: 3 },
    hours: 1,
    effect: { hpPct: 0.3 },
  },
  zhujidan: {
    name: '筑基丹',
    icon: '🧪',
    desc: '突破筑基期必备，大幅提升突破成功率。',
    mats: { lingzhi: 1, xuanbing: 1 },
    output: { id: 'zhujidan', count: 1 },
    hours: 6,
    effect: { breakBonus: 0.5 },
    realmUnlock: 2, // 练气后期解锁
  },
  jiedandan: {
    name: '结丹丹',
    icon: '🔮',
    desc: '突破结丹期必备。',
    mats: { lingzhi: 2, huoling: 1, xuanbing: 1 },
    output: { id: 'jiedandan', count: 1 },
    hours: 12,
    effect: { breakBonus: 0.6 },
    realmUnlock: 5, // 筑基后期解锁
  },
};

// 突破材料与突破丹
export const BREAK_MATS = REALM_GROUPS.map((name, idx) => ({
  id: `break_mat_${idx}`,
  name: `${name}突破材料`,
}));

export const BREAK_DANS = REALM_GROUPS.map((name, idx) => ({
  id: `break_dan_${idx}`,
  name: `${name}丹`,
}));

// 丹方掉落道具
export const RECIPE_ITEMS = REALM_GROUPS.map((name, idx) => ({
  id: `recipe_break_dan_${idx}`,
  name: `丹方·${name}丹`,
  recipeId: `break_dan_${idx}`,
}));

// 道具配置
export const ITEMS = {
  juling:   { name: '聚灵丹',  icon: '💊', type: 'dan',  desc: '恢复500修为' },
  huiling:  { name: '回灵丹',  icon: '🌿', type: 'dan',  desc: '恢复30%气血法力' },
  zhujidan: { name: '筑基丹',  icon: '🧪', type: 'dan',  desc: '提升突破成功率50%' },
  jiedandan:{ name: '结丹丹',  icon: '🔮', type: 'dan',  desc: '提升突破成功率60%' },
  teleport: { name: '传送符',  icon: '🪬', type: 'fu',   desc: '立即传送回城，结束本次探索' },
  bamboo_sword: { name: '青竹剑', icon: '🗡️', type: 'equip', slot: 'weapon', desc: '攻+8  速+2' },
  iron_sword:   { name: '玄铁剑', icon: '🗡️', type: 'equip', slot: 'weapon', desc: '攻+18  速+3' },
  jade_ring:    { name: '青玉戒', icon: '💍', type: 'equip', slot: 'ring',   desc: '防+4  速+4' },
  bronze_ring:  { name: '青铜戒', icon: '💍', type: 'equip', slot: 'ring',   desc: '攻+3  防+2  速+2' },
  cloth_robe:   { name: '素衣',   icon: '🥋', type: 'equip', slot: 'robe',   desc: '防+6' },
  silk_robe:    { name: '云丝袍', icon: '🥋', type: 'equip', slot: 'robe',   desc: '防+12  速+1' },
  herb:     { name: '灵草',    icon: '🌿', type: 'mat',  desc: '炼丹材料' },
  dew:      { name: '灵露',    icon: '💧', type: 'mat',  desc: '炼丹材料' },
  water:    { name: '清泉水',  icon: '🫧', type: 'mat',  desc: '炼丹材料' },
  lingzhi:  { name: '千年灵芝',icon: '🍄', type: 'mat',  desc: '稀有炼丹材料' },
  xuanbing: { name: '玄冰精',  icon: '❄️', type: 'mat',  desc: '稀有炼丹材料' },
  huoling:  { name: '火灵石',  icon: '🔥', type: 'mat',  desc: '稀有炼丹材料' },
  stfrag_thunder: { name: '雷霆碎片', icon: '⚡', type: 'stfrag', stId: 'thunder', desc: '神通碎片' },
  stfrag_ice:     { name: '寒冰碎片', icon: '🌊', type: 'stfrag', stId: 'ice',     desc: '神通碎片' },
  stfrag_fire:    { name: '炎阳碎片', icon: '🔥', type: 'stfrag', stId: 'fire',    desc: '神通碎片' },
  stfrag_vortex:  { name: '气旋碎片', icon: '🌀', type: 'stfrag', stId: 'vortex',  desc: '神通碎片' },
  stfrag_sword:   { name: '御剑碎片', icon: '🗡️', type: 'stfrag', stId: 'sword',   desc: '神通碎片' },
  stfrag_shield:  { name: '金钟碎片', icon: '🛡️', type: 'stfrag', stId: 'shield',  desc: '神通碎片' },
};

BREAK_MATS.forEach((m) => {
  ITEMS[m.id] = { name: m.name, icon: '🧱', type: 'mat', desc: '突破丹材料' };
});
BREAK_DANS.forEach((d) => {
  ITEMS[d.id] = { name: d.name, icon: '🧪', type: 'dan', desc: '突破丹' };
});
RECIPE_ITEMS.forEach((r) => {
  ITEMS[r.id] = { name: r.name, icon: '📜', type: 'recipe', recipeId: r.recipeId, desc: '丹方' };
});

// 灵药种子
const SEEDS = [
  { id: 'seed_herb', name: '灵草种子', matId: 'herb' },
  { id: 'seed_dew', name: '灵露种子', matId: 'dew' },
  { id: 'seed_water', name: '清泉种子', matId: 'water' },
  { id: 'seed_lingzhi', name: '灵芝种子', matId: 'lingzhi' },
  { id: 'seed_xuanbing', name: '玄冰种子', matId: 'xuanbing' },
  { id: 'seed_huoling', name: '火灵石种子', matId: 'huoling' },
];
SEEDS.forEach((s) => {
  ITEMS[s.id] = { name: s.name, icon: '🌱', type: 'seed', seedId: s.matId, desc: '永久解锁材料产出' };
});

// 追加突破丹配方
BREAK_DANS.forEach((d, idx) => {
  RECIPES[d.id] = {
    name: d.name,
    icon: '🧪',
    desc: '突破必备丹药',
    mats: { [`break_mat_${idx}`]: 1 },
    output: { id: d.id, count: 1 },
    hours: 0.0003,
    effect: { breakBonus: 0.5 },
  };
});

// 地下城章节与副本
export const DUNGEONS = (() => {
  const list = [];
  let id = 1;
  for (let g = 0; g < REALM_GROUPS.length; g++) {
    for (let s = 0; s < REALM_STAGES.length; s++) {
      const groupName = REALM_GROUPS[g];
      const names = REALM_DUNGEON_NAMES[groupName] || [];
      const dungeonName = names[s] || `${groupName}${REALM_STAGES[s]}秘境`;
      list.push({
        id,
        chapter: groupName,
        stage: REALM_STAGES[s],
        stageIdx: s,
        name: dungeonName,
        groupIdx: g,
        floors: 10,
        enemyBase: 60 + g * 40 + s * 20,
      });
      id += 1;
    }
  }
  return list;
})();
