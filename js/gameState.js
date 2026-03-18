import { storage } from './storage';
import {
  REALMS,
  REALM_GROUPS,
  ITEMS,
  SHENGTONG,
  EQUIPS,
  RECIPES,
  DUNGEONS,
  BREAK_DANS,
  ST_LEVEL_NAMES,
  ST_LEVEL_UP_USE_NEED,
  ST_LEVEL_POWER_MUL,
  MONSTER_CODEX,
} from './data';

export const gameState = {
  state: null,

  init() {
    this.state = storage.load();
    this.refreshDerived();
  },

  save() {
    if (this.state) storage.save(this.state);
  },

  refreshDerived() {
    const s = this.state;
    if (!s.bag) s.bag = [];
    if (!s.equip) s.equip = { weapon: null, robe: null, ring: null };
    if (!Array.isArray(s.shengtong)) s.shengtong = [{ id: 'st_guiyuan', lv: 1, totalUses: 0 }];
    if (!Array.isArray(s.equippedSt)) s.equippedSt = ['st_guiyuan', null, null];
    while (s.equippedSt.length < 3) s.equippedSt.push(null);
    if (s.equippedSt.length > 3) s.equippedSt = s.equippedSt.slice(0, 3);
    if (!s.guide) s.guide = { firstDungeon: false, firstBattle: false };
    if (!s.cave) s.cave = { stageFocus: 'achieve' };
    if (!s.dungeonProgress) s.dungeonProgress = { dungeonIdx: 0, floor: 0 };
    if (!s.bossDrops || typeof s.bossDrops !== 'object') s.bossDrops = {};
    if (!s.achieveClaimed || typeof s.achieveClaimed !== 'object') s.achieveClaimed = {};
    if (!s.bestiarySeen || typeof s.bestiarySeen !== 'object') s.bestiarySeen = {};
    if (!Array.isArray(s.titles)) s.titles = [];

    s.realmIdx = Math.max(0, Math.min(REALMS.length - 1, Math.floor(s.realmIdx || 0)));
    s.xp = Math.max(0, Math.floor(s.xp || 0));
    s.killCount = Math.max(0, Math.floor(s.killCount || 0));
    s.breakFailCount = Math.max(0, Math.floor(s.breakFailCount || 0));
    s.breakCooldownUntil = Math.max(0, Math.floor(s.breakCooldownUntil || 0));
    s.stone = Math.max(0, Math.floor(s.stone || 0));
    s.atk = Math.max(1, Math.floor(s.atk || 100));
    s.def = Math.max(0, Math.floor(s.def || 50));
    s.spd = Math.max(1, Math.floor(s.spd || 80));

    const realm = REALMS[s.realmIdx];
    const realmGroup = realm.groupIdx;
    const unlockedIds = Object.keys(SHENGTONG)
      .filter((id) => SHENGTONG[id].realmGroup <= realmGroup)
      .sort((a, b) => SHENGTONG[a].realmGroup - SHENGTONG[b].realmGroup);

    const byId = new Map();
    s.shengtong.forEach((st) => {
      if (!SHENGTONG[st.id]) return;
      byId.set(st.id, {
        id: st.id,
        lv: Math.max(1, Math.min(ST_LEVEL_NAMES.length, Math.floor(st.lv || 1))),
        totalUses: Math.max(0, Math.floor(st.totalUses || 0)),
      });
    });
    unlockedIds.forEach((id) => {
      if (!byId.has(id)) byId.set(id, { id, lv: 1, totalUses: 0 });
    });
    if (!byId.has('st_guiyuan')) byId.set('st_guiyuan', { id: 'st_guiyuan', lv: 1, totalUses: 0 });
    s.shengtong = Array.from(byId.values()).sort((a, b) => SHENGTONG[a.id].realmGroup - SHENGTONG[b.id].realmGroup);

    s.equippedSt = s.equippedSt
      .map((id) => (id && byId.has(id) ? id : null))
      .slice(0, 3);
    while (s.equippedSt.length < 3) s.equippedSt.push(null);
    if (!s.equippedSt.some(Boolean)) s.equippedSt[0] = 'st_guiyuan';

    let equipAtk = 0;
    let equipDef = 0;
    let equipSpd = 0;
    Object.values(s.equip).forEach((id) => {
      const cfg = id ? EQUIPS[id] : null;
      if (!cfg) return;
      equipAtk += cfg.atk || 0;
      equipDef += cfg.def || 0;
      equipSpd += cfg.spd || 0;
    });

    s.realmName = realm.name;
    s.realmDisplayName = realm.name;
    s.xpNeed = realm.xpNeed;
    s.xp = Math.min(s.xp, s.xpNeed);
    s.xpPct = Math.floor((s.xp / Math.max(1, s.xpNeed)) * 100);
    s.canBreak = realm.stageIdx === 2 && s.xp >= s.xpNeed && s.realmIdx < REALMS.length - 1;
    s.totalAtk = s.atk + realm.atkBonus + equipAtk;
    s.totalDef = s.def + realm.defBonus + equipDef;
    s.totalSpd = s.spd + realm.spdBonus + equipSpd;
    s.maxHp = Math.max(1, Math.floor(180 + s.totalDef * 2 + realm.hpBonus));
    s.hp = Math.max(0, Math.min(Math.floor(s.hp || s.maxHp), s.maxHp));
  },

  update() {
    if (!this.state) return;
    if (!this._lastSave || Date.now() - this._lastSave > 30000) {
      storage.save(this.state);
      this._lastSave = Date.now();
    }
  },

  calcOffline() {
    this.state = storage.load();
    this.refreshDerived();
    this.state.lastOnline = Date.now();
    storage.save(this.state);
  },

  gainXp(amount) {
    const s = this.state;
    let add = Math.max(0, Math.floor(amount || 0));
    if (add <= 0) return { gained: 0, advanced: [] };
    const advanced = [];
    while (add > 0) {
      const realm = REALMS[s.realmIdx];
      const need = Math.max(1, realm.xpNeed - s.xp);
      const use = Math.min(add, need);
      s.xp += use;
      add -= use;
      if (s.xp >= realm.xpNeed) {
        if (realm.stageIdx < 2 && s.realmIdx < REALMS.length - 1) {
          s.realmIdx += 1;
          s.xp = 0;
          advanced.push(REALMS[s.realmIdx].name);
          continue;
        }
        s.xp = realm.xpNeed;
        break;
      }
    }
    this.refreshDerived();
    this.save();
    return { gained: Math.max(0, Math.floor(amount || 0)), advanced };
  },

  tryAutoBreak() {
    return { ok: false, msg: '当前版本不再使用自动挂机突破' };
  },

  unlockMonsterCodex(id) {
    const s = this.state;
    if (!id) return false;
    if (s.bestiarySeen[id]) return false;
    s.bestiarySeen[id] = Date.now();
    this.save();
    return true;
  },

  isMonsterUnlocked(id) {
    return !!(this.state?.bestiarySeen || {})[id];
  },

  getMonsterCodexRows() {
    const seen = this.state?.bestiarySeen || {};
    return MONSTER_CODEX.map((row) => ({
      ...row,
      unlocked: !!seen[row.id],
      seenAt: seen[row.id] || 0,
    }));
  },

  getAvailableDungeons() {
    const idx = this.state.dungeonProgress?.dungeonIdx || 0;
    return DUNGEONS.map((d, i) => ({
      ...d,
      canSee: true,
      canChallenge: i <= idx,
      isCleared: i < idx,
    }));
  },

  addItem(id, count) {
    const s = this.state;
    if (!id || !count) return;
    const existing = s.bag.find((i) => i.id === id);
    if (existing) existing.count += count;
    else s.bag.push({ id, count });
  },

  useItem(id, count) {
    const s = this.state;
    const existing = s.bag.find((i) => i.id === id);
    if (!existing || existing.count < count) return false;
    existing.count -= count;
    if (existing.count <= 0) s.bag = s.bag.filter((i) => i.id !== id);
    return true;
  },

  useDanItem(itemId) {
    if (itemId.startsWith('break_dan_')) return { ok: false, msg: '突破丹需在破境时使用' };
    if (itemId === 'huiling') return { ok: false, msg: '回灵丹需在探索或战斗中使用' };
    return { ok: false, msg: '当前无法直接使用该物品' };
  },

  useRecipeItem() {
    return { ok: false, msg: '当前版本不再使用丹方系统' };
  },

  useSeedItem() {
    return { ok: false, msg: '当前版本不再使用药园种子系统' };
  },

  toggleEquipItem(itemId) {
    const s = this.state;
    const itemCfg = ITEMS[itemId];
    if (!itemCfg || itemCfg.type !== 'equip') return false;
    const slot = itemCfg.slot;
    if (s.equip[slot] === itemId) {
      s.equip[slot] = null;
      this.addItem(itemId, 1);
      this.refreshDerived();
      this.save();
      return true;
    }
    const ok = this.useItem(itemId, 1);
    if (!ok) return false;
    if (s.equip[slot]) this.addItem(s.equip[slot], 1);
    s.equip[slot] = itemId;
    this.refreshDerived();
    this.save();
    return true;
  },

  equipStToSlot(stId, slotIdx = null) {
    const s = this.state;
    if (!SHENGTONG[stId]) return { ok: false, msg: '神通不存在' };
    if (!s.shengtong.find((st) => st.id === stId)) return { ok: false, msg: '尚未解锁' };
    for (let i = 0; i < s.equippedSt.length; i++) {
      if (s.equippedSt[i] === stId) s.equippedSt[i] = null;
    }
    let target = slotIdx;
    if (target === null || target === undefined) target = s.equippedSt.findIndex((x) => !x);
    if (target === -1) return { ok: false, msg: '装配槽已满' };
    s.equippedSt[target] = stId;
    this.save();
    return { ok: true, msg: '已装配' };
  },

  removeStFromSlot(slotIdx) {
    const s = this.state;
    if (slotIdx < 0 || slotIdx >= s.equippedSt.length) return { ok: false, msg: '无效位置' };
    const equippedCount = s.equippedSt.filter(Boolean).length;
    if (equippedCount <= 1 && s.equippedSt[slotIdx]) return { ok: false, msg: '至少保留1个已装配神通' };
    s.equippedSt[slotIdx] = null;
    this.save();
    return { ok: true, msg: '已移除' };
  },

  getAchievementDefs() {
    const s = this.state;
    const cleared = Math.max(0, s.dungeonProgress?.dungeonIdx || 0);
    const realmLv = (s.realmIdx || 0) + 1;
    return [
      { id: 'kill_100', group: '击杀', name: '初试锋芒', cur: s.killCount || 0, need: 100, rewardStone: 300 },
      { id: 'kill_500', group: '击杀', name: '百人敌', cur: s.killCount || 0, need: 500, rewardStone: 1200 },
      { id: 'kill_1000', group: '击杀', name: '千斩', cur: s.killCount || 0, need: 1000, rewardStone: 3000 },
      { id: 'clear_1', group: '历练', name: '首通一关', cur: cleared, need: 1, rewardStone: 300 },
      { id: 'clear_10', group: '历练', name: '连破十关', cur: cleared, need: 10, rewardStone: 1800 },
      { id: 'clear_42', group: '历练', name: '万境尽览', cur: cleared, need: 42, rewardStone: 8000 },
      { id: 'realm_4', group: '境界', name: '迈入筑基', cur: realmLv, need: 4, rewardStone: 800 },
      { id: 'realm_13', group: '境界', name: '窥见化神', cur: realmLv, need: 13, rewardStone: 2500 },
      { id: 'realm_42', group: '境界', name: '道祖圆满', cur: realmLv, need: 42, rewardStone: 20000 },
      { id: 'stone_1w', group: '资源', name: '灵石小成', cur: s.stone || 0, need: 10000, rewardStone: 1000 },
      { id: 'stone_10w', group: '资源', name: '灵石巨贾', cur: s.stone || 0, need: 100000, rewardStone: 5000 },
    ];
  },

  claimAchievement(achId) {
    const s = this.state;
    const row = this.getAchievementDefs().find((a) => a.id === achId);
    if (!row) return { ok: false, msg: '成就不存在' };
    if (row.cur < row.need) return { ok: false, msg: '尚未达成' };
    if (s.achieveClaimed[achId]) return { ok: false, msg: '已领取' };
    s.achieveClaimed[achId] = true;
    s.stone += row.rewardStone;
    this.save();
    return { ok: true, msg: `领取成功，灵石+${row.rewardStone}` };
  },

  getStTierName(lv) {
    return ST_LEVEL_NAMES[Math.max(1, Math.min(ST_LEVEL_NAMES.length, lv || 1)) - 1];
  },

  getStNextNeed(st) {
    const lv = Math.max(1, Math.min(ST_LEVEL_NAMES.length, st?.lv || 1));
    if (lv >= ST_LEVEL_NAMES.length) return 0;
    return ST_LEVEL_UP_USE_NEED[lv - 1] || 0;
  },

  getStUseProgress(st) {
    const lv = Math.max(1, Math.min(ST_LEVEL_NAMES.length, st?.lv || 1));
    const totalUses = Math.max(0, Math.floor(st?.totalUses || 0));
    if (lv >= ST_LEVEL_NAMES.length) return { cur: totalUses, need: totalUses, done: true };
    const usedBefore = ST_LEVEL_UP_USE_NEED.slice(0, lv - 1).reduce((a, b) => a + b, 0);
    const need = ST_LEVEL_UP_USE_NEED[lv - 1] || 0;
    const cur = Math.max(0, totalUses - usedBefore);
    return { cur: Math.min(cur, need), need, done: cur >= need };
  },

  getStPowerMul(lv) {
    return ST_LEVEL_POWER_MUL[Math.max(1, Math.min(ST_LEVEL_POWER_MUL.length, lv || 1)) - 1] || 1;
  },

  recordStUse(stId, count = 1) {
    const s = this.state;
    let st = s.shengtong.find((t) => t.id === stId);
    if (!st) {
      st = { id: stId, lv: 1, totalUses: 0 };
      s.shengtong.push(st);
    }
    st.totalUses = Math.max(0, Math.floor((st.totalUses || 0) + count));
    const upMsgs = [];
    while (st.lv < ST_LEVEL_NAMES.length) {
      const progress = this.getStUseProgress(st);
      if (!progress.done) break;
      st.lv += 1;
      upMsgs.push(`${SHENGTONG[stId]?.name || stId}升至「${this.getStTierName(st.lv)}」`);
    }
    this.save();
    return upMsgs;
  },

  addKill(count = 1) {
    this.state.killCount += count;
  },

  onDeath() {
    this.save();
  },

  getBreakDanId() {
    return BREAK_DANS[Math.floor(this.state.realmIdx / 3)]?.id;
  },

  breakThrough() {
    const s = this.state;
    if (s.realmIdx >= REALMS.length - 1) return { ok: false, msg: '已是最高境界' };
    if (!s.canBreak) return { ok: false, msg: '当前修为未满' };
    if (s.breakCooldownUntil && Date.now() < s.breakCooldownUntil) return { ok: false, msg: '突破冷却中' };
    const danId = this.getBreakDanId();
    if (!danId || !s.bag.find((i) => i.id === danId)) return { ok: false, msg: '缺少突破丹' };
    let baseRate = 0.1 + s.breakFailCount * 0.05;
    baseRate = Math.min(baseRate, 0.5);
    const rate = Math.min(baseRate + 0.5, 1);
    this.useItem(danId, 1);
    const success = Math.random() < rate;
    if (success) {
      const beforeHpMax = s.maxHp || 0;
      s.xp = 0;
      s.realmIdx += 1;
      s.breakFailCount = 0;
      s.breakCooldownUntil = 0;
      this.refreshDerived();
      const hpGain = Math.max(0, (s.maxHp || 0) - beforeHpMax);
      this.save();
      return { ok: true, msg: `突破成功！气血上限+${hpGain}` };
    }
    s.breakFailCount += 1;
    s.breakCooldownUntil = Date.now() + 3600000;
    this.save();
    return { ok: false, msg: '突破失败，进入冷却' };
  },

  skipBreakCooldownWithAd(cb) {
    const s = this.state;
    if (!s.breakCooldownUntil || Date.now() >= s.breakCooldownUntil) {
      cb && cb(false, '当前无需跳过冷却');
      return;
    }
    wx.createRewardedVideoAd({ adUnitId: 'your-ad-unit-id' })
      .then((ad) => ad.show())
      .then(() => {
        s.breakCooldownUntil = 0;
        this.save();
        cb && cb(true, '冷却已清除');
      })
      .catch(() => {
        s.breakCooldownUntil = 0;
        this.save();
        cb && cb(true, '冷却已清除');
      });
  },

  addTitle(title) {
    const s = this.state;
    if (!s.titles.includes(title)) {
      s.titles.push(title);
      s.currentTitle = title;
      this.save();
    }
  },

  getTotalServants() {
    return 0;
  },

  adjustServants() {
    return null;
  },

  getCaveIdleReward() {
    return null;
  },

  claimCaveIdle() {
    return null;
  },

  isRecipeUnlocked() {
    return false;
  },

  getAlchemyRecipes() {
    return [];
  },

  startAlchemy() {
    return { ok: false, msg: '当前版本不开放丹房' };
  },

  getAlchemyStatus() {
    return null;
  },

  claimAlchemy() {
    return { ok: false, msg: '当前版本不开放丹房' };
  },

  upgradeCave() {
    return { ok: false, msg: '当前版本洞府不提供升级加成' };
  },
};
