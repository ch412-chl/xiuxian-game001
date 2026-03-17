// 境界配置（按章节生成）
export const REALM_GROUPS = [
  '炼气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙', '金仙', '太乙', '大罗', '道祖'
];
export const REALM_STAGES = ['初期', '中期', '后期'];
export const REALM_LAYER_COUNT = 10;
export const BASE_XP_PER_HOUR = 100;

const buildRealmStageMinutes = () => {
  const list = [];
  const stageMul = [1, 1.2, 1.5];
  for (let g = 0; g < REALM_GROUPS.length; g++) {
    const baseMin = 10 * Math.pow(1.28, g);
    for (let s = 0; s < REALM_STAGES.length; s++) {
      list.push(Math.round(baseMin * stageMul[s]));
    }
  }
  return list;
};

export const REALM_STAGE_TIME_MINUTES = buildRealmStageMinutes();

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
    for (let s = 0; s < REALM_STAGES.length; s++) {
      const isLast = g === REALM_GROUPS.length - 1 && s === REALM_STAGES.length - 1;
      const idx = g * REALM_STAGES.length + s;
      list.push({
        name: `${REALM_GROUPS[g]}${REALM_STAGES[s]}`,
        stageMinutes: isLast ? Infinity : REALM_STAGE_TIME_MINUTES[idx],
        atkBonus: Math.floor(20 * Math.pow(2, g) * (s + 1) * 0.8),
        defBonus: Math.floor(10 * Math.pow(2, g) * (s + 1) * 0.8),
        hpBonus: Math.floor(90 * Math.pow(1.5, g) * (s + 1)),
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
    const xpPerHour = Math.floor(BASE_XP_PER_HOUR * Math.pow(1.25, lv - 1));
    const stonePerHour = Math.floor(50 * Math.pow(1.25, lv - 1));
    const upgradeCost = Math.floor(2000 * Math.pow(1.8, lv - 1));
    list.push({ lv, xpPerHour, stonePerHour, upgradeCost });
  }
  return list;
})();

// 神通配置（战斗仅单体结算；特殊效果仅保留“回复气血”）
export const ST_LEVEL_NAMES = ['入门', '小成', '大成', '圆满', '超越', '仙道'];
export const ST_LEVEL_UP_USE_NEED = [20, 40, 60, 80, 100];
export const ST_LEVEL_POWER_MUL = [1, 1.2, 1.44, 2.16, 3.24, 6.48];
export const SHENGTONG = {
  st_guiyuan: { name: '归元指', icon: '⚡', dmgPct: 1.2, cd: 1.8, skillType: 'direct', realmGroup: 0 },
  st_qingxin: { name: '清心诀', icon: '✨', dmgPct: 0.7, cd: 1.4, skillType: 'direct', realmGroup: 0 },
  st_pojia: { name: '破甲掌', icon: '🗡️', dmgPct: 1.4, cd: 2.0, skillType: 'direct', realmGroup: 1 },
  st_tiegu: { name: '铁骨诀', icon: '🛡️', dmgPct: 0.6, cd: 1.4, skillType: 'direct', realmGroup: 1 },
  st_fenxin: { name: '焚心焰', icon: '🔥', dmgPct: 0.95, cd: 1.6, skillType: 'direct', realmGroup: 2 },
  st_ningshen: { name: '凝神印', icon: '🌊', dmgPct: 0.7, cd: 1.5, skillType: 'direct', realmGroup: 2 },
  st_powang: { name: '破妄斩', icon: '⚔️', dmgPct: 1.7, cd: 2.2, skillType: 'direct', realmGroup: 3 },
  st_huiyuan: { name: '回元术', icon: '💧', dmgPct: 0.6, cd: 2.0, skillType: 'heal_hit', healPct: 0.15, realmGroup: 3 },
  st_xuanlei: { name: '玄雷诀', icon: '⚡', dmgPct: 2.0, cd: 2.4, skillType: 'direct', realmGroup: 4 },
  st_tiangang: { name: '天罡护体', icon: '🍃', dmgPct: 0.8, cd: 1.8, skillType: 'direct', realmGroup: 4 },
  st_jimie: { name: '寂灭印', icon: '🕳️', dmgPct: 2.3, cd: 2.6, skillType: 'direct', realmGroup: 5 },
  st_xuying: { name: '虚影步', icon: '👣', dmgPct: 0.8, cd: 1.9, skillType: 'direct', realmGroup: 5 },
  st_jiuxiao: { name: '九霄雷狱', icon: '⛈️', dmgPct: 2.5, cd: 2.8, skillType: 'direct', realmGroup: 6 },
  st_heyuan: { name: '合元护心', icon: '🧿', dmgPct: 0.9, cd: 2.1, skillType: 'direct', realmGroup: 6 },
  st_wanjie: { name: '万劫斩', icon: '⚔️', dmgPct: 2.7, cd: 3.0, skillType: 'direct', realmGroup: 7 },
  st_wanling: { name: '万灵复元', icon: '🌿', dmgPct: 0.9, cd: 2.3, skillType: 'heal_hit', healPct: 0.2, realmGroup: 7 },
  st_jiehuo: { name: '劫火噬', icon: '🔥', dmgPct: 1.15, cd: 2.4, skillType: 'direct', realmGroup: 8 },
  st_jielei: { name: '劫雷护体', icon: '🛡️', dmgPct: 1.0, cd: 2.2, skillType: 'direct', realmGroup: 8 },
  st_xianyi: { name: '仙意破军', icon: '🌠', dmgPct: 3.0, cd: 3.2, skillType: 'direct', realmGroup: 9 },
  st_taiqing: { name: '太清心法', icon: '✨', dmgPct: 1.0, cd: 2.3, skillType: 'direct', realmGroup: 9 },
  st_jinque: { name: '金阙斩', icon: '🗡️', dmgPct: 3.2, cd: 3.3, skillType: 'direct', realmGroup: 10 },
  st_jinshen: { name: '金身不坏', icon: '🛡️', dmgPct: 1.1, cd: 2.4, skillType: 'direct', realmGroup: 10 },
  st_taiyi: { name: '太乙诛邪', icon: '⚔️', dmgPct: 3.4, cd: 3.4, skillType: 'direct', realmGroup: 11 },
  st_xuantian: { name: '玄天护命', icon: '💧', dmgPct: 1.1, cd: 2.6, skillType: 'heal_hit', healPct: 0.25, realmGroup: 11 },
  st_daluo: { name: '大罗天灾', icon: '☄️', dmgPct: 1.2, cd: 2.6, skillType: 'direct', realmGroup: 12 },
  st_wanxiang: { name: '万象归元', icon: '🍃', dmgPct: 1.2, cd: 2.6, skillType: 'direct', realmGroup: 12 },
  st_wandao: { name: '万道归一', icon: '🌌', dmgPct: 3.8, cd: 3.8, skillType: 'direct', realmGroup: 13 },
  st_guixu: { name: '归墟无相', icon: '🫧', dmgPct: 1.3, cd: 2.8, skillType: 'direct', realmGroup: 13 },
};

