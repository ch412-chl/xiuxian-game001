export const REALM_GROUPS = [
  '炼气', '筑基', '结丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙', '金仙', '太乙', '大罗', '道祖'
];
export const REALM_STAGES = ['初期', '中期', '后期'];

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

const REALM_XP_NEEDS = [
  1078, 1439, 1798,
  1798, 2153, 2516,
  2516, 2875, 3236,
  3236, 3594, 3953,
  3953, 4306, 4665,
  4665, 5026, 5384,
  5384, 5742, 6104,
  6104, 6462, 6826,
  6826, 7181, 7539,
  7539, 7900, 8259,
  8259, 8620, 8979,
  8979, 9337, 9698,
  9698, 10056, 10418,
  10418, 10776, 11132,
];

export const REALMS = REALM_GROUPS.flatMap((groupName, groupIdx) => {
  return REALM_STAGES.map((stageName, stageIdx) => {
    const idx = groupIdx * REALM_STAGES.length + stageIdx;
    const mul = 1 + stageIdx * 0.28;
    return {
      idx,
      groupIdx,
      stageIdx,
      groupName,
      stageName,
      name: `${groupName}${stageName}`,
      dungeonName: REALM_DUNGEON_NAMES[groupName][stageIdx],
      xpNeed: REALM_XP_NEEDS[idx],
      atkBonus: Math.round(16 * Math.pow(1.24, groupIdx) * mul),
      defBonus: Math.round(10 * Math.pow(1.22, groupIdx) * (1 + stageIdx * 0.22)),
      hpBonus: Math.round(80 * Math.pow(1.34, groupIdx) * (1 + stageIdx * 0.35)),
      spdBonus: Math.round(groupIdx * 2 + stageIdx),
    };
  });
});

export const ST_LEVEL_NAMES = ['入门', '小成', '大成', '圆满', '超越', '仙道'];
export const ST_LEVEL_UP_USE_NEED = [20, 40, 60, 80, 100];
export const ST_LEVEL_POWER_MUL = [1, 1.2, 1.44, 2.16, 3.24, 6.48];

export const SHENGTONG = {
  st_guiyuan: { name: '归元指', dmgPct: 1.2, cd: 1.8, skillType: 'direct', realmGroup: 0 },
  st_pojia: { name: '破甲掌', dmgPct: 1.42, cd: 1.95, skillType: 'direct', realmGroup: 1 },
  st_fenxin: { name: '焚心焰', dmgPct: 1.62, cd: 2.05, skillType: 'direct', realmGroup: 2 },
  st_huiyuan: { name: '回元术', dmgPct: 0.82, cd: 2.2, skillType: 'heal_hit', healPct: 0.12, realmGroup: 3 },
  st_xuanlei: { name: '玄雷诀', dmgPct: 1.95, cd: 2.35, skillType: 'direct', realmGroup: 4 },
  st_jimie: { name: '寂灭印', dmgPct: 2.2, cd: 2.5, skillType: 'direct', realmGroup: 5 },
  st_jiuxiao: { name: '九霄雷狱', dmgPct: 2.45, cd: 2.7, skillType: 'direct', realmGroup: 6 },
  st_wanjie: { name: '万劫斩', dmgPct: 2.7, cd: 2.85, skillType: 'direct', realmGroup: 7 },
  st_jiehuo: { name: '劫火噬', dmgPct: 2.92, cd: 3.0, skillType: 'direct', realmGroup: 8 },
  st_xianyi: { name: '仙意破军', dmgPct: 3.15, cd: 3.1, skillType: 'direct', realmGroup: 9 },
  st_jinque: { name: '金阙斩', dmgPct: 3.36, cd: 3.2, skillType: 'direct', realmGroup: 10 },
  st_taiyi: { name: '太乙诛邪', dmgPct: 3.58, cd: 3.35, skillType: 'direct', realmGroup: 11 },
  st_daluo: { name: '大罗天灾', dmgPct: 3.78, cd: 3.5, skillType: 'direct', realmGroup: 12 },
  st_wandao: { name: '万道归一', dmgPct: 4.05, cd: 3.7, skillType: 'direct', realmGroup: 13 },
};

