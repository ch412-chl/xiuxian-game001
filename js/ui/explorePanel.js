import { gameState } from '../gameState';
import { DUNGEONS, SHENGTONG, ITEMS } from '../data';
import { StPanel } from './stPanel';

export class ExplorePanel {
  constructor(main) {
    this.main = main;
    this.mode = 'stageList'; // 'stageList' | 'explore' | 'transition'
    this.currentStageId = null;
    this.transitionTick = 0;
    this.logs = [];
    this.buttons = [];
    this.autoStep = false;
    this.pendingEnemy = null;
    this.dead = false;
    this.adReviveUsed = false;
    this.bossDefeated = false;
    this.runDepth = 0;
    this.stageSteps = 0;
    this.runLoot = { stone: 0, items: {} };
    this.lastEnemy = null;
    this.floorPlan = [];
    this.floorIdx = 0;
    this.exitPrompt = null;
    this.pageGroup = 0;

    // 探索中的实时状态（沉浸式，不写入存档）
    this.playerMaxHp = 0;
    this.playerHp = 0;
    this.enemyMaxHp = 0;
    this.enemyHp = 0;
    this.playerShake = 0;
    this.enemyShake = 0;

    // 战斗播放队列（逐条播放，不一次性刷日志）
    this.battle = null; // { events:[], idx:number, tick:number, interval:number, done:boolean }
    this.battleLogs = [];

    // 每关探索仅掉落一次传送符（本次进入该关的探索期间）
    this.tpDropped = false;
    this._autoTick = 0;

    this.stPanel = new StPanel(main);
    this.stArea = null;
  }

  update() {
    if (this.mode === 'transition') {
      if (this.transitionTick > 0) this.transitionTick--;
      if (this.transitionTick === 0) {
        this.mode = 'explore';
        this.pushExploreLog('你迈入关卡深处，前方一片未知。');
      }
    }

    if (this.playerShake > 0) this.playerShake--;
    if (this.enemyShake > 0) this.enemyShake--;

    // 战斗逐条播放
    if (this.mode === 'explore' && this.battle && !this.battle.done) {
      this.battle.tick += 1;
      if (this.battle.tick >= this.battle.interval) {
        this.battle.tick = 0;
        this.playNextBattleEvent();
      }
    }

    if (this._clearBattleTick && this._clearBattleTick > 0) {
      this._clearBattleTick -= 1;
      if (this._clearBattleTick === 0) {
        this.battleLogs = [];
        this.battle = null;
      }
    }
  }

