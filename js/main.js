import { storage } from './storage';
import { gameState } from './gameState';
import { RolePanel } from './ui/rolePanel';
import { CavePanel } from './ui/cavePanel';
import { ExplorePanel } from './ui/explorePanel';
import { BagPanel } from './ui/bagPanel';
import { AchievePanel } from './ui/achievePanel';

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
      achieve: new AchievePanel(this)
    };

    this.tabs = ['role', 'explore', 'cave', 'bag', 'achieve'];
    this.bindEvents();
    this.loop();
  }

  bindEvents() {
    wx.onTouchStart((e) => {
      const { clientX: x, clientY: y } = e.touches[0];
      const NAV_H = 70;
      const explorePanel = this.panels.explore;
      const immersiveExplore = this.activeTab === 'explore'
        && explorePanel
        && typeof explorePanel.isImmersive === 'function'
        && explorePanel.isImmersive();
      if (!immersiveExplore && y > this.H - NAV_H) {
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
    
    // 1. 全局背景：彻底刷黑 (清空上一帧所有残影)
    ctx.fillStyle = '#111012';
    ctx.fillRect(0, 0, W, H);

    // 实时更新修炼与挂机等逻辑
    gameState.update();

    // 2. 渲染面板内容
    this.panels[this.activeTab].update?.();
    this.panels[this.activeTab].render(ctx, W, H, this.headerH);

    // 3. 渲染底栏导航（探索关卡时进入沉浸模式，不显示底栏）
    const explorePanel = this.panels.explore;
    const immersiveExplore = this.activeTab === 'explore'
      && explorePanel
      && typeof explorePanel.isImmersive === 'function'
      && explorePanel.isImmersive();

    if (!immersiveExplore) {
      this.renderBottomNav();
    }
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
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(W - 20, y);
    ctx.stroke();

    const labels = { role:'凡身', explore:'历练', cave:'洞府', bag:'纳戒', achieve:'成就' };

    this.tabs.forEach((tab, i) => {
      const isAct = this.activeTab === tab;
      ctx.textAlign = 'center';
      ctx.fillStyle = isAct ? '#f3e2bb' : '#b59f75';
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