export const MONSTER_CODEX = (() => {
  const defs = [
    { chapter: '炼气', regular: { name: '灰鬃狼妖', title: '山谷边缘的噬血妖狼', artType: 'wolf', aura: '灰金', lore: '常年盘踞在野狼谷外围，嗅到血气便会成群扑来。' }, boss: { name: '噬月狼王', title: '月下啸聚的狼谷首领', artType: 'wolf_king', aura: '赤金', lore: '吞食同类而成王，利爪与獠牙在夜色中最先显现。' } },
    { chapter: '筑基', regular: { name: '残剑灵', title: '剑墟中苏醒的残兵之灵', artType: 'sword_spirit', aura: '银青', lore: '剑阁残意化灵，受惊后会催动断剑掠杀来者。' }, boss: { name: '断岳剑主', title: '守着旧剑意的墟中剑主', artType: 'sword_lord', aura: '冷银', lore: '其身已灭，唯剑意未灭，仍守在剑墟深处。' } },
    { chapter: '结丹', regular: { name: '炽骨魔', title: '熔洞中游荡的火骨妖躯', artType: 'flame_fiend', aura: '炎赤', lore: '骨骼如炭，内火不息，所过之处热浪翻卷。' }, boss: { name: '熔心魔君', title: '以熔火为心核的洞府魔首', artType: 'flame_lord', aura: '赤橙', lore: '深藏火云洞内，躯体在烈焰中不断重塑。' } },
    { chapter: '元婴', regular: { name: '霜牙雪魈', title: '冰渊深处的寒魈', artType: 'ice_beast', aura: '霜蓝', lore: '常伏于冰层之后，破冰而出时寒气逼骨。' }, boss: { name: '寒魄雪主', title: '凝聚极寒之息的雪魄首领', artType: 'ice_king', aura: '冰白', lore: '其息所过，连法器都能冻结成霜。' } },
    { chapter: '化神', regular: { name: '雷羽玄鹏', title: '雷泽中盘旋的雷羽异禽', artType: 'thunder_bird', aura: '雷紫', lore: '振翅时电芒缠羽，俯冲速度快若惊雷。' }, boss: { name: '天雷鹏王', title: '掌驭雷霆的泽域霸主', artType: 'thunder_king', aura: '明紫', lore: '其啼声能引动天雷，震得山泽俱鸣。' } },
    { chapter: '炼虚', regular: { name: '裂隙魔眼', title: '虚空裂隙中的窥视者', artType: 'void_eye', aura: '幽蓝', lore: '常以巨眼现身，周围空间会泛起轻微折痕。' }, boss: { name: '空冥主眼', title: '深渊尽头的虚空瞳主', artType: 'void_overlord', aura: '幽青', lore: '据说被其注视者，连神魂都会短暂迟滞。' } },
    { chapter: '合体', regular: { name: '荒原石傀', title: '由万灵原野碎岩凝成的傀身', artType: 'stone_golem', aura: '土褐', lore: '灵气混杂地脉所生，行动迟缓但躯体沉重。' }, boss: { name: '归一岩君', title: '将百岩炼为一身的石魁首', artType: 'stone_king', aura: '岩金', lore: '躯壳如岳，举手落地都似山崩。' } },
    { chapter: '大乘', regular: { name: '星阙灵蛇', title: '游走在天门星辉中的灵蛇', artType: 'celestial_serpent', aura: '星青', lore: '借星辉腾挪，身形修长，常在高空俯视来者。' }, boss: { name: '巡天玄螭', title: '天阙深处的古老巡天兽', artType: 'celestial_dragon', aura: '星金', lore: '它盘绕云阙而居，目光如寒星垂落。' } },
    { chapter: '渡劫', regular: { name: '劫火尸王', title: '在劫云下复苏的尸王', artType: 'corpse_king', aura: '暗赤', lore: '每逢雷霆交击，便从焦土之中站起。' }, boss: { name: '天罚尸尊', title: '被雷劫淬炼而不灭的尸尊', artType: 'corpse_emperor', aura: '血紫', lore: '其残躯长期承受天罚，反而孕出异变之力。' } },
    { chapter: '真仙', regular: { name: '云庭幻狐', title: '仙庭云径中的幻形妖狐', artType: 'spirit_fox', aura: '月白', lore: '善以幻影乱心，真正的身躯往往藏在最后。' }, boss: { name: '九尾云尊', title: '披云踏月的仙狐之尊', artType: 'fox_queen', aura: '银白', lore: '九尾齐展时，整片云庭都会泛起月色。' } },
    { chapter: '金仙', regular: { name: '金乌残灵', title: '坠入金阙的古乌残灵', artType: 'gold_crow', aura: '曜金', lore: '羽端仍带残阳之火，振翅会留下灼热金痕。' }, boss: { name: '曜阳乌皇', title: '守着昔日天火的乌皇', artType: 'sun_crow', aura: '灿金', lore: '传闻曾随古日而行，如今只剩一缕天炎未熄。' } },
    { chapter: '太乙', regular: { name: '太乙莲魄', title: '法阵中凝出的青莲之魄', artType: 'lotus_spirit', aura: '青碧', lore: '看似静止不动，实则每一瓣莲影都暗藏锋芒。' }, boss: { name: '玄天莲尊', title: '坐镇万象宫的莲尊化影', artType: 'lotus_queen', aura: '青金', lore: '法阵运转时，它会在莲影中心缓缓睁眼。' } },
    { chapter: '大罗', regular: { name: '星海古鲸', title: '漂游在寂灭星海的古鲸', artType: 'star_whale', aura: '星蓝', lore: '其影横渡虚空，像是一整片星海在缓缓游动。' }, boss: { name: '寂灭鲸祖', title: '深空尽头的古鲸始祖', artType: 'whale_king', aura: '深蓝', lore: '巨躯穿行时，四周星光都会被它吞没。' } },
    { chapter: '道祖', regular: { name: '混元古龙', title: '万道震荡中诞生的古龙影', artType: 'chaos_dragon', aura: '混金', lore: '身披混元流光，呼吸间似有万道回响。' }, boss: { name: '万道龙祖', title: '道场尽头盘踞的龙祖真影', artType: 'dao_dragon', aura: '道金', lore: '传闻其一鳞一爪，皆能映出一条完整大道。' } },
  ];
  const out = [];
  defs.forEach((cfg, groupIdx) => {
    out.push({ id: `monster_${groupIdx}_normal`, groupIdx, chapter: cfg.chapter, isBoss: false, habitat: `${cfg.chapter}历练`, ...cfg.regular });
    out.push({ id: `monster_${groupIdx}_boss`, groupIdx, chapter: cfg.chapter, isBoss: true, habitat: `${cfg.chapter}历练首领层`, ...cfg.boss });
  });
  return out;
})();

