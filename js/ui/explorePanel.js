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
    this.sceneLine = '';
    this.sceneLineTimer = 0;
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
    this.enemyInfoOpen = false;
    this.enemyInfoRect = null;
    this.storageOpen = false;
    this.storageButtons = [];
    this.pageGroup = 0;

    // 探索中的实时状态（沉浸式，不写入存档）
    this.playerMaxHp = 0;
    this.playerHp = 0;
    this.enemyMaxHp = 0;
    this.enemyHp = 0;
    this.enemyHpLag = 0;
    this.playerShake = 0;
    this.enemyShake = 0;

    // 战斗播放队列（仅状态播放，不展示战斗日志）
    this.battle = null; // { events:[], idx:number, tick:number, interval:number, done:boolean }
    this.battleCdView = null;
    this.cdRenderView = null;

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
    if (this.enemyHpLag > this.enemyHp) {
      const drop = Math.max(1, Math.floor((this.enemyHpLag - this.enemyHp) * 0.12));
      this.enemyHpLag = Math.max(this.enemyHp, this.enemyHpLag - drop);
    }

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
        this.battle = null;
        this.battleCdView = null;
        this.cdRenderView = null;
      }
    }
    this.updateCdRender();
    if (this.sceneLineTimer > 0) {
      this.sceneLineTimer -= 1;
      if (this.sceneLineTimer === 0) this.sceneLine = '';
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
        this.stPanel.gridScrollY = 0;
      }
      if (hit.type === 'nextChapter') {
        const maxGroup = Math.floor((DUNGEONS.length - 1) / 3);
        this.pageGroup = Math.min(maxGroup, (this.pageGroup || 0) + 1);
        this.stPanel.gridScrollY = 0;
      }
      if (this.stArea && y >= this.stArea.y1 && y <= this.stArea.y2) {
        this.stPanel.onTouch(x, y);
      }
      return;
    }

    if (this.mode === 'explore') {
      if (this.storageOpen) {
        const hitStorage = this.storageButtons.find(
          (b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2
        );
        if (!hitStorage) return;
        if (hitStorage.type === 'closeStorage') {
          this.storageOpen = false;
          return;
        }
        if (hitStorage.type === 'useDan') {
          this.useHealingDan();
          return;
        }
        if (hitStorage.type === 'useTp') {
          this.useTeleport();
          return;
        }
        return;
      }
      if (this.enemyInfoOpen) {
        if (!this.enemyInfoRect || x < this.enemyInfoRect.x1 || x > this.enemyInfoRect.x2 || y < this.enemyInfoRect.y1 || y > this.enemyInfoRect.y2) {
          this.enemyInfoOpen = false;
        }
        return;
      }
      const hit = this.buttons.find(
        (b) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2
      );
      if (!hit) return;
      if (hit.type === 'openStorage') {
        this.storageOpen = true;
        return;
      }
      if (hit.type === 'enemyInfo') {
        this.enemyInfoOpen = true;
        return;
      }

      // 战斗播放中禁止除查看信息外的其它交互
      if (this.battle && !this.battle.done) return;


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
    this.sceneLine = '';
    this.sceneLineTimer = 0;
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
    this.storageOpen = false;
    this.battleCdView = null;
    this.cdRenderView = null;

    // 初始化本次探索血量（持久化到角色）
    const s = gameState.state;
    gameState.refreshDerived();
    s.hp = s.maxHp;
    this.playerMaxHp = s.maxHp;
    this.playerHp = s.hp;
    this.enemyHpLag = 0;

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
    this.battleCdView = null;
    this.dead = false;
    this.adReviveUsed = false;
    this.bossDefeated = false;
    this.runDepth = 0;
    this.stageSteps = 0;
    this.runLoot = { stone: 0, items: {} };
    this.floorPlan = [];
    this.floorIdx = 0;
    this.exitPrompt = null;
    this.enemyInfoOpen = false;
    this.enemyInfoRect = null;
    this.storageOpen = false;
    this.storageButtons = [];
    this.battleCdView = null;
    this.cdRenderView = null;
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
      this.enemyHpLag = enemy.hp;
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
        this.pushExploreLog('你在角落拾起一张残破符箓：传送符（可在储物袋使用）。');
      }
    }

    if (this.playerHp <= 0) {
      this.handleDeath();
    }
  }

  pushExploreLog(text) {
    this.sceneLine = text;
    this.sceneLineTimer = 90;
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
    const skills = isBoss ? ['破甲', '怒击', '震魂'] : ['撕咬', '扑击'];
    return {
      name: isBoss ? `${dungeon.chapter}·首领` : `${dungeon.chapter}·妖物`,
      hp: Math.floor(base * (isBoss ? 6 : 2.2)),
      atk: Math.floor(base * (isBoss ? 1.4 : 0.6)),
      def: Math.floor(base * (isBoss ? 0.7 : 0.35)),
      spd: Math.floor(50 + dungeon.groupIdx * 8 + (isBoss ? 10 : 0)),
      shaqi: isBoss ? 10 + dungeon.groupIdx * 2 : 0,
      skills,
      skillDetails: skills.map(name => this.getEnemySkillMeta(name)),
      isBoss,
    };
  }

  getEnemySkillMeta(name) {
    const map = {
      撕咬: { name: '撕咬', dmg: 58, cd: 1.6, effect: '' },
      扑击: { name: '扑击', dmg: 72, cd: 2.0, effect: '' },
      破甲: { name: '破甲', dmg: 90, cd: 2.8, effect: '' },
      怒击: { name: '怒击', dmg: 105, cd: 3.2, effect: '' },
      震魂: { name: '震魂', dmg: 66, cd: 2.6, effect: '' },
    };
    return map[name] || { name, dmg: 60, cd: 2.2, effect: '' };
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
    this.stPanel.renderEmbedded(ctx, W, H, listBottom, maxH, groupIdx);
  }

  drawNavButton(ctx, cx, cy, label, type) {
    const w = 64;
    const h = 22;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const disabled = !type;
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
    const enemy = this.pendingEnemy || this.lastEnemy;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 16px serif';
    ctx.fillText(`【 ${title} 】`, W / 2, startY);
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 12px serif';
    ctx.fillText(`层数 ${this.runDepth}/${this.stageSteps}`, W / 2, startY + 20);
    if (this.pendingEnemy && enemy) {
      const barW = Math.min(W - 88, 276);
      const barX = (W - barW) / 2;
      const nameY = startY + 42;
      const barY = startY + 58;
      const ePct = Math.max(0, Math.min(1, this.enemyHp / Math.max(1, this.enemyMaxHp)));
      const eLagPct = Math.max(0, Math.min(1, this.enemyHpLag / Math.max(1, this.enemyMaxHp)));
      const shakeX = this.enemyShake > 0 ? ((this.enemyShake % 2 === 0) ? -2 : 2) : 0;
      ctx.fillStyle = '#caa566';
      ctx.font = 'bold 13px serif';
      ctx.fillText(`${enemy.name}`, W / 2, nameY);
      ctx.fillStyle = 'rgba(26,22,18,0.85)';
      ctx.fillRect(barX + shakeX, barY, barW, 12);
      ctx.fillStyle = '#8f6f43';
      ctx.fillRect(barX + shakeX, barY, Math.max(1, barW * eLagPct), 12);
      ctx.fillStyle = '#dfb36e';
      ctx.fillRect(barX + shakeX, barY, Math.max(1, barW * ePct), 12);
      ctx.strokeStyle = '#8a7357';
      ctx.strokeRect(barX + shakeX, barY, barW, 12);
      ctx.fillStyle = '#1f1b16';
      ctx.font = 'bold 11px serif';
      ctx.fillText(`${this.enemyHp}`, W / 2, barY + 9);
      this.buttons.push({ type: 'enemyInfo', x1: barX - 8, x2: barX + barW + 8, y1: nameY - 14, y2: barY + 20 });
    }

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

    if (this.pendingEnemy && enemy) {
      this.renderCombatScene(ctx, W, H, startY, enemy);
    } else {
      const lowerH = 192;
      const splitY = Math.max(startY + 156, H - lowerH);
      const logTop = startY + 48;
      const logBottom = splitY - 12;
      if (this.sceneLine) {
        const alpha = Math.max(0.2, this.sceneLineTimer / 90);
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(243,226,187,${alpha})`;
        ctx.font = 'bold 14px serif';
        ctx.fillText(this.sceneLine, W / 2, logTop + (logBottom - logTop) * 0.5);
      }

      ctx.strokeStyle = '#7a6a51';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(16, splitY);
      ctx.lineTo(W - 16, splitY);
      ctx.stroke();
      this.renderLowerPanel(ctx, W, H, splitY);
    }
    if (this.enemyInfoOpen) {
      this.renderEnemyInfoModal(ctx, W, H);
    }
    if (this.storageOpen) {
      this.renderStoragePage(ctx, W, H, startY);
    }
  }

  renderCombatScene(ctx, W, H, startY, enemy) {
    const arenaTop = startY + 104;
    const arenaBottom = H - 276;
    const arenaH = Math.max(150, arenaBottom - arenaTop);
    const arenaX = 18;
    const arenaW = W - 36;
    const centerX = W / 2;
    const centerY = arenaTop + arenaH * 0.56;

    ctx.save();
    const glow = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, arenaW * 0.5);
    glow.addColorStop(0, 'rgba(96,72,52,0.18)');
    glow.addColorStop(0.55, 'rgba(40,30,24,0.10)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(arenaX, arenaTop, arenaW, arenaH);

    ctx.fillStyle = 'rgba(16,14,12,0.36)';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 6, arenaW * 0.28, arenaH * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(184,156,105,0.24)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(arenaW, arenaH) * 0.13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(arenaW, arenaH) * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(243,226,187,0.1)';
    ctx.font = 'bold 40px serif';
    ctx.fillText('战', centerX, centerY + 11);

    if (this.sceneLine) {
      const alpha = Math.max(0.24, this.sceneLineTimer / 90);
      ctx.fillStyle = `rgba(243,226,187,${alpha})`;
      ctx.font = 'bold 12px serif';
      ctx.fillText(this.sceneLine, centerX, arenaTop + 22);
    }
    ctx.restore();

    this.renderCombatHud(ctx, W, H);
  }

  renderCombatHud(ctx, W, H) {
    const s = gameState.state;
    const deckH = 110;
    const deckTop = H - deckH - 18;
    const actionY = deckTop - 40;
    const infoY = actionY - 58;
    const hpBlockW = Math.min(188, W - 124);
    const hpBlockX = (W - hpBlockW) / 2;
    const hpPct = Math.max(0, Math.min(1, this.playerHp / Math.max(1, this.playerMaxHp)));

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0ddb1';
    ctx.font = 'bold 12px serif';
    ctx.fillText('我方', W / 2, infoY);

    ctx.fillStyle = 'rgba(26,22,18,0.88)';
    ctx.fillRect(hpBlockX, infoY + 10, hpBlockW, 12);
    ctx.fillStyle = '#e8cd87';
    ctx.fillRect(hpBlockX, infoY + 10, Math.max(2, hpBlockW * hpPct), 12);
    ctx.strokeStyle = '#8a7357';
    ctx.strokeRect(hpBlockX, infoY + 10, hpBlockW, 12);
    ctx.fillStyle = '#1f1b16';
    ctx.font = 'bold 11px serif';
    ctx.fillText(`${this.playerHp}`, W / 2, infoY + 20);

    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 11px serif';
    ctx.fillText(`煞气 ${s.shaqi || 0}`, W / 2, infoY + 40);

    this.renderCombatActionRow(ctx, W, H, actionY);
    this.renderPlayerSkillDeck(ctx, W, deckTop, deckH);
  }

  renderCombatActionRow(ctx, W, H, y) {
    const actions = [];
    if (this.dead) {
      actions.push({
        label: !this.adReviveUsed ? '广告复活' : '复活已用',
        type: !this.adReviveUsed ? 'adRevive' : null,
        tone: !this.adReviveUsed ? 'strong' : 'mute',
      });
      actions.push({ label: '认命离开', type: 'giveUp', tone: 'normal' });
      actions.push({ label: '储物袋', type: 'openStorage', tone: 'normal' });
    } else if (this.pendingEnemy) {
      if (this.exitPrompt === 'tp') {
        actions.push({ label: '返回', type: 'exitCancel', tone: 'normal' });
        actions.push({ label: '使用传送符', type: 'exitUseTp', tone: 'strong' });
        actions.push({ label: '储物袋', type: 'openStorage', tone: 'normal' });
      } else if (this.exitPrompt === 'noTp') {
        actions.push({ label: '返回', type: 'exitCancel', tone: 'normal' });
        actions.push({ label: '放弃战利品', type: 'exitConfirmAbandon', tone: 'normal' });
        actions.push({ label: '广告撤离', type: 'exitConfirmAd', tone: 'strong' });
      } else if (this.battle && !this.battle.done) {
        actions.push({ label: '自动', type: null, tone: 'mute' });
        actions.push({ label: '战斗中', type: null, tone: 'strong' });
        actions.push({ label: '储物袋', type: 'openStorage', tone: 'normal' });
      } else {
        actions.push({ label: '撤离', type: 'exitEnemy', tone: 'normal' });
        actions.push({ label: '战斗', type: 'fightEnemy', tone: 'strong' });
        actions.push({ label: '储物袋', type: 'openStorage', tone: 'normal' });
      }
    } else {
      actions.push({ label: this.autoStep ? '自动中' : '自动推进', type: 'auto', tone: this.autoStep ? 'strong' : 'normal' });
      actions.push({ label: '探索', type: 'step', tone: 'strong' });
      actions.push({ label: '储物袋', type: 'openStorage', tone: 'normal' });
    }

    const rowW = W - 40;
    const gap = 8;
    const btnW = (rowW - gap * 2) / 3;
    const x = 20;
    const h = 24;
    actions.forEach((action, idx) => {
      const bx = x + idx * (btnW + gap);
      ctx.fillStyle = action.tone === 'strong' ? 'rgba(112,86,52,0.88)' : 'rgba(44,37,31,0.78)';
      ctx.fillRect(bx, y, btnW, h);
      ctx.strokeStyle = action.tone === 'mute' ? '#655743' : '#b89c69';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(bx, y, btnW, h);
      ctx.textAlign = 'center';
      ctx.fillStyle = action.tone === 'mute' ? '#8d7d62' : '#f3e2bb';
      ctx.font = 'bold 11px serif';
      ctx.fillText(action.label, bx + btnW / 2, y + 16);
      if (action.type) {
        this.buttons.push({ type: action.type, x1: bx, x2: bx + btnW, y1: y, y2: y + h });
      }
    });
  }

  renderPlayerSkillDeck(ctx, W, topY, maxH) {
    const equipped = (gameState.state.equippedSt || []).filter(Boolean).slice(0, 6);
    const view = this.cdRenderView || this.battleCdView;
    const byName = new Map(((view && view.player) || []).map((item) => [item.name, item]));
    const cells = Array.from({ length: 6 }, (_, idx) => {
      const stId = equipped[idx] || null;
      if (!stId) return { empty: true };
      const st = SHENGTONG[stId];
      const row = byName.get(st?.name || stId);
      return {
        name: st?.name || stId,
        total: row ? row.total : null,
        remain: row ? row.remain : null,
        ready: row ? Math.max(0, 1 - Math.min(1, row.remain / Math.max(0.1, row.total || 1))) : null,
      };
    });

    const cols = 3;
    const gap = 8;
    const x = 20;
    const totalW = W - 40;
    const cellW = (totalW - gap * 2) / cols;
    const cellH = Math.max(46, Math.min(51, (maxH - gap) / 2));
    cells.forEach((cell, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = x + col * (cellW + gap);
      const cy = topY + row * (cellH + gap);
      ctx.fillStyle = 'rgba(23,20,17,0.94)';
      ctx.fillRect(cx, cy, cellW, cellH);
      ctx.strokeStyle = cell.empty ? '#5c5140' : '#d9c198';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cellW, cellH);

      if (cell.empty) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7d6e58';
        ctx.font = 'bold 11px serif';
        ctx.fillText('空位', cx + cellW / 2, cy + cellH / 2 + 4);
        return;
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#f3e2bb';
      ctx.font = 'bold 11px serif';
      ctx.fillText(this.trimText(ctx, cell.name, cellW - 12), cx + cellW / 2, cy + 20);

      if (cell.ready !== null) {
        ctx.fillStyle = 'rgba(28,24,20,0.94)';
        ctx.fillRect(cx + 8, cy + cellH - 14, cellW - 16, 6);
        ctx.fillStyle = cell.remain > 0 ? '#b08b57' : '#dfb36e';
        ctx.fillRect(cx + 8, cy + cellH - 14, Math.max(0, (cellW - 16) * cell.ready), 6);
        ctx.strokeStyle = '#8a7357';
        ctx.strokeRect(cx + 8, cy + cellH - 14, cellW - 16, 6);
      }
    });
  }

  renderLowerPanel(ctx, W, H, topY) {
    const s = gameState.state;
    const enemy = this.pendingEnemy || this.lastEnemy;

    const barY = H - 54;

    let y = topY + 14;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0ddb1';
    ctx.font = 'bold 12px serif';
    ctx.fillText('人物信息', W / 2, y);

    const hpPct = Math.max(0, Math.min(1, this.playerHp / Math.max(1, this.playerMaxHp)));
    const hpBarW = Math.min(W - 84, 288);
    const hpBarH = 10;
    const hpBarX = (W - hpBarW) / 2;
    y += 14;
    ctx.fillStyle = 'rgba(26,22,18,0.85)';
    ctx.fillRect(hpBarX, y, hpBarW, hpBarH);
    ctx.fillStyle = '#e8cd87';
    ctx.fillRect(hpBarX, y, Math.max(2, hpBarW * hpPct), hpBarH);
    ctx.strokeStyle = '#8a7357';
    ctx.strokeRect(hpBarX, y, hpBarW, hpBarH);
    ctx.fillStyle = '#1f1b16';
    ctx.font = 'bold 11px serif';
    ctx.fillText(`${this.playerHp}`, hpBarX + hpBarW / 2, y + 8);
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 11px serif';
    ctx.fillText(`煞气 ${s.shaqi || 0}`, W / 2, y + 42);

    const btnW = W / 3;
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px serif';

    if (this.exitPrompt) {
      ctx.fillStyle = '#e7d3a7';
      ctx.font = 'bold 12px serif';
      const msg = this.exitPrompt === 'tp' ? '使用传送符可带走战利品' : '无传送符将损失战利品';
      ctx.fillText(msg, W / 2, barY - 8);
    }

    if (this.dead) {
      if (!this.adReviveUsed) {
        ctx.fillStyle = '#f0d8a8';
        ctx.fillText('广告复活', btnW * 0.5, barY + 20);
        this.buttons.push({ type: 'adRevive', x1: 0, x2: btnW, y1: barY - 12, y2: barY + 26 });
      }
      ctx.fillStyle = '#cdb88a';
      ctx.fillText('认命离开', btnW * 1.5, barY + 20);
      this.buttons.push({ type: 'giveUp', x1: btnW, x2: btnW * 2, y1: barY - 12, y2: barY + 26 });
      ctx.fillStyle = '#e7d3a7';
      ctx.fillText('储物袋', btnW * 2.5, barY + 20);
      this.buttons.push({ type: 'openStorage', x1: btnW * 2, x2: btnW * 3, y1: barY - 12, y2: barY + 26 });
    } else if (this.pendingEnemy) {
      if (this.exitPrompt === 'tp') {
        ctx.fillStyle = '#cdb88a';
        ctx.fillText('返回', btnW * 0.5, barY + 20);
        this.buttons.push({ type: 'exitCancel', x1: 0, x2: btnW, y1: barY - 12, y2: barY + 26 });
        ctx.fillStyle = '#f3e2bb';
        ctx.fillText('使用传送符', btnW * 1.5, barY + 20);
        this.buttons.push({ type: 'exitUseTp', x1: btnW, x2: btnW * 2, y1: barY - 12, y2: barY + 26 });
      } else if (this.exitPrompt === 'noTp') {
        ctx.fillStyle = '#cdb88a';
        ctx.fillText('返回', btnW * 0.5, barY + 20);
        this.buttons.push({ type: 'exitCancel', x1: 0, x2: btnW, y1: barY - 12, y2: barY + 26 });
        ctx.fillStyle = '#cdb88a';
        ctx.fillText('放弃战利品', btnW * 1.5, barY + 20);
        this.buttons.push({ type: 'exitConfirmAbandon', x1: btnW, x2: btnW * 2, y1: barY - 12, y2: barY + 26 });
        ctx.fillStyle = '#f3e2bb';
        ctx.fillText('广告撤离', btnW * 2.5, barY + 20);
        this.buttons.push({ type: 'exitConfirmAd', x1: btnW * 2, x2: btnW * 3, y1: barY - 12, y2: barY + 26 });
      } else {
        ctx.fillStyle = '#cdb88a';
        ctx.fillText('撤离', btnW * 0.5, barY + 20);
        this.buttons.push({ type: 'exitEnemy', x1: 0, x2: btnW, y1: barY - 12, y2: barY + 26 });
        ctx.fillStyle = '#f3e2bb';
        ctx.fillText('战斗', btnW * 1.5, barY + 20);
        this.buttons.push({ type: 'fightEnemy', x1: btnW, x2: btnW * 2, y1: barY - 12, y2: barY + 26 });
        ctx.fillStyle = '#e7d3a7';
        ctx.fillText('储物袋', btnW * 2.5, barY + 20);
        this.buttons.push({ type: 'openStorage', x1: btnW * 2, x2: btnW * 3, y1: barY - 12, y2: barY + 26 });
      }
    } else {
      ctx.fillStyle = this.autoStep ? '#f0d8a8' : '#cdb88a';
      ctx.fillText('自动推进', btnW * 0.5, barY + 20);
      this.buttons.push({ type: 'auto', x1: 0, x2: btnW, y1: barY - 12, y2: barY + 26 });
      ctx.fillStyle = '#f0d8a8';
      ctx.fillText('探索', btnW * 1.5, barY + 20);
      this.buttons.push({ type: 'step', x1: btnW, x2: btnW * 2, y1: barY - 12, y2: barY + 26 });
      ctx.fillStyle = '#e7d3a7';
      ctx.fillText('储物袋', btnW * 2.5, barY + 20);
      this.buttons.push({ type: 'openStorage', x1: btnW * 2, x2: btnW * 3, y1: barY - 12, y2: barY + 26 });
    }

    if (this.autoStep && !this.dead && !this.pendingEnemy && (!this.battle || this.battle.done)) {
      this._autoTick += 1;
      if (this._autoTick >= 24) {
        this._autoTick = 0;
        this.doExploreStep(true);
      }
    }
  }

  renderCenterCdBoard(ctx, W, top, bottom) {
    if (!this.battleCdView) return;
    const h = Math.max(116, Math.min(152, bottom - top));
    const y = top + Math.max(0, (bottom - top - h) / 2);
    const x = 18;
    const w = W - 36;
    ctx.fillStyle = 'rgba(78,66,52,0.68)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#b89c69';
    ctx.lineWidth = 0.7;
    ctx.strokeRect(x, y, w, h);
    this.renderCdPanels(ctx, x + 10, y + 10, w - 20, h - 20);
  }

  renderStoragePage(ctx, W, H, startY) {
    this.storageButtons = [];
    const x = 20;
    const y = startY + 2;
    const w = W - 40;
    const h = H - y - 8;
    ctx.fillStyle = '#11100d';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#b89c69';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, w, h);
    this.drawBack(ctx, x + 12, y + 10, 52, 22, this.storageButtons, 'closeStorage');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 14px serif';
    ctx.fillText('储物袋', x + 76, y + 26);

    const rows = [];
    const dan = this.getBagCount('huiling');
    const tp = this.getBagCount('teleport');
    if (dan > 0) rows.push({ label: '回灵丹', value: `数量 ${dan}`, type: 'useDan', active: true });
    if (tp > 0) rows.push({ label: '传送符', value: `数量 ${tp}`, type: 'useTp', active: true });
    rows.push({ label: '灵石', value: `本层 ${this.runLoot.stone}`, type: null, active: false });
    Object.keys(this.runLoot.items || {}).forEach((id) => {
      const c = this.runLoot.items[id] || 0;
      if (c <= 0) return;
      rows.push({ label: ITEMS[id]?.name || id, value: `数量 ${c}`, type: null, active: false });
    });
    if (rows.length <= 1) rows.push({ label: '暂无额外战利品', value: '', type: null, active: false });

    const listTop = y + 56;
    rows.slice(0, 10).forEach((r, idx) => {
      const ry = listTop + idx * 32;
      ctx.textAlign = 'left';
      ctx.fillStyle = r.active ? '#f0ddb1' : '#d8c59b';
      ctx.font = 'bold 12px serif';
      ctx.fillText(`· ${r.label}`, x + 16, ry);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#bca680';
      ctx.fillText(r.value, x + w - 16, ry);
      ctx.strokeStyle = '#3a332d';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x + 12, ry + 10);
      ctx.lineTo(x + w - 12, ry + 10);
      ctx.stroke();
      if (r.type && r.active) {
        this.storageButtons.push({ type: r.type, x1: x + 8, x2: x + w - 8, y1: ry - 16, y2: ry + 10 });
      }
    });
  }

  renderCdPanels(ctx, x, y, w, h) {
    const view = this.cdRenderView || this.battleCdView;
    if (!view) return;
    const playerRows = (view.player || []).slice(0, 6);
    const enemyRows = (view.enemy || []).slice(0, 6);
    const cols = 3;
    const gap = 6;
    const rowGap = 8;
    const cellW = (w - gap * (cols - 1)) / cols;
    const rowsPerSide = Math.max(1, Math.ceil(Math.max(playerRows.length, enemyRows.length) / cols));
    const totalRows = rowsPerSide * 2;
    const cellH = Math.max(32, Math.min(42, (h - rowGap * (totalRows - 1)) / totalRows));
    const playerTop = y + Math.max(0, (h - (cellH * totalRows + rowGap * (totalRows - 1))) / 2);
    const enemyTop = playerTop + rowsPerSide * (cellH + rowGap);
    this.drawCdGridBlock(ctx, x, playerTop, cellW, cellH, gap, rowGap, cols, playerRows);
    this.drawCdGridBlock(ctx, x, enemyTop, cellW, cellH, gap, rowGap, cols, enemyRows);
  }

  drawCdGridBlock(ctx, x, y, cellW, cellH, gap, rowGap, cols, rows) {
    const list = (rows || []).filter(Boolean);
    list.forEach((r, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = x + col * (cellW + gap);
      const cy = y + row * (cellH + rowGap);
      const total = Math.max(0.1, r.total || 1);
      const remain = Math.max(0, r.remain || 0);
      const readyPct = 1 - Math.min(1, remain / total);
      ctx.strokeStyle = '#8e7a5b';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cx, cy, cellW, cellH);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f0ddb1';
      ctx.font = 'bold 10px serif';
      ctx.fillText(this.trimText(ctx, r.name, cellW - 10), cx + cellW / 2, cy + 14);
      ctx.fillStyle = 'rgba(26,22,18,0.85)';
      ctx.fillRect(cx + 6, cy + cellH - 14, cellW - 12, 6);
      ctx.fillStyle = remain > 0 ? '#b49364' : '#e8cd87';
      ctx.fillRect(cx + 6, cy + cellH - 14, Math.max(0, (cellW - 12) * readyPct), 6);
      ctx.strokeStyle = '#8a7357';
      ctx.strokeRect(cx + 6, cy + cellH - 14, cellW - 12, 6);
    });
  }

  updateCdRender() {
    if (!this.battleCdView) {
      this.cdRenderView = null;
      return;
    }
    if (!this.cdRenderView) {
      this.cdRenderView = {
        player: (this.battleCdView.player || []).map(r => ({ ...r })),
        enemy: (this.battleCdView.enemy || []).map(r => ({ ...r })),
      };
      return;
    }
    const step = 1 / 60;
    ['player', 'enemy'].forEach((side) => {
      const target = this.battleCdView[side] || [];
      const current = this.cdRenderView[side] || [];
      const next = target.map((t) => {
        const c = current.find((x) => x.name === t.name);
        if (!c) return { ...t };
        const remain = c.remain > t.remain ? Math.max(t.remain, c.remain - step) : t.remain;
        return { name: t.name, total: t.total, remain };
      });
      this.cdRenderView[side] = next;
    });
  }

  trimText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    const dots = '...';
    let out = '';
    const chars = text.split('');
    for (let i = 0; i < chars.length; i++) {
      const next = out + chars[i];
      if (ctx.measureText(next + dots).width > maxW) break;
      out = next;
    }
    return out + dots;
  }

  renderEnemyInfoModal(ctx, W, H) {
    const enemy = this.pendingEnemy || this.lastEnemy;
    if (!enemy) return;
    const boxW = Math.min(W - 56, 276);
    const boxH = 146;
    const x = (W - boxW) / 2;
    const y = H / 2 - boxH / 2;
    this.enemyInfoRect = { x1: x, x2: x + boxW, y1: y, y2: y + boxH };

    ctx.fillStyle = 'rgba(78,66,52,0.96)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = '#b89c69';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, boxW, boxH);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 13px serif';
    ctx.fillText(enemy.name, W / 2, y + 22);
    ctx.fillStyle = '#e2cfa3';
    ctx.font = 'bold 12px serif';
    ctx.fillText(`气血 ${this.enemyHp}`, W / 2, y + 46);
    ctx.fillText(`煞气 ${enemy.shaqi || 0}`, W / 2, y + 64);

    ctx.fillStyle = '#f0ddb1';
    ctx.font = 'bold 12px serif';
    ctx.fillText('怪物技能', W / 2, y + 84);
    ctx.fillStyle = '#d8c59b';
    ctx.font = 'bold 11px serif';
    const skills = enemy.skillDetails || [];
    skills.slice(0, 2).forEach((sk, idx) => {
      ctx.fillText(`${sk.name}｜伤害：${sk.dmg}｜CD:${(sk.cd || 2).toFixed(1)}s`, W / 2, y + 102 + idx * 14);
    });
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
      skillDetails: enemyCfg.skillDetails || [],
      isBoss: !!isBoss,
    };
  }

  makeInitialCdView() {
    const s = gameState.state;
    const stIds = (s.equippedSt || []).filter(Boolean);
    const pSpd = s.totalSpd || s.spd || 80;
    const player = stIds.map((id) => {
      const st = SHENGTONG[id];
      const stState = (s.shengtong || []).find(t => t.id === id) || { lv: 1 };
      return {
        name: st?.name || id,
        total: this.getPlayerSkillCdSec(st, stState.lv, pSpd),
        remain: 0,
      };
    });
    const enemySkills = (this.pendingEnemy?.skills || this.lastEnemy?.skills || []);
    const enemy = enemySkills.map((name) => {
      const meta = this.getEnemySkillMeta(name);
      return { name: meta.name, total: meta.cd || 2.0, remain: 0 };
    });
    return { player, enemy };
  }

  startBattleWithPending() {
    if (!this.pendingEnemy) return;
    this.enemyMaxHp = this.pendingEnemy.hp;
    this.enemyHp = this.pendingEnemy.hp;
    this.enemyHpLag = this.pendingEnemy.hp;
    this.lastEnemy = this.pendingEnemy;

    const events = this.buildBattleEvents({
      enemyName: this.pendingEnemy.name,
      enemyHp: this.enemyMaxHp,
      enemyAtk: this.pendingEnemy.atk,
      enemyDef: this.pendingEnemy.def,
      enemySpd: this.pendingEnemy.spd || 60,
      enemyShaqi: this.pendingEnemy.shaqi || 0,
      enemySkills: this.pendingEnemy.skills || [],
    });

    this.battle = { events, idx: 0, tick: 0, interval: 64, done: false };
    this.battleCdView = null;
    this.cdRenderView = null;
    const s = gameState.state;
    if (!s.guide.firstBattle) {
      s.guide.firstBattle = true;
      gameState.save();
    }
  }

  buildBattleEvents(enemy) {
    const s = gameState.state;
    const stIds = (s.equippedSt || []).filter(Boolean);
    const pSpd = s.totalSpd || s.spd || 80;
    const pShaqi = Math.max(0, s.shaqi || 0);
    const eShaqi = Math.max(0, enemy.enemyShaqi || 0);
    const pCritRateBase = Math.min(1, pShaqi / 1000);
    const eCritRate = Math.min(1, eShaqi / 1000);
    const pTakenMul = 1 + pShaqi * 0.0001;
    const eTakenMul = 1 + eShaqi * 0.0001;
    const pCritDmgMult = 1.5;
    const dodgeBase = 0.08;
    const basePlayerDodge = Math.min(0.3, Math.max(0.05, dodgeBase + (pSpd - (enemy.enemySpd || 60)) * 0.001));
    const eDodge = Math.min(0.25, Math.max(0.05, dodgeBase + ((enemy.enemySpd || 60) - pSpd) * 0.001));

    let pHp = this.playerHp;
    let eHp = enemy.enemyHp;
    const events = [];
    const enemySkillPool = (enemy.enemySkills || []).length
      ? enemy.enemySkills
      : (enemy.enemySkillDetails || []).map(sk => sk.name);
    const stCdReady = {};
    const enemyCdReady = {};
    let playerPtr = 0;
    let enemyPtr = 0;
    let playerNextAt = 0;
    let enemyNextAt = 0;
    let simTime = 0;
    const maxActions = 120;
    const buildCdView = (nowSec) => {
      const player = stIds.map((id) => {
        const cfg = SHENGTONG[id];
        const stState = (s.shengtong || []).find(t => t.id === id) || { lv: 1 };
        const total = this.getPlayerSkillCdSec(cfg, stState.lv, pSpd);
        const readyAt = stCdReady[id] || 0;
        return { name: cfg?.name || id, total, remain: Math.max(0, readyAt - nowSec) };
      });
      const enemyRows = enemySkillPool.map((name) => {
        const meta = this.getEnemySkillMeta(name);
        const total = meta.cd || 2.0;
        const readyAt = enemyCdReady[name] || 0;
        return { name: meta.name, total, remain: Math.max(0, readyAt - nowSec) };
      });
      return { player, enemy: enemyRows };
    };

    for (let act = 0; act < maxActions; act++) {
      if (pHp <= 0 || eHp <= 0) break;
      const playerTurn = playerNextAt <= enemyNextAt;
      simTime = playerTurn ? playerNextAt : enemyNextAt;

      if (playerTurn) {
        let pickedStId = null;
        let pickedCfg = null;
        let pickedState = null;
        if (stIds.length) {
          for (let i = 0; i < stIds.length; i++) {
            const idx = (playerPtr + i) % stIds.length;
            const candId = stIds[idx];
            const readyAt = stCdReady[candId] || 0;
            if (readyAt <= simTime) {
              pickedStId = candId;
              pickedCfg = SHENGTONG[candId];
              pickedState = (s.shengtong || []).find(t => t.id === candId) || null;
              playerPtr = (idx + 1) % stIds.length;
              break;
            }
          }
        }

        const stLv = pickedState?.lv || 1;
        const lvMul = gameState.getStPowerMul(stLv);
        const stName = pickedCfg?.name || '平常一击';
        const stType = pickedCfg?.skillType || 'direct';
        const pCritRate = pCritRateBase;
        const upMsgs = pickedStId ? gameState.recordStUse(pickedStId, 1) : [];
        if (pickedStId) {
          stCdReady[pickedStId] = simTime + this.getPlayerSkillCdSec(pickedCfg, stLv, pSpd);
        }

        const enemyDodge = Math.random() < eDodge;
        if (enemyDodge) {
          events.push({ type: 'log', text: `「${stName}」落空`, cdView: buildCdView(simTime) });
        } else {
          const baseDamage = Math.max(1, Math.floor((pickedCfg?.dmgPct || 1) * 100 * lvMul));
          let dmg = this.calcSkillDamage(baseDamage);
          const crit = Math.random() < pCritRate;
          if (crit) dmg = Math.max(1, Math.floor(dmg * pCritDmgMult));
          dmg = Math.max(1, Math.floor(dmg * eTakenMul));
          eHp = Math.max(0, eHp - dmg);
          events.push({ type: 'hitEnemy', dmg, crit, enemyHp: eHp, text: `你发动「${stName}」，造成 `, cdView: buildCdView(simTime) });

          if (stType === 'heal_hit' && pickedCfg?.healPct) {
            const heal = Math.max(1, Math.floor(this.playerMaxHp * pickedCfg.healPct * lvMul));
            pHp = Math.min(this.playerMaxHp, pHp + heal);
            events.push({ type: 'log', text: `回复 ${heal} 气血`, cdView: buildCdView(simTime) });
          }
        }
        if (upMsgs.length) upMsgs.forEach(msg => events.push({ type: 'log', text: msg, cdView: buildCdView(simTime) }));

        playerNextAt = simTime + this.getActorActionCdSec(pSpd);
      } else {
        let pickedEnemySkill = null;
        let pickedMeta = null;
        if (enemySkillPool.length) {
          for (let i = 0; i < enemySkillPool.length; i++) {
            const idx = (enemyPtr + i) % enemySkillPool.length;
            const cand = enemySkillPool[idx];
            const readyAt = enemyCdReady[cand] || 0;
            if (readyAt <= simTime) {
              pickedEnemySkill = cand;
              pickedMeta = this.getEnemySkillMeta(cand);
              enemyPtr = (idx + 1) % enemySkillPool.length;
              break;
            }
          }
        }
        if (!pickedMeta) pickedMeta = { name: '扑杀', dmg: Math.max(1, Math.floor((enemy.enemyAtk || 50) * 0.9)), cd: 1.6, effect: '' };
        if (pickedEnemySkill) {
          enemyCdReady[pickedEnemySkill] = simTime + (pickedMeta.cd || 2.0);
        }

        const playerDodge = Math.random() < Math.min(0.45, basePlayerDodge);
        if (playerDodge) {
          events.push({ type: 'log', text: '你闪避了敌方攻击', cdView: buildCdView(simTime) });
        } else {
          const enemyBaseDamage = Math.max(1, Math.floor(pickedMeta.dmg || (enemy.enemyAtk || 50) * 0.9));
          let dmg = this.calcEnemyDamage(enemyBaseDamage);
          const crit = Math.random() < eCritRate;
          if (crit) dmg = Math.max(1, Math.floor(dmg * 1.5));
          dmg = Math.max(1, Math.floor(dmg * pTakenMul));
          pHp = Math.max(0, pHp - dmg);
          events.push({ type: 'hitPlayer', dmg, crit, playerHp: pHp, text: `${enemy.enemyName}发动「${pickedMeta.name}」，造成 `, cdView: buildCdView(simTime) });
        }

        enemyNextAt = simTime + this.getActorActionCdSec(enemy.enemySpd || 60);
      }
    }

    events.push({ type: 'end', win: eHp <= 0 && pHp > 0, playerHp: pHp, enemyHp: eHp });
    return events;
  }

  getActorActionCdSec(spd) {
    const s = Math.max(30, spd || 60);
    return Math.max(0.5, 1.35 * (100 / (100 + s * 0.6)));
  }

  getPlayerSkillCdSec(stCfg, stLv, spd) {
    const base = Math.max(0.9, stCfg?.cd || 1.8);
    const lvAdj = Math.max(0.82, 1 - (Math.max(1, stLv) - 1) * 0.03);
    const spdAdj = Math.max(0.75, 1.2 - Math.max(30, spd || 60) / 400);
    return Math.max(0.9, base * lvAdj * spdAdj);
  }

  calcSkillDamage(baseDamage) {
    return Math.max(1, Math.floor(baseDamage * (0.92 + Math.random() * 0.16)));
  }

  calcEnemyDamage(baseDamage) {
    return Math.max(1, Math.floor(baseDamage * (0.92 + Math.random() * 0.16)));
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
    if (ev.cdView) this.battleCdView = ev.cdView;

    if (ev.type === 'log') {
      return;
    }

    if (ev.type === 'hitEnemy') {
      this.enemyHp = ev.enemyHp;
      if (this.enemyHpLag < this.enemyHp) this.enemyHpLag = this.enemyHp;
      this.enemyShake = 10;
      return;
    }

    if (ev.type === 'hitPlayer') {
      this.playerHp = ev.playerHp;
      this.playerShake = 10;
      this.syncPlayerHp();
      return;
    }

    if (ev.type === 'end') {
      this.battle.done = true;
      this.playerHp = ev.playerHp;
      this.enemyHp = ev.enemyHp;
      this.enemyHpLag = Math.max(this.enemyHpLag, this.enemyHp);
      this.syncPlayerHp();

      this.pendingEnemy = null;
      this._clearBattleTick = 48;
      this.handleBattleEnd(ev.win, this.lastEnemy);
      return;
    }
  }

  drawBack(ctx, x, y, w, h, buttonPool, type) {
    ctx.fillStyle = 'rgba(76,64,50,0.85)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#b79b67';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3e2bb';
    ctx.font = 'bold 11px serif';
    ctx.fillText('←', x + w / 2, y + 15);
    buttonPool.push({ type, x1: x, x2: x + w, y1: y, y2: y + h });
  }
}