  onTouch(x, y) {
    if (this.mode === 'stageList') {
      const hit = this.buttons.find(
        (b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2
      );
      if (!hit) {
        if (this.stArea && y >= this.stArea.y1 && y <= this.stArea.y2) {
          this.stPanel.onTouch(x, y);
        }
        return;
      }
      if (hit.type === 'enterStage') {
        this.enterStage(hit.stageId);
      }
      if (hit.type === 'prevChapter') {
        this.pageGroup = Math.max(0, (this.pageGroup || 0) - 1);
      }
      if (hit.type === 'nextChapter') {
        const maxGroup = Math.floor((DUNGEONS.length - 1) / 3);
        this.pageGroup = Math.min(maxGroup, (this.pageGroup || 0) + 1);
      }
      if (this.stArea && y >= this.stArea.y1 && y <= this.stArea.y2) {
        this.stPanel.onTouch(x, y);
      }
      return;
    }

    if (this.mode === 'explore') {
      const hit = this.buttons.find(
        (b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2
      );
      if (!hit) return;
      // 战斗播放中禁止其它交互
      if (this.battle && !this.battle.done) return;

      if (hit.type === 'useDan') {
        this.useHealingDan();
        return;
      }

      if (hit.type === 'useTp') {
        this.useTeleport();
        return;
      }


      if (this.dead) {
        if (hit.type === 'adRevive') {
          this.requestAd(() => this.reviveFromAd());
          return;
        }
        if (hit.type === 'giveUp') {
          this.endRun({ success: false, cleared: false, reason: 'dead' });
          return;
        }
      }

      if (this.pendingEnemy) {
        if (hit.type === 'fightEnemy') {
          this.startBattleWithPending();
          return;
        }
        if (hit.type === 'exitEnemy') {
          this.handleExitRequest();
          return;
        }
        if (hit.type === 'exitUseTp') {
          this.exitPrompt = null;
          this.useTeleport();
          return;
        }
        if (hit.type === 'exitConfirmAbandon') {
          this.endRun({ success: false, cleared: false, reason: 'abandon' });
          return;
        }
        if (hit.type === 'exitConfirmAd') {
          this.requestAd(() => this.endRun({ success: true, cleared: false, reason: 'adExit' }));
          return;
        }
        if (hit.type === 'exitCancel') {
          this.exitPrompt = null;
          return;
        }
      } else {
        if (hit.type === 'step') {
          this.doExploreStep(false);
        } else if (hit.type === 'auto') {
          this.autoStep = !this.autoStep;
        }
      }
    }
  }

  enterStage(stageId) {
    this.currentStageId = stageId;
    this.mode = 'transition';
    // 延长转场时间，让文字可以看清楚
    this.transitionTick = 60;
    this.logs = [];
    this.battleLogs = [];
    this.battle = null;
    this.pendingEnemy = null;
    this.tpDropped = false;
    this._autoTick = 0;
    this.dead = false;
    this.adReviveUsed = false;
    this.bossDefeated = false;
    this.runDepth = 0;
    this.runLoot = { stone: 0, items: {} };
    this.floorPlan = [];
    this.floorIdx = 0;
    this.exitPrompt = null;

    // 初始化本次探索血量（持久化到角色）
    const s = gameState.state;
    const realmIdx = s.realmIdx || 0;
    const maxHp = 200 + (s.totalDef || s.def || 50) * 2 + realmIdx * 20;
    s.maxHp = Math.max(1, Math.floor(maxHp));
    if (!s.hp || s.hp > s.maxHp) s.hp = s.maxHp;
    this.playerMaxHp = s.maxHp;
    this.playerHp = s.hp;

    const dungeon = DUNGEONS.find(d => d.id === stageId);
    this.stageSteps = (dungeon && dungeon.floors) || 10;
    this.floorPlan = this.buildFloorPlan(this.stageSteps);

    if (!s.guide.firstDungeon) {
      s.guide.firstDungeon = true;
      this.pushExploreLog('首次踏入副本，谨慎前行，战利品需带回方可结算。');
      gameState.save();
    }
  }

  backToList() {
    this.mode = 'stageList';
    this.currentStageId = null;
    this.autoStep = false;
    this.pendingEnemy = null;
    this.battle = null;
    this.battleLogs = [];
    this.dead = false;
    this.adReviveUsed = false;
    this.bossDefeated = false;
    this.runDepth = 0;
    this.stageSteps = 0;
    this.runLoot = { stone: 0, items: {} };
    this.floorPlan = [];
    this.floorIdx = 0;
    this.exitPrompt = null;
  }

  doExploreStep(fromAuto) {
    const dungeon = DUNGEONS.find(d => d.id === this.currentStageId);
    if (!dungeon) return;
    if (this.dead) return;
    if (this.pendingEnemy) return;

    // 推进一层
    this.floorIdx += 1;
    this.runDepth = this.floorIdx;
    this.pushExploreLog(`你沿着阴冷石阶前行至第 ${this.runDepth} 层。`);

    const floorType = this.floorPlan[this.floorIdx - 1];
    if (floorType === 'battle' || floorType === 'boss') {
      const enemy = this.makeEnemyPreview(this.buildEnemy(dungeon, this.floorIdx, floorType === 'boss'), floorType === 'boss');
      this.pendingEnemy = enemy;
      this.autoStep = false;
      this.enemyMaxHp = enemy.hp;
      this.enemyHp = enemy.hp;
      this.exitPrompt = false;
      this.pushExploreLog(floorType === 'boss' ? `一股压迫扑面而来，${enemy.name}现身！` : `你遭遇了「${enemy.name}」。`);
    } else {
      this.handleEvent();
    }

    // 传送符掉落：每副本仅一次
    if (!this.tpDropped) {
      const chance = Math.min(1, this.floorIdx * 0.1);
      if (Math.random() < chance) {
        this.tpDropped = true;
        gameState.addItem('teleport', 1);
        this.pushExploreLog('你在角落拾起一张残破符箓：传送符（下方格子可用）。');
      }
    }

    if (this.playerHp <= 0) {
      this.handleDeath();
    }
  }

  pushExploreLog(text) {
    this.logs.push(text);
    if (this.logs.length > 80) this.logs.shift();
  }

  pushBattleLog(text) {
    this.battleLogs.push(text);
    if (this.battleLogs.length > 8) this.battleLogs.shift();
  }

  buildFloorPlan(floors) {
    const plan = Array(floors).fill('event');
    if (floors >= 5) plan[4] = 'boss';
    if (floors >= 10) plan[9] = 'boss';
    const candidates = [];
    for (let i = 0; i < floors; i++) {
      if (plan[i] === 'event') candidates.push(i);
    }
    // 总共5个战斗，包含2个boss，因此补足3个普通战斗
    for (let i = 0; i < 3 && candidates.length; i++) {
      const idx = Math.floor(Math.random() * candidates.length);
      plan[candidates[idx]] = 'battle';
      candidates.splice(idx, 1);
    }
    return plan;
  }

  buildEnemy(dungeon, floorIdx, isBoss) {
    const base = dungeon.enemyBase + floorIdx * 8;
    return {
      name: isBoss ? `${dungeon.chapter}·首领` : `${dungeon.chapter}·妖物`,
      hp: Math.floor(base * (isBoss ? 6 : 2.2)),
      atk: Math.floor(base * (isBoss ? 1.4 : 0.6)),
      def: Math.floor(base * (isBoss ? 0.7 : 0.35)),
      spd: Math.floor(50 + dungeon.groupIdx * 8 + (isBoss ? 10 : 0)),
      shaqi: isBoss ? 10 + dungeon.groupIdx * 2 : 0,
      skills: isBoss ? ['破甲', '怒击', '震魂'] : ['撕咬', '扑击'],
      isBoss,
    };
  }

  handleEvent() {
    const r = Math.random();
    if (r < 0.35) {
      const trapDmg = 8 + Math.floor(Math.random() * 12);
      this.playerHp -= trapDmg;
      this.pushExploreLog(`你脚下一空，险些跌入暗坑，损失 ${trapDmg} 点气血。`);
    } else if (r < 0.6) {
      const stoneGain = 25 + Math.floor(Math.random() * 50);
      this.runLoot.stone += stoneGain;
      this.pushExploreLog(`你在碎石堆中翻找片刻，意外摸出一袋灵石（+${stoneGain}）。`);
    } else if (r < 0.78) {
      const matItem = this.rollCommonMat();
      this.addRunLoot(matItem, 1);
      this.pushExploreLog(`你在苔痕间寻得「${ITEMS[matItem]?.name || matItem}」。`);
    } else if (r < 0.9) {
      this.pushExploreLog('你在潮湿的石壁上发现一行模糊古篆，似乎指向更深处。');
    } else {
      const seedDrop = this.rollSeedDrop();
      if (seedDrop) {
        this.addRunLoot(seedDrop, 1);
        this.pushExploreLog(`你拾起一枚种子：「${ITEMS[seedDrop]?.name || seedDrop}」。`);
      } else {
        this.pushExploreLog('一缕清凉灵气拂过，你只觉心神宁定。');
      }
    }
    this.syncPlayerHp();
  }

  addRunLoot(id, count) {
    if (!this.runLoot.items[id]) this.runLoot.items[id] = 0;
    this.runLoot.items[id] += count;
  }

  rollCommonMat() {
    const pool = ['herb', 'dew', 'water'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  rollSeedDrop() {
    const pool = ['seed_herb', 'seed_dew', 'seed_water', 'seed_lingzhi', 'seed_xuanbing', 'seed_huoling'];
    if (Math.random() < 0.2) return pool[Math.floor(Math.random() * pool.length)];
    return null;
  }

  rollRecipeDrop() {
    const dungeon = DUNGEONS.find(d => d.id === this.currentStageId);
    if (!dungeon) return null;
    return `recipe_break_dan_${dungeon.groupIdx}`;
  }

  rollStFragDrop() {
    const pool = ['stfrag_thunder', 'stfrag_ice', 'stfrag_fire', 'stfrag_vortex', 'stfrag_sword', 'stfrag_shield'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  syncPlayerHp() {
    const s = gameState.state;
    s.hp = Math.max(0, Math.min(this.playerHp, s.maxHp || this.playerMaxHp));
  }

  handleDeath() {
    this.playerHp = Math.max(0, this.playerHp);
    this.syncPlayerHp();
    this.dead = true;
    this.autoStep = false;
    this.pendingEnemy = null;
    this.pushExploreLog('气血尽散，你倒在幽暗的石阶上。');
    gameState.onDeath();
  }

  reviveFromAd() {
    if (!this.dead || this.adReviveUsed) return;
    this.adReviveUsed = true;
    this.dead = false;
    const base = this.playerMaxHp || 100;
    this.playerHp = Math.max(1, Math.floor(base * 0.5));
    this.syncPlayerHp();
    this.pushExploreLog('你强行稳住心神，从死亡边缘爬起。');
  }

  handleExitRequest() {
    const hasTp = this.getBagCount('teleport') > 0;
    if (hasTp) {
      this.exitPrompt = 'tp';
      this.pushExploreLog('你握紧传送符，是否立即撤离？');
      return;
    }
    this.exitPrompt = 'noTp';
    this.pushExploreLog('未持传送符，可选择放弃战利品撤离或观看广告撤离。');
  }

  requestAd(onSuccess) {
    wx.createRewardedVideoAd({ adUnitId: 'your-ad-unit-id' })
      .then(ad => ad.show())
      .then(() => { onSuccess && onSuccess(); })
      .catch(() => { onSuccess && onSuccess(); });
  }

  endRun({ success, cleared, reason }) {
    const s = gameState.state;
    if (success) {
      if (this.runLoot.stone > 0) {
        s.stone += this.runLoot.stone;
        this.pushExploreLog(`你带回灵石 ${this.runLoot.stone} 枚。`);
      }
      Object.keys(this.runLoot.items).forEach((id) => {
        const c = this.runLoot.items[id];
        if (c > 0) {
          gameState.addItem(id, c);
          this.pushExploreLog(`带回「${ITEMS[id]?.name || id}」×${c}。`);
        }
      });
      const xpGain = Math.max(5, Math.floor(this.runLoot.stone * 0.3));
      s.xp += xpGain;
    } else {
      this.pushExploreLog('本次探索损失全部战利品。');
    }

    if (cleared) {
      const idx = (s.dungeonProgress?.dungeonIdx || 0);
      if (this.currentStageId === DUNGEONS[idx]?.id) {
        s.dungeonProgress.dungeonIdx = idx + 1;
        s.dungeonProgress.floor = 0;
      }
    }

    s.hp = s.maxHp;
    this.playerHp = s.hp;

    gameState.tryAutoBreak();
    gameState.refreshDerived();
    gameState.save();
    this.backToList();
  }

  render(ctx, W, H, headerH) {
    const startY = headerH + 20;
    this.buttons = [];
    this.stArea = null;

    if (this.mode === 'stageList') {
      this.renderStageList(ctx, W, H, startY);
    } else {
      this.renderExplore(ctx, W, H, startY);
    }
  }

  isImmersive() {
    return this.mode !== 'stageList';
  }

  renderStageList(ctx, W, H, startY) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 14px serif';
    ctx.fillText('—— 历练关卡 ——', W / 2, startY);

    const stages = gameState.getAvailableDungeons();
    const listY = startY + 46;
    ctx.font = 'bold 12px serif';

    if (!stages.length) {
      ctx.fillStyle = '#cdb88a';
      ctx.fillText('当前境界尚浅，尚无可入之地。', W / 2, listY + 20);
      return;
    }

    const groupIdx = this.pageGroup || 0;
    const groupStart = groupIdx * 3;
    const groupStages = stages.filter(st => st.id > groupStart && st.id <= groupStart + 3);
    const title = groupStages[0] ? groupStages[0].chapter : '境界';

    ctx.fillStyle = '#e2cfa3';
    ctx.font = 'bold 13px serif';
    ctx.fillText(`【 ${title} 】`, W / 2, listY - 14);
    if (groupIdx > 0) {
      this.drawNavButton(ctx, W * 0.2, listY - 16, '上一境', 'prevChapter');
    } else {
      this.drawNavButton(ctx, W * 0.2, listY - 16, '—', null);
    }
    const maxGroup = Math.floor((DUNGEONS.length - 1) / 3);
    if (groupIdx < maxGroup) {
      this.drawNavButton(ctx, W * 0.8, listY - 16, '下一境', 'nextChapter');
    } else {
      this.drawNavButton(ctx, W * 0.8, listY - 16, '天机未至', null);
    }

    groupStages.forEach((st, idx) => {
      const rowY = listY + 18 + idx * 52;
      const rowH = 42;
      const rowX = W * 0.08;
      const rowW = W * 0.84;

      ctx.fillStyle = st.canChallenge ? 'rgba(48,40,32,0.7)' : 'rgba(32,28,24,0.6)';
      ctx.fillRect(rowX, rowY, rowW, rowH);
      ctx.strokeStyle = '#3a332d';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(rowX, rowY, rowW, rowH);

      ctx.textAlign = 'left';
      ctx.fillStyle = st.canChallenge ? '#f3e2bb' : '#b59f75';
      ctx.font = 'bold 13px serif';
      ctx.fillText(`${st.stage} · ${st.name}`, rowX + 12, rowY + 26);

      ctx.textAlign = 'right';
      ctx.fillStyle = st.isCleared ? '#b59f75' : (st.canChallenge ? '#f0d8a8' : '#8e7b5a');
      ctx.font = 'bold 12px serif';
      const label = st.isCleared ? '已通关' : (st.canChallenge ? '点击探索' : '未解锁');
      ctx.fillText(label, rowX + rowW - 12, rowY + 26);

      if (st.canChallenge) {
        this.buttons.push({
          type: 'enterStage',
          stageId: st.id,
          x1: rowX,
          x2: rowX + rowW,
          y1: rowY,
          y2: rowY + rowH,
        });
      }
    });

    // 神通嵌入区（历练页下方）
    const listBottom = listY + 18 + groupStages.length * 52 + 8;
    const navGap = 86;
    const maxH = Math.max(200, H - listBottom - navGap);
    this.stArea = { y1: listBottom, y2: listBottom + maxH };
    this.stPanel.renderEmbedded(ctx, W, H, listBottom, maxH);
  }

  drawNavButton(ctx, cx, cy, label, type) {
    const w = 64;
    const h = 22;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const disabled = !type;
    ctx.fillStyle = disabled ? 'rgba(28,24,20,0.45)' : 'rgba(42,36,30,0.7)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#3a332d';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = disabled ? '#7c6d55' : '#d8c59b';
    ctx.font = 'bold 11px serif';
    ctx.fillText(label, cx, cy + 4);
    if (type) {
      this.buttons.push({ type, x1: x, x2: x + w, y1: y, y2: y + h });
    }
  }

  renderExplore(ctx, W, H, startY) {
    const dungeon = DUNGEONS.find(d => d.id === this.currentStageId);
    const title = dungeon ? dungeon.name : '未知之地';

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 16px serif';
    ctx.fillText(`【 ${title} 】`, W / 2, startY);

    // 简单转场遮罩
    if (this.mode === 'transition' && this.transitionTick > 0) {
      const alpha = this.transitionTick / 60;
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = `rgba(243,226,187,${alpha})`;
      ctx.font = 'bold 14px serif';
      ctx.fillText('迷雾翻滚，你踏入新的关卡……', W / 2, H / 2);
      return;
    }

    // 上半：探索日志
    const lowerH = 240;
    const splitY = Math.max(startY + 120, H - lowerH);
    const logTop = startY + 25;
    const logBottom = splitY - 12;
    ctx.fillStyle = 'rgba(40,34,28,0.65)';
    ctx.fillRect(14, logTop - 12, W - 28, logBottom - logTop + 20);
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px serif';

    const maxLines = Math.floor((logBottom - logTop) / 16);
    const startIdx = Math.max(0, this.logs.length - maxLines);
    const visible = this.logs.slice(startIdx);
    visible.forEach((line, i) => {
      const y = logTop + i * 16;
      const alpha = Math.max(0.35, 1 - (visible.length - 1 - i) * 0.08);
      ctx.fillStyle = `rgba(243,226,187,${alpha})`;
      ctx.fillText(`· ${line}`, 20, y);
    });

    // 分割线
    ctx.strokeStyle = '#3a332d';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(16, splitY);
    ctx.lineTo(W - 16, splitY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(28,24,20,0.7)';
    ctx.fillRect(0, splitY, W, H - splitY);
    this.renderLowerPanel(ctx, W, H, splitY);
    if (this.battleLogs.length > 0) {
      this.renderBattleOverlay(ctx, W, H);
    }
  }

  renderLowerPanel(ctx, W, H, topY) {
    const pad = 16;
    const gap = 18;
    const s = gameState.state;
    const colW = (W - pad * 2 - gap) / 2;
    const leftX = pad;
    const rightX = pad + colW + gap;
    const lineH = 16;
    const enemy = this.pendingEnemy || this.lastEnemy;
    const hasEnemy = !!this.pendingEnemy;

    // 头部对比标题
    let y = topY + 18;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 12px serif';
    ctx.fillText('我方', leftX, y);
    ctx.fillText(hasEnemy ? `敌方：${enemy.name}` : '敌方：未遭遇', rightX, y);

    // 对齐对比数值
    y += lineH;
    const rows = [
      { label: '气血', p: `${this.playerHp}/${this.playerMaxHp}`, e: hasEnemy ? `${this.enemyHp}/${this.enemyMaxHp}` : '--' },
      { label: '攻击', p: s.totalAtk, e: hasEnemy ? enemy.atk : '--' },
      { label: '防御', p: s.totalDef, e: hasEnemy ? enemy.def : '--' },
      { label: '神识', p: s.totalSpd || s.spd, e: hasEnemy ? (enemy.spd || 60) : '--' },
      { label: '煞气', p: `${s.shaqi || 0}%`, e: hasEnemy ? `${enemy.shaqi || 0}%` : '--' },
    ];
    rows.forEach((r, idx) => {
      const ry = y + idx * lineH;
      ctx.fillStyle = '#f0ddb1';
      ctx.font = 'bold 12px serif';
      ctx.fillText(`${r.label}：${r.p}`, leftX, ry);
      ctx.fillText(`${r.label}：${r.e}`, rightX, ry);
    });

    const infoY = y + rows.length * lineH + 6;
    ctx.fillStyle = '#e7d3a7';
    ctx.font = 'bold 12px serif';
    ctx.fillText(`层数：${this.runDepth}/${this.stageSteps}`, leftX, infoY);
    ctx.fillText(`战利品：灵石 ${this.runLoot.stone}`, leftX, infoY + lineH);
    if (hasEnemy) {
      const skills = (enemy.skills || []).join('、') || '无';
      ctx.fillText(`技能：${skills}`, rightX, infoY);
    }

    // 丹药 / 传送符
    const barY = H - 64;
    const slotW = colW;
    const slotH = 40;
    let slotY = infoY + lineH * 2 + 8;
    if (slotY + slotH > barY - 8) slotY = barY - slotH - 8;

    const danCount = this.getBagCount('huiling');
    const tpCount = this.getBagCount('teleport');
    this.drawSlot(ctx, leftX, slotY, slotW, slotH, '丹药', danCount > 0 ? `回灵丹×${danCount}` : '空', danCount > 0);
    this.buttons.push({ type: 'useDan', x1: leftX, x2: leftX + slotW, y1: slotY, y2: slotY + slotH });

    this.drawSlot(ctx, rightX, slotY, slotW, slotH, '传送符', tpCount > 0 ? `传送符×${tpCount}` : '空', tpCount > 0);
    this.buttons.push({ type: 'useTp', x1: rightX, x2: rightX + slotW, y1: slotY, y2: slotY + slotH });

    // 底部三按钮（沉浸模式唯一按钮）
    const btnW = W / 3;
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px serif';

    // 撤离提示（放到底部按钮上方，避免与数值重叠）
    if (this.exitPrompt) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e7d3a7';
      ctx.font = 'bold 12px serif';
      const msg = this.exitPrompt === 'tp' ? '使用传送符可带走战利品' : '无传送符将损失战利品';
      ctx.fillText(msg, W / 2, barY - 10);
    }

    if (this.dead) {
      if (!this.adReviveUsed) {
        ctx.fillStyle = '#f0d8a8';
        ctx.fillText('广告复活', btnW * 0.5, barY + 22);
        this.buttons.push({ type: 'adRevive', x1: 0, x2: btnW, y1: barY - 10, y2: barY + 30 });
      }
      ctx.fillStyle = '#cdb88a';
      ctx.fillText('认命离开', btnW * 1.5, barY + 22);
      this.buttons.push({ type: 'giveUp', x1: btnW, x2: btnW * 2, y1: barY - 10, y2: barY + 30 });
    } else if (this.pendingEnemy) {
      if (this.exitPrompt === 'tp') {
        ctx.fillStyle = '#cdb88a';
        ctx.fillText('返回', btnW * 0.5, barY + 22);
        this.buttons.push({ type: 'exitCancel', x1: 0, x2: btnW, y1: barY - 10, y2: barY + 30 });

        ctx.fillStyle = '#f3e2bb';
        ctx.fillText('使用传送符', btnW * 1.5, barY + 22);
        this.buttons.push({ type: 'exitUseTp', x1: btnW, x2: btnW * 2, y1: barY - 10, y2: barY + 30 });
      } else if (this.exitPrompt === 'noTp') {
        ctx.fillStyle = '#cdb88a';
        ctx.fillText('返回', btnW * 0.5, barY + 22);
        this.buttons.push({ type: 'exitCancel', x1: 0, x2: btnW, y1: barY - 10, y2: barY + 30 });

        ctx.fillStyle = '#cdb88a';
        ctx.fillText('放弃战利品', btnW * 1.5, barY + 22);
        this.buttons.push({ type: 'exitConfirmAbandon', x1: btnW, x2: btnW * 2, y1: barY - 10, y2: barY + 30 });

        ctx.fillStyle = '#f3e2bb';
        ctx.fillText('广告撤离', btnW * 2.5, barY + 22);
        this.buttons.push({ type: 'exitConfirmAd', x1: btnW * 2, x2: btnW * 3, y1: barY - 10, y2: barY + 30 });
      } else {
        ctx.fillStyle = '#f3e2bb';
        ctx.fillText('战斗', btnW * 1.5, barY + 22);
        this.buttons.push({ type: 'fightEnemy', x1: btnW, x2: btnW * 2, y1: barY - 10, y2: barY + 30 });

        ctx.fillStyle = '#cdb88a';
        ctx.fillText('撤离', btnW * 2.5, barY + 22);
        this.buttons.push({ type: 'exitEnemy', x1: btnW * 2, x2: btnW * 3, y1: barY - 10, y2: barY + 30 });
      }
    } else {
      ctx.fillStyle = this.autoStep ? '#f0d8a8' : '#cdb88a';
      ctx.fillText('自动推进', btnW * 0.5, barY + 22);
      this.buttons.push({ type: 'auto', x1: 0, x2: btnW, y1: barY - 10, y2: barY + 30 });

      ctx.fillStyle = '#f0d8a8';
      ctx.fillText('探索', btnW * 1.5, barY + 22);
      this.buttons.push({ type: 'step', x1: btnW, x2: btnW * 2, y1: barY - 10, y2: barY + 30 });
    }

    // 自动推进节流：每 18 帧推进一次（遇敌/战斗时会停下）
    if (this.autoStep && !this.dead && !this.pendingEnemy && (!this.battle || this.battle.done)) {
      this._autoTick += 1;
      if (this._autoTick >= 18) {
        this._autoTick = 0;
        this.doExploreStep(true);
      }
    }
  }

  renderBattleOverlay(ctx, W, H) {
    const boxW = Math.min(W - 40, 320);
    const boxH = 120;
    const boxX = (W - boxW) / 2;
    const maxY = H - boxH - 90;
    const boxY = Math.min(maxY, Math.max(120, (H - boxH) / 2));

    ctx.fillStyle = 'rgba(22,18,14,0.9)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#2a2622';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2cfa3';
    ctx.font = 'bold 12px serif';
    ctx.fillText('战斗', W / 2, boxY + 16);

    ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(243,226,187,0.98)';
    ctx.font = 'bold 12px serif';
    const lines = this.battleLogs.slice(-5);
    lines.forEach((t, i) => {
      ctx.fillText(`· ${t}`, boxX + 12, boxY + 36 + i * 16);
    });
  }

  drawSlot(ctx, x, y, w, h, title, value, active) {
    ctx.strokeStyle = '#2a2622';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 11px serif';
    ctx.fillText(title, x + 8, y + 14);
    ctx.fillStyle = active ? '#f3dda8' : '#bda577';
    ctx.font = 'bold 12px serif';
    ctx.fillText(value, x + 8, y + 32);
  }

  getBagCount(id) {
    const s = gameState.state;
    const it = (s.bag || []).find(x => x.id === id);
    return it ? it.count : 0;
  }

  useHealingDan() {
    const ok = gameState.useItem('huiling', 1);
    if (!ok) return;
    const heal = Math.max(1, Math.floor(this.playerMaxHp * 0.3));
    this.playerHp = Math.min(this.playerMaxHp, this.playerHp + heal);
    this.syncPlayerHp();
    this.pushExploreLog(`你服下一枚回灵丹，气血恢复 ${heal}。`);
  }

  useTeleport() {
    const ok = gameState.useItem('teleport', 1);
    if (!ok) return;
    this.pushExploreLog('你捏碎传送符，空间扭曲，眨眼便回到宗门。');
    this.endRun({ success: true, cleared: false, reason: 'teleport' });
  }

  makeEnemyPreview(enemyCfg, isBoss) {
    return {
      name: enemyCfg.name,
      hp: enemyCfg.hp,
      atk: enemyCfg.atk,
      def: enemyCfg.def,
      spd: enemyCfg.spd || 60,
      shaqi: enemyCfg.shaqi || 0,
      skills: enemyCfg.skills || ['撕咬', '扑击'],
      isBoss: !!isBoss,
    };
  }

  startBattleWithPending() {
    if (!this.pendingEnemy) return;
    this.enemyMaxHp = this.pendingEnemy.hp;
    this.enemyHp = this.pendingEnemy.hp;
    this.battleLogs = [];
    this.lastEnemy = this.pendingEnemy;

    const events = this.buildBattleEvents({
      enemyName: this.pendingEnemy.name,
      enemyHp: this.enemyMaxHp,
      enemyAtk: this.pendingEnemy.atk,
      enemyDef: this.pendingEnemy.def,
      enemySpd: this.pendingEnemy.spd || 60,
      enemyShaqi: this.pendingEnemy.shaqi || 0,
    });

    this.battle = { events, idx: 0, tick: 0, interval: 30, done: false };
    this.pushBattleLog('战斗开始。');
    const s = gameState.state;
    if (!s.guide.firstBattle) {
      s.guide.firstBattle = true;
      this.pushBattleLog('首次战斗：神通将按顺序循环释放。');
      gameState.save();
    }
  }

  buildBattleEvents(enemy) {
    const s = gameState.state;
    const stIds = (s.equippedSt || []).filter(Boolean);
    let stPtr = 0;

    const pAtk = s.totalAtk || s.atk || 50;
    const pDef = s.totalDef || s.def || 20;
    const pSpd = s.totalSpd || s.spd || 80;

    let pHp = this.playerHp;
    let eHp = enemy.enemyHp;

    const events = [];
    const maxRounds = 12;
    const pCritRateRaw = (s.shaqi || 0) / 100;
    const pCritRate = Math.min(1, pCritRateRaw);
    const pCritOverflow = Math.max(0, (s.shaqi || 0) - 100);
    const pCritDmgMult = 1.5 + pCritOverflow / 100;
    const eCritRate = Math.min(0.5, (enemy.enemyShaqi || 0) / 100);
    const dodgeBase = 0.08;
    const pDodge = Math.min(0.3, Math.max(0.05, dodgeBase + (pSpd - (enemy.enemySpd || 60)) * 0.001));
    const eDodge = Math.min(0.25, Math.max(0.05, dodgeBase + ((enemy.enemySpd || 60) - pSpd) * 0.001));

    for (let r = 1; r <= maxRounds; r++) {
      if (pHp <= 0 || eHp <= 0) break;

      // 玩家出手：按顺序循环神通
      let stName = '平常一击';
      let mult = 1;
      if (stIds.length > 0) {
        const pickId = stIds[stPtr % stIds.length];
        stPtr += 1;
        const stCfg = SHENGTONG[pickId];
        if (stCfg) {
          stName = stCfg.name;
          mult = stCfg.dmgPct || 1.2;
        }
      }

      const enemyDodge = Math.random() < eDodge;
      if (enemyDodge) {
        events.push({ type: 'log', text: `你施展「${stName}」，却被${enemy.enemyName}闪身避过。` });
      } else {
        let base = Math.max(1, pAtk * mult - enemy.enemyDef * 0.6);
        let dmg = Math.max(1, Math.floor(base * (0.9 + Math.random() * 0.2)));
        const crit = Math.random() < pCritRate;
        if (crit) dmg = Math.floor(dmg * pCritDmgMult);
        events.push({ type: 'log', text: crit ? `你催动「${stName}」打出暴击！` : `你施展「${stName}」。` });
        eHp = Math.max(0, eHp - dmg);
        events.push({ type: 'hitEnemy', dmg, enemyHp: eHp, text: `${enemy.enemyName}损失 ${dmg} 气血。` });
      }

      if (eHp <= 0) break;

      // 敌人反击
      const playerDodge = Math.random() < pDodge;
      if (playerDodge) {
        events.push({ type: 'log', text: `你侧身一闪，躲开了${enemy.enemyName}的攻击。` });
      } else {
        let base = Math.max(1, enemy.enemyAtk - pDef * 0.4);
        let dmg = Math.max(1, Math.floor(base * (0.9 + Math.random() * 0.2)));
        const crit = Math.random() < eCritRate;
        if (crit) dmg = Math.floor(dmg * 1.5);
        pHp = Math.max(0, pHp - dmg);
        events.push({ type: 'hitPlayer', dmg, playerHp: pHp, text: `你受到 ${dmg} 伤害。` });
      }

      if (pHp <= 0) break;
    }

    events.push({ type: 'end', win: eHp <= 0 && pHp > 0, playerHp: pHp, enemyHp: eHp });
    return events;
  }

  handleBattleEnd(win, enemy) {
    if (!enemy) return;
    if (!win) {
      this.handleDeath();
      return;
    }

    gameState.addKill(1);

    if (enemy.isBoss) {
      this.handleBossDrops();
      if (this.floorIdx >= this.stageSteps) {
        this.endRun({ success: true, cleared: true, reason: 'boss' });
        return;
      }
      this.pushExploreLog('首领倒下，你继续向更深处迈进。');
      return;
    }

    const stoneGain = 20 + Math.floor(Math.random() * 30);
    this.runLoot.stone += stoneGain;
    if (Math.random() < 0.3) {
      const mat = this.rollCommonMat();
      this.addRunLoot(mat, 1);
    }
    if (Math.random() < 0.08) {
      const recipeItem = this.rollRecipeDrop();
      if (recipeItem) this.addRunLoot(recipeItem, 1);
    }
  }

  handleBossDrops() {
    const s = gameState.state;
    const dungeon = DUNGEONS.find(d => d.id === this.currentStageId);
    if (!dungeon) return;
    const groupIdx = dungeon.groupIdx;
    const isFinalBoss = this.floorIdx >= this.stageSteps;
    const bossKey = `${this.currentStageId}_${isFinalBoss ? 'final' : 'mini'}`;
    if (!s.bossDrops[bossKey]) {
      const matId = `break_mat_${groupIdx}`;
      this.addRunLoot(matId, 1);
      s.bossDrops[bossKey] = true;
    }
    if (!isFinalBoss && dungeon.stageIdx === 2) {
      const recipeKey = `recipe_${dungeon.groupIdx}`;
      if (!s.bossDrops[recipeKey]) {
        const recipeItem = `recipe_break_dan_${groupIdx}`;
        this.addRunLoot(recipeItem, 1);
        s.bossDrops[recipeKey] = true;
      }
    } else if (Math.random() < 0.35) {
      const recipeItem = `recipe_break_dan_${groupIdx}`;
      this.addRunLoot(recipeItem, 1);
    }
    const fragId = this.rollStFragDrop();
    if (fragId) this.addRunLoot(fragId, 1);
    this.runLoot.stone += 120 + groupIdx * 60;

    if (isFinalBoss) {
      const title = `${dungeon.chapter}·征服者`;
      gameState.addTitle(title);
    }
  }

  playNextBattleEvent() {
    if (!this.battle) return;
    const ev = this.battle.events[this.battle.idx];
    if (!ev) return;
    this.battle.idx += 1;

    if (ev.type === 'log') {
      this.pushBattleLog(ev.text);
      return;
    }

    if (ev.type === 'hitEnemy') {
      this.enemyHp = ev.enemyHp;
      this.enemyShake = 10;
      this.pushBattleLog(ev.text);
      return;
    }

    if (ev.type === 'hitPlayer') {
      this.playerHp = ev.playerHp;
      this.playerShake = 10;
      this.pushBattleLog(ev.text);
      this.syncPlayerHp();
      return;
    }

    if (ev.type === 'end') {
      this.battle.done = true;
      this.playerHp = ev.playerHp;
      this.enemyHp = ev.enemyHp;
      this.syncPlayerHp();
      this.pushBattleLog(ev.win ? '战斗胜利。' : '战斗失败。');

      // 战斗结束后清空战斗日志并回到探索（留一点点停留）
      this.pendingEnemy = null;
      // 用 tick 延迟清空
      this._clearBattleTick = 120;
      this.handleBattleEnd(ev.win, this.lastEnemy);
      return;
    }
  }
}
