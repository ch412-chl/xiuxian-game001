# 修仙版地下城堡

本项目是一个以微信小游戏为载体的修仙题材地牢推进项目，当前仓库同时承载运行代码、产品文档、实现规范、数值真源与自动化规则。

## 新会话入口
每次新会话默认按以下顺序读取：
1. `CODEX_RULES.md`
2. `HANDOFF.md`
3. `README.md`
4. `product/prd_doc/current_prd.md`
5. `product/prd_doc/module_map.md`
6. 目标目录下的 `README.md`
7. 对应真源文件
8. 若任务涉及编码，先读 `product/实现规范/实现前自检流程.md`
9. 最后才看代码文件

## 目录说明
- `js/`：微信小游戏运行代码
- `product/`：产品需求、实现规范、数值真源、分析报告、自动化规则
- `assets/`：资源与资源映射文件
- `tmp/`：临时产物与实验文件，不默认作为正式输入

## 当前使用约定
- 不默认采信 `product/历史归档/` 下文件
- 不在未确认边界前全仓扫描
- 每轮结束只检查 `HANDOFF.md` 与本次实际影响到的目录 `README.md` 是否需要更新

## 相关入口
- `product/目录索引.md`
- `product/prd_doc/README.md`
- `product/实现规范/README.md`
- `product/界面交互/README.md`
- `product/数值策划/README.md`
- `product/自动化体系/README.md`
