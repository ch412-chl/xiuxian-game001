import { storage } from './storage';
import { gameState } from './gameState';
import { RolePanel } from './ui/rolePanel';
import { CavePanel } from './ui/cavePanel';
import { ExplorePanel } from './ui/explorePanel';
import { BagPanel } from './ui/bagPanel';
import { AchievePanel } from './ui/achievePanel';
import { MonsterPanel } from './ui/monsterPanel';

export default class Main {
  constructor() {
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.W = this.canvas.width;
    this.H = this.canvas.height;

    // 获取微信胶囊位置，确保 UI 避开顶部遮挡
    this.menuRect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : { bottom: 80 };
    this.headerH = this.menuRect.bottom + 10;

    storage.init();
    gameState.init();
    gameState.calcOffline();

    this.activeTab = 'role';
    this.panels = {
      role: new RolePanel(this),
      explore: new ExplorePanel(this),
      cave: new CavePanel(this),
      bag: new BagPanel(this),
      achieve: new AchievePanel(this),
      monster: new MonsterPanel(this)
    };

    this.tabs = ['role', 'explore', 'cave'];
    this.bindEvents();
    this.loop();
  }

  bindEvents() {
    wx.onTouchStart((e) => {
      const { clientX: x, clientY: y } = e.touches[0];
      const NAV_H = 70;
      if (this.shouldShowBottomNav() && y > this.H - NAV_H) {
        const tabW = this.W / this.tabs.length;
        const idx = Math.min(this.tabs.length - 1, Math.floor(x / tabW));
        this.activeTab = this.tabs[idx] || this.activeTab;
      } else {
        this.panels[this.activeTab].onTouch(x, y);
      }
    });
  }

  loop() {
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  render() {
    const { ctx, W, H } = this;
    
    // 1. 全局背景：提亮为暖灰渐变，降低压暗感
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#252028');
    bg.addColorStop(1, '#1d1a1f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 实时更新修炼与挂机等逻辑
    gameState.update();

    // 2. 渲染面板内容
    this.panels[this.activeTab].update?.();
    this.panels[this.activeTab].render(ctx, W, H, this.headerH);

    // 3. 渲染底栏导航（探索关卡时进入沉浸模式，不显示底栏）
    if (this.shouldShowBottomNav()) {
      this.renderBottomNav();
    }
  }

  shouldShowBottomNav() {
    if (this.activeTab === 'bag' || this.activeTab === 'achieve' || this.activeTab === 'monster') return false;
    const explorePanel = this.panels.explore;
    const immersiveExplore = this.activeTab === 'explore'
      && explorePanel
      && typeof explorePanel.isImmersive === 'function'
      && explorePanel.isImmersive();
    return !immersiveExplore;
  }

  renderHeader() {
    // 顶部不再显示境界和灵石信息，留白以避免遮挡内容
  }

  renderBottomNav() {
    const { ctx, W, H } = this;
    const NAV_H = 70;
    const y = H - NAV_H;
    const tabW = W / this.tabs.length;

    // 底部线条
    ctx.strokeStyle = '#544b3f';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(W - 20, y);
    ctx.stroke();

    const labels = { role:'人物', explore:'历练', cave:'洞府' };

    this.tabs.forEach((tab, i) => {
      const isAct = this.activeTab === tab;
      ctx.textAlign = 'center';
      ctx.fillStyle = isAct ? '#f4dfb0' : '#c8af86';
      ctx.font = isAct ? 'bold 15px serif' : 'bold 14px serif';
      ctx.fillText(labels[tab], i * tabW + tabW / 2, y + 35);
      
      // 选中的点
      if (isAct) {
        ctx.beginPath();
        ctx.arc(i * tabW + tabW / 2, y + 50, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}