export const EQUIPS = {
  bamboo_sword: { name: '青竹剑', slot: 'weapon', atk: 8, def: 0, spd: 2 },
  iron_sword: { name: '玄铁剑', slot: 'weapon', atk: 18, def: 0, spd: 3 },
  jade_ring: { name: '青玉戒', slot: 'ring', atk: 0, def: 4, spd: 4 },
  bronze_ring: { name: '青铜戒', slot: 'ring', atk: 3, def: 2, spd: 2 },
  cloth_robe: { name: '素衣', slot: 'robe', atk: 0, def: 6, spd: 0 },
  silk_robe: { name: '云丝袍', slot: 'robe', atk: 0, def: 12, spd: 1 },
};

export const BREAK_MATS = REALM_GROUPS.map((name, idx) => ({ id: `break_mat_${idx}`, name: `${name}突破材料` }));
export const BREAK_DANS = REALM_GROUPS.map((name, idx) => ({ id: `break_dan_${idx}`, name: `${name}丹`, groupIdx: idx }));
export const RECIPE_ITEMS = [];
export const RECIPES = {};

export const ITEMS = {
  huiling: { name: '回灵丹', icon: '🌿', type: 'dan', desc: '恢复30%气血' },
  teleport: { name: '传送符', icon: '🪬', type: 'fu', desc: '立即撤离并带回战利品' },
  bamboo_sword: { name: '青竹剑', icon: '🗡️', type: 'equip', slot: 'weapon', desc: '攻+8 速+2' },
  iron_sword: { name: '玄铁剑', icon: '🗡️', type: 'equip', slot: 'weapon', desc: '攻+18 速+3' },
  jade_ring: { name: '青玉戒', icon: '💍', type: 'equip', slot: 'ring', desc: '防+4 速+4' },
  bronze_ring: { name: '青铜戒', icon: '💍', type: 'equip', slot: 'ring', desc: '攻+3 防+2 速+2' },
  cloth_robe: { name: '素衣', icon: '🥋', type: 'equip', slot: 'robe', desc: '防+6' },
  silk_robe: { name: '云丝袍', icon: '🥋', type: 'equip', slot: 'robe', desc: '防+12 速+1' },
  herb: { name: '灵草', icon: '🌿', type: 'mat', desc: '历练材料' },
  dew: { name: '灵露', icon: '💧', type: 'mat', desc: '历练材料' },
  water: { name: '清泉水', icon: '🫧', type: 'mat', desc: '历练材料' },
};
BREAK_MATS.forEach((m) => {
  ITEMS[m.id] = { name: m.name, icon: '🧱', type: 'mat', desc: '突破材料' };
});
BREAK_DANS.forEach((d) => {
  ITEMS[d.id] = { name: d.name, icon: '🧪', type: 'dan', desc: '破境时消耗' };
});

export const DUNGEONS = REALMS.map((realm) => ({
  id: realm.idx + 1,
  chapter: realm.groupName,
  stage: realm.stageName,
  stageIdx: realm.stageIdx,
  name: realm.dungeonName,
  groupIdx: realm.groupIdx,
  realmIdx: realm.idx,
  floors: 10,
  enemyBase: 60 + realm.groupIdx * 40 + realm.stageIdx * 20,
}));
