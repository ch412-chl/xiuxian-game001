# ComfyUI本地启动说明

更新时间：2026-03-18 09:42:00

## 1. 当前安装位置
- ComfyUI 目录：`/Users/cuihua/Documents/ai/ComfyUI`
- Python 虚拟环境：`/Users/cuihua/Documents/ai/ComfyUI/.venv`
- Python 版本：`3.11.15`

## 2. 当前状态
- ComfyUI 源码：已下载
- `.venv`：已创建
- `requirements.txt`：已安装完成
- 下一步：下载模型并启动

## 3. 启动命令
```bash
cd /Users/cuihua/Documents/ai/ComfyUI
source .venv/bin/activate
python main.py
```

## 4. 首次启动前建议
建议先准备基础模型目录：
- `models/checkpoints/`
- `models/vae/`
- `models/loras/`

如果当前仅做首批资源验证，优先准备：
1. 一个基础 SDXL 或兼容模型
2. 一个适合东方幻想 / 插画风格的模型

## 5. 与当前项目的衔接
首批目标仍保持不变：
- 界面资源：13 条
- 战斗背景：6 条
- 妖物立绘：18 条

出图后仍需按项目规范：
1. 放入 `assets/` 对应目录
2. 回写映射 JSON 状态
3. 更新 `资源待办.md`
4. 再进入代码接入阶段
