export const storage = {
  init() {
    const saved = wx.getStorageSync('gameData');
    if (!saved) this.save(this.defaultData());
  },

  defaultData() {
    return {
      name: '凌云子',
      realmIdx: 0,
      xp: 0,
      hp: 300,
      maxHp: 300,
      killCount: 0,
      breakFailCount: 0,
      breakCooldownUntil: 0,
      stone: 500,
      atk: 100,
      def: 50,
      spd: 80,
      equip: { weapon: null, robe: null, ring: null },
      bag: [],
      shengtong: [{ id: 'st_guiyuan', lv: 1, totalUses: 0 }],
      equippedSt: ['st_guiyuan', null, null],
      guide: {
        firstDungeon: false,
        firstBattle: false,
      },
      cave: {
        stageFocus: 'achieve',
      },
      dungeonProgress: {
        dungeonIdx: 0,
        floor: 0,
      },
      bossDrops: {},
      achieveClaimed: {},
      bestiarySeen: {},
      titles: [],
      currentTitle: null,
      lastOnline: Date.now(),
    };
  },

  save(data) {
    wx.setStorageSync('gameData', data);
  },

  load() {
    return wx.getStorageSync('gameData') || this.defaultData();
  },

  update(key, val) {
    const d = this.load();
    d[key] = val;
    this.save(d);
  },
};
