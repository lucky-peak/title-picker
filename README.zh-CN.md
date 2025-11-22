# Title Picker

轻量的浏览器扩展（Chrome MV3），用于为任意页面设置自定义标签标题。支持通过选择页面元素或手动输入保存标题，并可按 URL 白名单启用“自动恢复”。

阅读英文版：[English README](README.md)

## 特性
- 选择元素作为标题：开启选择模式后，点击页面元素即可将其文本保存为当前标签页标题
- 手动输入标题：打开输入弹窗，直接输入并保存标题
- 按 URL 白名单自动恢复：仅当你为当前地址显式开启自动恢复、且该地址已有已保存标题时，后续访问会自动应用该标题
- 快捷键支持：`Alt+T` 开启选择模式；`Alt+Shift+T` 打开输入弹窗
- 零后端依赖：所有数据存储在浏览器本地 `chrome.storage.local`

## 目录结构
```
.
├── manifest.json
└── src/
    ├── background/
    │   └── index.js            # Service Worker（后台脚本）
    └── content/
        ├── selector.js         # 选择元素并保存标题
        ├── ui.js               # 输入弹窗设置标题
        └── restore.js          # 基于白名单的自动恢复逻辑
```

## 安装
1. 打开 Chrome 扩展管理：`chrome://extensions`
2. 开启右上角“开发者模式”
3. 点击“加载已解压的扩展程序”，选择本项目根目录

## 权限说明
- `scripting`：向当前标签页注入选择器/输入弹窗脚本
- `activeTab`：针对当前激活标签页执行脚本
- `storage`：在本地存储（`chrome.storage.local`）保存标题与白名单
- `contextMenus`：在扩展图标菜单中提供“自动恢复当前链接”开关

## 使用
- 选择元素保存标题：按下 `Alt+T`，高亮目标元素并点击，即保存该元素的文本为标题
- 输入标题保存：按下 `Alt+Shift+T`，在弹窗中输入并确认
- 启用自动恢复（按 URL）：点击扩展图标，在菜单勾选“自动恢复当前链接”。白名单采用精确的 `location.href`，勾选后该地址将自动应用已保存标题

## 行为细节
- 标题保存：选择器与输入弹窗均将 `location.href` 映射到用户指定的标题，写入 `chrome.storage.local`
- 自动恢复：`autoRestoreUrls` 保存已启用自动恢复的 URL 白名单（数组）；仅当白名单包含当前 `location.href` 且该地址存在已保存标题时，`restore.js` 才会在页面加载后设置 `document.title`
- 语言与文案：菜单文案与弹窗文案会根据浏览器语言（中文/英文）自动切换

## 开发
- 架构：Manifest V3，后台为 Service Worker，内容脚本按职责拆分
- 调试：通过“加载已解压的扩展程序”直接调试，无需构建
- 快捷键配置：位于 `manifest.json` 中的 `commands`
- 代码位置参考：后台菜单与注入 `src/background/index.js`，选择器 `src/content/selector.js`，输入弹窗 `src/content/ui.js`，自动恢复 `src/content/restore.js`

## 隐私
- 所有数据均保存在本地浏览器存储中，不会上传到任何服务器
- 存储键包括：`<location.href> -> title` 映射，`autoRestoreUrls` 白名单数组

## 贡献
欢迎提交 Issue 与 Pull Request。建议在提交前确保：
- 遵循现有代码风格与文件组织
- 功能在最新 Chrome 稳定版下验证通过

## 许可证
MIT License
