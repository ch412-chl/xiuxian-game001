export const storage = {
  init() {
    const saved = wx.getStorageSync('gameData');
    if (!saved) {
      // 第一次启动，写入初始存档
      this.save(this.defaultData());
    }
  },

  defaultData() {
    return {
      // 基础信息
      name: '凌云子',
      // 境界: 0=练气初,1=练气中,2=练气后...每3个一大境界
      realmIdx: 0,
      xp: 0,
      hp: 300,
      maxHp: 300,
      shaqi: 0,
      killCount: 0,
      breakFailCount: 0,
      breakCooldownUntil: 0,

      // 资源
      stone: 500,

      // 属性
      atk: 100,
      def: 50,
      spd: 80,

      // 装备槽 (itemId or null)
      equip: { weapon: null, robe: null, ring: null },

      // 背包 [{id, count}]
      bag: [],

      // 神通 [{id, lv, frag}]
      shengtong: [
        { id: 'thunder', lv: 1, frag: 0 },
      ],
      // 已装配神通id列表 最多6个
      equippedSt: ['thunder', null, null, null, null, null],

      // 已解锁丹方
      recipesKnown: ['juling', 'huiling'],

      guide: {
        firstDungeon: false,
        firstBattle: false,
        firstAlchemy: false,
      },

      // 洞府
      cave: {
        lv: 1,
        alchemySlots: [null, null, null], // 材料槽
        alchemyStart: null,
        alchemyRecipeId: null,
        idle: {
          startTime: Date.now(),
        },
        servants: {
          mine: 5,
          herb: 5,
        },
        seeds: [],
      },

      // 地下城进度
      dungeonProgress: {
        dungeonIdx: 0,
        floor: 0,
      },
      bossDrops: {},

      titles: [],
      currentTitle: null,

      // 离线时间戳
      lastOnline: Date.now(),
    };
  },

  save(data) {
    wx.setStorageSync('gameData', data);
  },

  load() {
    return wx.getStorageSync('gameData') || this.defaultData();
  },

  // 局部更新某个key
  update(key, val) {
    const d = this.load();
    d[key] = val;
    this.save(d);
  },
};
