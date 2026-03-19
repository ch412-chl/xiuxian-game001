# 修仙版地下城堡

本项目是一个以微信小游戏为载体的修仙题材地牢推进项目，当前仓库同时承载产品文档、实现规范、数值真源、自动化说明与运行代码。

## 新会话入口

每次新会话默认按以下顺序读取：

1. `CODEX_RULES.md`
2. `HANDOFF.md`
3. `README.md`
4. 目标目录下的 `README.md`
5. 对应真源文件
6. 若任务涉及编码，先读 `product/实现规范/实现前自检流程.md`
7. 再看相关代码文件

说明：
- `CODEX_RULES.md`：项目级长期规范
- `HANDOFF.md`：当前阶段接力入口
- 各目录 `README.md`：该目录的局部说明与读取建议

## 目录说明

- `js/`：微信小游戏运行代码
- `product/`：产品需求、实现规范、数值策划、分析报告、自动化体系等文档真源
- `assets/`：资源与资源映射文件
- `tmp/`：临时产物与实验文件

## 当前使用约定

- 不默认采信 `历史归档/` 下文件
- 不在未确认边界前全仓扫描
- 每轮会话结束后，检查 `HANDOFF.md` 与本次实际影响到的目标目录 `README.md` 是否需要增量维护

## 相关入口

- `product/产品需求/README.md`
- `product/界面交互/README.md`
- `product/数值策划/README.md`
- `product/实现规范/README.md`
- `product/自动化体系/README.md`
- `assets/README.md`

## 文档地图

- `product/目录索引.md`：文档总地图，进入文档体系后再读