export const MONSTER_CODEX = (() => {
  const defs = [
    {
      chapter: '炼气',
      regular: { name: '灰鬃狼妖', title: '山谷边缘的噬血妖狼', artType: 'wolf', aura: '灰金', lore: '常年盘踞在野狼谷外围，嗅到血气便会成群扑来。' },
      boss: { name: '噬月狼王', title: '月下啸聚的狼谷首领', artType: 'wolf_king', aura: '赤金', lore: '吞食同类而成王，利爪与獠牙在夜色中最先显现。' },
    },
    {
      chapter: '筑基',
      regular: { name: '残剑灵', title: '剑墟中苏醒的残兵之灵', artType: 'sword_spirit', aura: '银青', lore: '剑阁残意化灵，受惊后会催动断剑掠杀来者。' },
      boss: { name: '断岳剑主', title: '守着旧剑意的墟中剑主', artType: 'sword_lord', aura: '冷银', lore: '其身已灭，唯剑意未灭，仍守在剑墟深处。' },
    },
    {
      chapter: '结丹',
      regular: { name: '炽骨魔', title: '熔洞中游荡的火骨妖躯', artType: 'flame_fiend', aura: '炎赤', lore: '骨骼如炭，内火不息，所过之处热浪翻卷。' },
      boss: { name: '熔心魔君', title: '以熔火为心核的洞府魔首', artType: 'flame_lord', aura: '赤橙', lore: '深藏火云洞内，躯体在烈焰中不断重塑。' },
    },
    {
      chapter: '元婴',
      regular: { name: '霜牙雪魈', title: '冰渊深处的寒魈', artType: 'ice_beast', aura: '霜蓝', lore: '常伏于冰层之后，破冰而出时寒气逼骨。' },
      boss: { name: '寒魄雪主', title: '凝聚极寒之息的雪魄首领', artType: 'ice_king', aura: '冰白', lore: '其息所过，连法器都能冻结成霜。' },
    },
    {
      chapter: '化神',
      regular: { name: '雷羽玄鹏', title: '雷泽中盘旋的雷羽异禽', artType: 'thunder_bird', aura: '雷紫', lore: '振翅时电芒缠羽，俯冲速度快若惊雷。' },
      boss: { name: '天雷鹏王', title: '掌驭雷霆的泽域霸主', artType: 'thunder_king', aura: '明紫', lore: '其啼声能引动天雷，震得山泽俱鸣。' },
    },
    {
      chapter: '炼虚',
      regular: { name: '裂隙魔眼', title: '虚空裂隙中的窥视者', artType: 'void_eye', aura: '幽蓝', lore: '常以巨眼现身，周围空间会泛起轻微折痕。' },
      boss: { name: '空冥主眼', title: '深渊尽头的虚空瞳主', artType: 'void_overlord', aura: '幽青', lore: '据说被其注视者，连神魂都会短暂迟滞。' },
    },
    {
      chapter: '合体',
      regular: { name: '荒原石傀', title: '由万灵原野碎岩凝成的傀身', artType: 'stone_golem', aura: '土褐', lore: '灵气混杂地脉所生，行动迟缓但躯体沉重。' },
      boss: { name: '归一岩君', title: '将百岩炼为一身的石魁首', artType: 'stone_king', aura: '岩金', lore: '躯壳如岳，举手落地都似山崩。' },
    },
    {
      chapter: '大乘',
      regular: { name: '星阙灵蛇', title: '游走在天门星辉中的灵蛇', artType: 'celestial_serpent', aura: '星青', lore: '借星辉腾挪，身形修长，常在高空俯视来者。' },
      boss: { name: '巡天玄螭', title: '天阙深处的古老巡天兽', artType: 'celestial_dragon', aura: '星金', lore: '它盘绕云阙而居，目光如寒星垂落。' },
    },
    {
      chapter: '渡劫',
      regular: { name: '劫火尸王', title: '在劫云下复苏的尸王', artType: 'corpse_king', aura: '暗赤', lore: '每逢雷霆交击，便从焦土之中站起。' },
      boss: { name: '天罚尸尊', title: '被雷劫淬炼而不灭的尸尊', artType: 'corpse_emperor', aura: '血紫', lore: '其残躯长期承受天罚，反而孕出异变之力。' },
    },
    {
      chapter: '真仙',
      regular: { name: '云庭幻狐', title: '仙庭云径中的幻形妖狐', artType: 'spirit_fox', aura: '月白', lore: '善以幻影乱心，真正的身躯往往藏在最后。' },
      boss: { name: '九尾云尊', title: '披云踏月的仙狐之尊', artType: 'fox_queen', aura: '银白', lore: '九尾齐展时，整片云庭都会泛起月色。' },
    },
    {
      chapter: '金仙',
      regular: { name: '金乌残灵', title: '坠入金阙的古乌残灵', artType: 'gold_crow', aura: '曜金', lore: '羽端仍带残阳之火，振翅会留下灼热金痕。' },
      boss: { name: '曜阳乌皇', title: '守着昔日天火的乌皇', artType: 'sun_crow', aura: '灿金', lore: '传闻曾随古日而行，如今只剩一缕天炎未熄。' },
    },
    {
      chapter: '太乙',
      regular: { name: '太乙莲魄', title: '法阵中凝出的青莲之魄', artType: 'lotus_spirit', aura: '青碧', lore: '看似静止不动，实则每一瓣莲影都暗藏锋芒。' },
      boss: { name: '玄天莲尊', title: '坐镇万象宫的莲尊化影', artType: 'lotus_queen', aura: '青金', lore: '法阵运转时，它会在莲影中心缓缓睁眼。' },
    },
    {
      chapter: '大罗',
      regular: { name: '星海古鲸', title: '漂游在寂灭星海的古鲸', artType: 'star_whale', aura: '星蓝', lore: '其影横渡虚空，像是一整片星海在缓缓游动。' },
      boss: { name: '寂灭鲸祖', title: '深空尽头的古鲸始祖', artType: 'whale_king', aura: '深蓝', lore: '巨躯穿行时，四周星光都会被它吞没。' },
    },
    {
      chapter: '道祖',
      regular: { name: '混元古龙', title: '万道震荡中诞生的古龙影', artType: 'chaos_dragon', aura: '混金', lore: '身披混元流光，呼吸间似有万道回响。' },
      boss: { name: '万道龙祖', title: '道场尽头盘踞的龙祖真影', artType: 'dao_dragon', aura: '道金', lore: '传闻其一鳞一爪，皆能映出一条完整大道。' },
    },
  ];

  const out = [];
  defs.forEach((cfg, groupIdx) => {
    out.push({
      id: `monster_${groupIdx}_normal`,
      groupIdx,
      chapter: cfg.chapter,
      isBoss: false,
      habitat: `${cfg.chapter}历练`,
      ...cfg.regular,
    });
    out.push({
      id: `monster_${groupIdx}_boss`,
      groupIdx,
      chapter: cfg.chapter,
      isBoss: true,
      habitat: `${cfg.chapter}历练首领层`,
      ...cfg.boss,
    });
  });
  return out;
})();

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
    desc: '服用后提升当前重修为。',
    mats: { herb: 2, dew: 1 },
    output: { id: 'juling', count: 2 },
    hours: 2,
    effect: { xpPct: 0.5 },
  },
  huiling: {
    name: '回灵丹',
    icon: '🌿',
    desc: '战斗中恢复气血。',
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
  juling:   { name: '聚灵丹',  icon: '💊', type: 'dan',  desc: '提升当前重50%修为' },
  huiling:  { name: '回灵丹',  icon: '🌿', type: 'dan',  desc: '恢复30%气血' },
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
