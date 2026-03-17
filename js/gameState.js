import { storage } from './storage';
import { REALMS, REALM_GROUPS, CAVE_LEVELS, ITEMS, SHENGTONG, EQUIPS, RECIPES, DUNGEONS, BREAK_MATS, BREAK_DANS } from './data';

export const gameState = {
  state: null,

  init() {
    this.state = storage.load();
    this.refreshDerived();
  },

  save() {
    if (this.state) {
      storage.save(this.state);
    }
  },

  // 计算派生属性（战力、境界名、修为百分比等）
  refreshDerived() {
    const s = this.state;
    // 兼容旧存档：缺少新字段时补全默认值
    if (!s.bag) s.bag = [];
    if (!s.equip) s.equip = { weapon: null, robe: null, ring: null };
    if (!s.shengtong) s.shengtong = [{ id: 'thunder', lv: 1, frag: 0 }];
    if (!Array.isArray(s.equippedSt)) s.equippedSt = ['thunder'];
    if (s.equippedSt.length < 6) {
      while (s.equippedSt.length < 6) s.equippedSt.push(null);
    }
    if (s.equippedSt.length > 6) s.equippedSt = s.equippedSt.slice(0, 6);
    if (!Array.isArray(s.recipesKnown)) s.recipesKnown = ['juling', 'huiling'];
    if (!s.guide) s.guide = { firstDungeon: false, firstBattle: false, firstAlchemy: false };
    if (!Array.isArray(s.titles)) s.titles = [];
    if (!s.currentTitle) s.currentTitle = null;
    if (typeof s.hp !== 'number') s.hp = 300;
    if (typeof s.maxHp !== 'number') s.maxHp = 300;
    if (typeof s.shaqi !== 'number') s.shaqi = 0;
    if (typeof s.killCount !== 'number') s.killCount = 0;
    if (typeof s.breakFailCount !== 'number') s.breakFailCount = 0;
    if (typeof s.breakCooldownUntil !== 'number') s.breakCooldownUntil = 0;
    if (!s.cave) {
      s.cave = { lv: 1, alchemySlots: [null, null, null], alchemyStart: null, alchemyRecipeId: null, idle: { startTime: Date.now() } };
    } else {
      if (!s.cave.idle) s.cave.idle = { startTime: Date.now() };
      if (!s.cave.alchemySlots) s.cave.alchemySlots = [null, null, null];
      if (s.cave.alchemyFireLv) delete s.cave.alchemyFireLv;
      if (s.cave.idle && s.cave.idle.servantId) delete s.cave.idle.servantId;
    }
    if (!s.cave.servants) s.cave.servants = { mine: 5, herb: 5 };
    if (!Array.isArray(s.cave.seeds)) s.cave.seeds = [];
    if (!s.dungeonProgress) s.dungeonProgress = { dungeonIdx: 0, floor: 0 };
    if (!s.bossDrops) s.bossDrops = {};
    const realm = REALMS[s.realmIdx];
    s.realmName = realm.name;
    s.xpNeed = realm.xpNeed;
    s.xpPct = s.xpNeed === Infinity ? 100 : Math.floor(s.xp / s.xpNeed * 100);

    // 总攻防 = 基础 + 境界加成
    let equipAtk = 0;
    let equipDef = 0;
    let equipSpd = 0;
    Object.values(s.equip).forEach((id) => {
      if (!id) return;
      const cfg = EQUIPS[id];
      if (!cfg) return;
      equipAtk += cfg.atk || 0;
      equipDef += cfg.def || 0;
      equipSpd += cfg.spd || 0;
    });

    s.totalAtk = s.atk + realm.atkBonus + equipAtk;
    s.totalDef = s.def + realm.defBonus + equipDef;
    s.totalSpd = s.spd + equipSpd;

    const baseHp = 200 + s.totalDef * 2 + (s.realmIdx || 0) * 20;
    s.maxHp = Math.max(1, Math.floor(baseHp));
    if (s.hp > s.maxHp) s.hp = s.maxHp;

    // 洞府修炼速度
    const caveLv = CAVE_LEVELS[Math.min(s.cave.lv - 1, CAVE_LEVELS.length - 1)];
    s.xpPerHour = caveLv.xpPerHour;
    s.stonePerHour = caveLv.stonePerHour;
  },

  // 离线挂机结算
  calcOffline() {
    this.state = storage.load();
    const s = this.state;
    const now = Date.now();
    const offlineSec = (now - s.lastOnline) / 1000;

    if (offlineSec > 10) {
      const hours = offlineSec / 3600;
      const caveLv = CAVE_LEVELS[Math.min(s.cave.lv - 1, CAVE_LEVELS.length - 1)];

      // 离线修为
      s.xp += Math.floor(caveLv.xpPerHour * hours);

      // 尝试自动突破（修为满了自动升）
      this.tryAutoBreak();
    }

    s.lastOnline = now;
    this.refreshDerived();
    storage.save(s);
  },

  tryAutoBreak() {
    const s = this.state;
    while (s.realmIdx < REALMS.length - 1 && s.xp >= REALMS[s.realmIdx].xpNeed) {
      s.xp -= REALMS[s.realmIdx].xpNeed;
      s.realmIdx++;
    }
  },

  // 每帧update（实时修炼）
  _lastTick: 0,
  update() {
    if (!this.state) return;
    const now = Date.now();
    if (this._lastTick === 0) { this._lastTick = now; return; }

    const deltaSec = (now - this._lastTick) / 1000;
    this._lastTick = now;

    const s = this.state;
    const caveLv = CAVE_LEVELS[Math.min(s.cave.lv - 1, CAVE_LEVELS.length - 1)];

    // 实时累积修为（灵石通过灵矿领取）
    s.xp += caveLv.xpPerHour / 3600 * deltaSec;

    this.tryAutoBreak();
    this.refreshDerived();

    // 每30秒自动存档
    if (!this._lastSave || now - this._lastSave > 30000) {
      storage.save(s);
      this._lastSave = now;
    }
  },

  // ===== 洞府挂机：灵仆加成与领取 =====
  getCaveIdleReward() {
    const s = this.state;
    const idle = s.cave.idle;
    if (!idle || !idle.startTime) return null;

    const elapsedHours = (Date.now() - idle.startTime) / 3600000;
    if (elapsedHours <= 0) return null;

    const caveLv = CAVE_LEVELS[Math.min(s.cave.lv - 1, CAVE_LEVELS.length - 1)];
    const servants = s.cave.servants || { mine: 0, herb: 0 };
    const totalServants = s.cave.lv * 10;
    const mineCount = Math.max(0, Math.min(servants.mine, totalServants));
    const herbCount = Math.max(0, Math.min(servants.herb, totalServants - mineCount));

    const baseStone = caveLv.stonePerHour * elapsedHours * (0.4 + mineCount * 0.06);
    const baseMat = elapsedHours * (0.5 + herbCount * 0.06);

    const seeds = s.cave.seeds || [];
    const hasRare = seeds.includes('lingzhi') || seeds.includes('xuanbing') || seeds.includes('huoling');
    const rareBase = elapsedHours * (hasRare ? 0.03 + herbCount * 0.005 : 0);

    return {
      hours: elapsedHours,
      stone: Math.floor(baseStone),
      matCount: Math.floor(baseMat),
      rareCount: Math.floor(rareBase),
      mineCount,
      herbCount,
      totalServants,
    };
  },

  claimCaveIdle() {
    const reward = this.getCaveIdleReward();
    if (!reward) return null;
    const s = this.state;

    s.stone += reward.stone;
    this._rollMaterials(reward.matCount, reward.rareCount);

    s.cave.idle.startTime = Date.now();
    this.refreshDerived();
    storage.save(s);
    return reward;
  },

  getTotalServants() {
    const s = this.state;
    return s.cave.lv * 10;
  },

  adjustServants({ mineDelta = 0, herbDelta = 0 }) {
    const s = this.state;
    const total = this.getTotalServants();
    let mine = s.cave.servants?.mine || 0;
    let herb = s.cave.servants?.herb || 0;
    mine = Math.max(0, mine + mineDelta);
    herb = Math.max(0, herb + herbDelta);
    if (mine + herb > total) {
      const overflow = mine + herb - total;
      if (herbDelta > 0) herb = Math.max(0, herb - overflow);
      else mine = Math.max(0, mine - overflow);
    }
    s.cave.servants = { mine, herb };
    storage.save(s);
    return s.cave.servants;
  },

  _rollMaterials(count, rareCount) {
    const commonPool = ['herb', 'dew', 'water'];
    const rarePool = ['lingzhi', 'xuanbing', 'huoling'];
    for (let i = 0; i < count; i++) {
      const item = commonPool[Math.floor(Math.random() * commonPool.length)];
      this.addItem(item, 1);
    }
    const s = this.state;
    const seeds = s.cave.seeds || [];
    const availableRare = rarePool.filter(id => seeds.includes(id));
    for (let i = 0; i < rareCount; i++) {
      const pool = availableRare.length ? availableRare : rarePool;
      const item = pool[Math.floor(Math.random() * pool.length)];
      this.addItem(item, 1);
    }
  },

  // 试炼关卡：可挑战列表（按当前境界和进度过滤）
  getAvailableDungeons() {
    const s = this.state;
    const idx = s.dungeonProgress?.dungeonIdx || 0;
    return DUNGEONS.map((d, i) => ({
      ...d,
      canSee: true,
      canChallenge: i <= idx,
      isCleared: i < idx,
    })).filter(d => d.canSee);
  },

  // 背包：添加道具
  addItem(id, count) {
    const s = this.state;
    const existing = s.bag.find(i => i.id === id);
    if (existing) {
      existing.count += count;
    } else {
      s.bag.push({ id, count });
    }
  },

  // 背包：消耗道具
  useItem(id, count) {
    const s = this.state;
    const existing = s.bag.find(i => i.id === id);
    if (!existing || existing.count < count) return false;
    existing.count -= count;
    if (existing.count <= 0) {
      s.bag = s.bag.filter(i => i.id !== id);
    }
    return true;
  },

  useRecipeItem(itemId) {
    const s = this.state;
    const item = ITEMS[itemId];
    if (!item || item.type !== 'recipe') return { ok: false, msg: '丹方无效' };
    const ok = this.useItem(itemId, 1);
    if (!ok) return { ok: false, msg: '丹方不足' };
    if (!s.recipesKnown.includes(item.recipeId)) {
      s.recipesKnown.push(item.recipeId);
    }
    storage.save(s);
    return { ok: true, msg: `已习得「${item.name}」` };
  },

  useSeedItem(itemId) {
    const s = this.state;
    const item = ITEMS[itemId];
    if (!item || item.type !== 'seed') return { ok: false, msg: '种子无效' };
    const ok = this.useItem(itemId, 1);
    if (!ok) return { ok: false, msg: '种子不足' };
    if (!s.cave.seeds.includes(item.seedId)) {
      s.cave.seeds.push(item.seedId);
    }
    storage.save(s);
    return { ok: true, msg: `药园解锁「${item.name}」` };
  },

  addTitle(title) {
    const s = this.state;
    if (!s.titles.includes(title)) {
      s.titles.push(title);
      s.currentTitle = title;
      storage.save(s);
    }
  },

  // 装备：穿戴或卸下
  toggleEquipItem(itemId) {
    const s = this.state;
    const itemCfg = ITEMS[itemId];
    if (!itemCfg || itemCfg.type !== 'equip') return false;
    const slot = itemCfg.slot;
    if (!slot) return false;

    // 已装备则卸下
    if (s.equip[slot] === itemId) {
      s.equip[slot] = null;
      this.addItem(itemId, 1);
      this.refreshDerived();
      storage.save(s);
      return true;
    }

    // 背包里需要有该装备
    const ok = this.useItem(itemId, 1);
    if (!ok) return false;

    // 若槽位已有装备，放回背包
    if (s.equip[slot]) {
      this.addItem(s.equip[slot], 1);
    }
    s.equip[slot] = itemId;
    this.refreshDerived();
    storage.save(s);
    return true;
  },

  // 丹药：使用（仅处理修为类）
  useDanItem(itemId) {
    const s = this.state;
    if (itemId.startsWith('break_dan_')) {
      return { ok: false, msg: '突破丹需在破境时使用' };
    }
    const recipe = RECIPES[itemId];
    if (!recipe || !recipe.effect) return { ok: false, msg: '该丹药无法直接使用' };
    const ok = this.useItem(itemId, 1);
    if (!ok) return { ok: false, msg: '丹药不足' };

    if (recipe.effect.xp) {
      s.xp += recipe.effect.xp;
      this.tryAutoBreak();
      this.refreshDerived();
      storage.save(s);
      return { ok: true, msg: `服用成功，修为+${recipe.effect.xp}` };
    }

    return { ok: false, msg: '该丹药只能在战斗中使用' };
  },

  // 炼丹：开始
  startAlchemy(recipeId) {
    const s = this.state;
    if (s.cave.alchemyRecipeId) return { ok: false, msg: '丹炉正忙' };
    const recipe = RECIPES[recipeId];
    if (!recipe) return { ok: false, msg: '丹方无效' };

    // 检查材料
    const mats = recipe.mats || {};
    const canCraft = Object.keys(mats).every((id) => {
      const it = s.bag.find(x => x.id === id);
      return it && it.count >= mats[id];
    });
    if (!canCraft) return { ok: false, msg: '材料不足' };

    // 扣材料
    Object.keys(mats).forEach((id) => {
      this.useItem(id, mats[id]);
    });

    s.cave.alchemyStart = Date.now();
    s.cave.alchemyRecipeId = recipeId;
    storage.save(s);
    return { ok: true, msg: '丹炉已点火' };
  },

  // 炼丹：状态
  getAlchemyStatus() {
    const s = this.state;
    if (!s.cave.alchemyRecipeId) return null;
    const recipe = RECIPES[s.cave.alchemyRecipeId];
    if (!recipe) return null;
    const outCount = recipe.output?.count || 1;
    const durationMs = outCount * 1000;
    const elapsed = Date.now() - s.cave.alchemyStart;
    const done = elapsed >= durationMs;
    return {
      recipeId: s.cave.alchemyRecipeId,
      done,
      remainingMs: Math.max(0, durationMs - elapsed),
    };
  },

  // 炼丹：收丹
  claimAlchemy() {
    const s = this.state;
    const status = this.getAlchemyStatus();
    if (!status || !status.done) return { ok: false, msg: '丹炉尚未完成' };
    const recipe = RECIPES[status.recipeId];
    const out = recipe.output || { id: status.recipeId, count: 1 };
    this.addItem(out.id, out.count || 1);
    s.cave.alchemyRecipeId = null;
    s.cave.alchemyStart = null;
    storage.save(s);
    return { ok: true, msg: `出炉「${ITEMS[out.id]?.name || out.id}」×${out.count || 1}` };
  },

  // 炼丹：切换火候（已移除）

  equipStToSlot(stId, slotIdx = null) {
    const s = this.state;
    if (!Array.isArray(s.equippedSt)) s.equippedSt = ['thunder'];
    if (s.equippedSt.length < 6) {
      while (s.equippedSt.length < 6) s.equippedSt.push(null);
    }
    if (s.equippedSt.length > 6) s.equippedSt = s.equippedSt.slice(0, 6);
    for (let i = 0; i < s.equippedSt.length; i++) {
      if (s.equippedSt[i] === stId) s.equippedSt[i] = null;
    }
    let target = slotIdx;
    if (target === null) {
      target = s.equippedSt.findIndex(x => !x);
    }
    if (target === -1 || target === null || target === undefined) return { ok: false, msg: '装配槽已满' };
    s.equippedSt[target] = stId;
    storage.save(s);
    return { ok: true, msg: '已装配' };
  },

  removeStFromSlot(slotIdx) {
    const s = this.state;
    if (!Array.isArray(s.equippedSt)) return { ok: false, msg: '无可移除神通' };
    if (slotIdx < 0 || slotIdx >= s.equippedSt.length) return { ok: false, msg: '无效位置' };
    s.equippedSt[slotIdx] = null;
    storage.save(s);
    return { ok: true, msg: '已移除' };
  },

  upgradeSt(stId) {
    const s = this.state;
    const st = s.shengtong.find(t => t.id === stId);
    if (!st) return { ok: false, msg: '未掌握该神通' };
    const cfg = SHENGTONG[stId];
    const needFrag = cfg.fragNeed[st.lv];
    if (!needFrag || st.frag < needFrag) return { ok: false, msg: '碎片不足' };
    const cost = 100 + st.lv * 200;
    if (s.stone < cost) return { ok: false, msg: '灵石不足' };
    st.frag -= needFrag;
    st.lv += 1;
    s.stone -= cost;
    storage.save(s);
    return { ok: true, msg: `升级成功（消耗灵石 ${cost}）` };
  },

  addKill(count = 1) {
    const s = this.state;
    s.killCount += count;
    const before = Math.floor((s.killCount - count) / 100);
    const after = Math.floor(s.killCount / 100);
    if (after > before) {
      s.shaqi = s.shaqi + (after - before);
    }
  },

  onDeath() {
    const s = this.state;
    s.shaqi = Math.max(0, s.shaqi - 2);
    storage.save(s);
  },

  getBreakDanId() {
    const s = this.state;
    const groupIdx = Math.floor(s.realmIdx / 3);
    return BREAK_DANS[groupIdx]?.id;
  },

  // 突破境界
  breakThrough() {
    const s = this.state;
    if (s.realmIdx >= REALMS.length - 1) return { ok: false, msg: '已是最高境界' };
    if (s.xp < s.xpNeed) return { ok: false, msg: '修为不足' };
    if (s.breakCooldownUntil && Date.now() < s.breakCooldownUntil) return { ok: false, msg: '突破冷却中' };

    // 突破成功率 基础60% + 丹药加成
    const danId = this.getBreakDanId();
    if (!danId || !s.bag.find(i => i.id === danId)) return { ok: false, msg: '缺少突破丹' };

    let baseRate = 0.1 + s.breakFailCount * 0.05;
    baseRate = Math.min(baseRate, 0.5);
    const rate = Math.min(baseRate + 0.5, 1);

    this.useItem(danId, 1);
    const success = Math.random() < rate;
    if (success) {
      s.xp = 0;
      s.realmIdx++;
      s.breakFailCount = 0;
      s.breakCooldownUntil = 0;
      this.refreshDerived();
      storage.save(s);
      return { ok: true, msg: '突破成功！' };
    } else {
      s.breakFailCount += 1;
      s.breakCooldownUntil = Date.now() + 3600000;
      storage.save(s);
      return { ok: false, msg: '突破失败，进入冷却' };
    }
  },

  skipBreakCooldownWithAd(cb) {
    const s = this.state;
    if (!s.breakCooldownUntil || Date.now() >= s.breakCooldownUntil) {
      cb && cb(false, '当前无需跳过冷却');
      return;
    }
    wx.createRewardedVideoAd({ adUnitId: 'your-ad-unit-id' })
      .then(ad => ad.show())
      .then(() => {
        s.breakCooldownUntil = 0;
        storage.save(s);
        cb && cb(true, '冷却已清除');
      })
      .catch(() => {
        s.breakCooldownUntil = 0;
        storage.save(s);
        cb && cb(true, '冷却已清除');
      });
  },

  // 洞府升级
  upgradeCave() {
    const s = this.state;
    const nextLv = s.cave.lv + 1;
    if (nextLv > CAVE_LEVELS.length) return { ok: false, msg: '已是最高等级' };
    const cost = CAVE_LEVELS[s.cave.lv - 1].upgradeCost;
    if (s.stone < cost) return { ok: false, msg: '灵石不足' };
    s.stone -= cost;
    s.cave.lv = nextLv;
    const total = this.getTotalServants();
    const mine = s.cave.servants?.mine || 0;
    const herb = s.cave.servants?.herb || 0;
    if (mine + herb > total) {
      const overflow = mine + herb - total;
      s.cave.servants.mine = Math.max(0, mine - overflow);
    }
    this.refreshDerived();
    storage.save(s);
    return { ok: true, msg: '洞府升级成功！' };
  },
};
