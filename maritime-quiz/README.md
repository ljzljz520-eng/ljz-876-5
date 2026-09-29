# ⚓ 航证刷题 · 航海船员证书刷题站

面向海船船员适任证书考试的刷题 Web 应用，支持按 **驾驶 / 轮机 / 无线电** 类别练习，
专项统计 **海图题、避碰题、英语听力** 正确率，**完全离线可刷题**，回到网络环境自动/手动同步进度，
每题解析均标注**适用考试版本**。

## 功能一览

| 需求 | 实现 |
| --- | --- |
| 按轮机、驾驶、无线电类别练习 | 首页类别入口 + 练习页类别/题型筛选；用户档案记录报考类别 |
| 记录海图题、避碰题、英语听力正确率 | 统计页按题型专项 + 类别双维度统计（正确率按"每题最新一次作答"口径） |
| 离线刷题后回网同步 | Service Worker 缓存应用外壳与题库（SWR 策略）；IndexedDB 存作答；`online` 事件/手动触发同步；按 `offlineId` 幂等去重，服务端重算对错 |
| 题目解析标注适用考试版本 | 每题 `versions` 关联版本目录（现行/旧版对照），解析下方以徽章展示并悬浮显示全称 |
| 错题重练 | 最新一次答错的题自动入错题本，支持单题重练/分类重练/全部重练，答对自动移出 |
| 英语听力 | Web Speech API 朗读（IMO SMCP 风格 VHF/机舱通话），可反复听、可查看原文；无 TTS 时自动显示原文 |
| 海图题 | 内嵌 SVG 示意海图（灯质图式、水深底质注记等），离线可用 |

内置题库 26 题：海图题 5、避碰题 5、英语听力 7（驾驶 3 / 轮机 2 / 无线电 2）、专业知识 9，
覆盖 2022 版考试大纲、避碰规则 2001 修正案、GMDSS 现行版、《航海英语听力与会话》2021 版、MARPOL 现行版等 9 个版本条目。

## 技术栈

- **后端**：Node.js + Express 5，零数据库（JSON 文件持久化 + 防抖落盘）
- **前端**：原生 HTML/CSS/JS（无构建步骤），Hash 路由 SPA
- **PWA/离线**：Service Worker（预缓存 + stale-while-revalidate）、IndexedDB、Web App Manifest
- **听力**：Web Speech API（SpeechSynthesis）

## 快速开始

```bash
cd maritime-quiz
npm install        # 仅依赖 express（环境中已预装可跳过）
npm start          # http://localhost:3000
```

> 离线能力需要在 **https** 或 **localhost** 下访问。首次打开后，断网仍可进入并刷题。

## 离线 / 同步机制说明

```mermaid
flowchart LR
  A[答题] --> B[即时判对错写入 IndexedDB pending=1]
  B --> C{在线?}
  C -- 否 --> D[顶栏显示"N条待同步"]
  C -- 是 --> E[POST /api/sync 批量上报]
  D -- online 事件 --> E
  E --> F[服务端按题库重算对错<br/>offlineId 幂等去重]
  F --> G[回写服务端统计<br/>本地标记 pending=0]
```

- 同一条离线记录重复上报不会重复计数（`offlineId` 去重）。
- 对错以服务端题库为准，防止本地题库版本陈旧导致统计偏差。
- 多设备使用同一用户 ID 时，以服务器统计为校正基准（统计页可查看）。

## HTTP API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/bootstrap` | 题库 + 考试版本目录（SW 会缓存，离线可用） |
| POST | `/api/users` | 注册/更新船员档案 `{id,name,role}` |
| POST | `/api/sync` | 批量同步作答 `{userId, attempts:[{offlineId,questionId,selected,createdAt}]}`，返回去重结果与最新统计 |
| GET | `/api/stats/:userId` | 个人专项/类别正确率与错题列表 |
| GET | `/api/health` | 健康检查 |

## 题库数据格式

`data/questions.js`：

```js
{
  id: 'CH02',                    // 题号
  category: 'deck',              // deck 驾驶 | engine 轮机 | radio 无线电
  type: 'chart',                 // chart 海图题 | colreg 避碰题 | listening 听力 | knowledge 专业
  stem: '…',                     // 题干
  options: ['…','…','…','…'],
  answer: 1,                     // 正确选项下标
  explanation: '…',              // 解析
  versions: ['chart-2022'],      // 适用考试版本 id，见 data/versions.js
  media: { kind: 'svg'|'speech', svg?, text?, lang? } // 可选
}
```

新增题目只需在 `data/questions.js` 追加记录并在 `versions.js` 维护版本目录，
前端刷新（SW 后台更新）即生效，无需改表结构。

## 目录结构

```
maritime-quiz/
├── server.js              # Express 入口与 API
├── lib/store.js           # JSON 持久化、幂等同步、统计口径
├── data/
│   ├── questions.js       # 题库（26 题示例）
│   ├── versions.js        # 考试版本目录
│   └── db.json            # 运行后生成（已 gitignore）
└── public/
    ├── index.html
    ├── sw.js              # Service Worker
    ├── manifest.webmanifest
    ├── css/styles.css
    ├── js/
    │   ├── app.js         # 路由/刷题/统计/同步
    │   ├── db.js          # IndexedDB 封装
    │   ├── api.js         # HTTP 客户端
    │   └── speech.js      # 听力朗读
    └── icons/             # SVG/PNG 应用图标
```

> 题目的海图/录音为教学示意，正式备考请以海事局最新版考试大纲与现行海图、法规出版物为准。
