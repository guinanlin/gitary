/**
 * Provide Apps - Lazy Loading Version
 *
 * 使用延迟加载器注册所有 App Provider，实现按需加载
 *
 * 改造前：所有 12 个 App Provider 在启动时同步导入和注册
 * 改造后：仅注册文件类型匹配规则，用户打开文件时才加载对应插件
 */

import { lazyOpenerService, LazyOpenerConfig } from "@/services/lazy-opener.service";
import { createPlugin } from "xbook/common/createPlugin";
import { t } from "@/i18n/utils";
import { DEFAULT_MIND_MAP_DATA } from "@/components/mind-map/constants";
import { FILE_TYPES } from "@/plugins/space/folderTreeService/constants/fileTypes";

/**
 * 延迟加载的 App 配置列表
 *
 * 每个配置包含：
 * - id: opener 的唯一标识
 * - label: 显示名称
 * - icon: 图标
 * - match: 文件扩展名匹配规则
 * - priority: 优先级
 * - loader: 动态导入函数
 * - exportKey: 导出的 key（如果不是 default）
 * - templates: 文件模板（可选）
 */
const lazyAppConfigs: LazyOpenerConfig[] = [
  // 脑图编辑器
  {
    id: "mind-flow",
    label: t("apps.mindFlow"),
    icon: "Brain",
    showInTreeMenu: true,
    match: [".mindflow.json", ".mindmap.json"],
    priority: 100,
    loader: () => import("./provide-mind-flow"),
    exportKey: "provideMindFlow",
    templates: [
      {
        id: "new-mindflow",
        label: t("apps.newMindMap"),
        defaultFileName: "Untitled.mindmap.json",
        initialContent: JSON.stringify(DEFAULT_MIND_MAP_DATA, null, 2),
        icon: "Brain",
      },
    ],
  },

  // 流程图编辑器 (ReactFlow + ELK)
  {
    id: "flow-demo",
    label: t("apps.reactFlow"),
    icon: "GitBranch",
    showInTreeMenu: true,
    match: [".flowdemo.json"],
    priority: 100,
    loader: () => import("./provide-react-flow"),
    exportKey: "provideFlowDemo",
    templates: [
      {
        id: "new-react-flow",
        label: t("reactFlow.newFile"),
        defaultFileName: "Untitled.flowdemo.json",
        initialContent: JSON.stringify({ nodes: [], edges: [] }, null, 2),
        icon: "GitBranch",
      },
    ],
  },

  // Excalidraw 绘图
  {
    id: "excalidraw",
    label: t("apps.excalidraw"),
    icon: "AiOutlineFileAdd",
    showInTreeMenu: true,
    match: [".excalidraw.json", ".excalidraw"],
    priority: 100,
    loader: () => import("./provide-excalidraw"),
    exportKey: "provideExcalidraw",
    templates: [
      {
        id: "new-excalidraw",
        label: t("excalidraw.newFile"),
        defaultFileName: "Untitled.excalidraw.json",
        initialContent: "{}",
        icon: "AiOutlineFileAdd",
      },
    ],
  },

  // Drawio 绘图
  {
    id: "drawio",
    label: t("apps.drawio"),
    icon: "Network",
    showInTreeMenu: true,
    match: [".drawio"],
    priority: 100,
    loader: () => import("./provide-drawio"),
    exportKey: "provideDrawio",
    templates: [
      {
        id: "new-drawio",
        label: t("drawio.newFile"),
        defaultFileName: "Untitled.drawio",
        initialContent: '<mxfile><diagram></diagram></mxfile>',
        icon: "Network",
      },
    ],
  },

  // 会议纪要
  {
    id: "meeting-minutes",
    label: t("apps.meetingMinutes"),
    match: [".meeting.md", ".meetingminutes.md"],
    priority: 100,
    loader: () => import("./provide-app-meeting-minutes"),
    exportKey: "provideAppMeetingMinutes",
    templates: [
      {
        id: "new-meeting-minutes",
        label: t("apps.newMeetingMinutes"),
        defaultFileName: () => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = now.getHours();
          const minutes = now.getMinutes();
          const seconds = now.getSeconds();
          const secondsInDay = hours * 3600 + minutes * 60 + seconds;
          return `${year}-${month}-${day}-${secondsInDay}.meeting.md`;
        },
        initialContent: `# 会议纪要

**会议主题：**

**会议时间：**

**会议地点 / 会议方式（线上/线下）：**

**会议主持人：**

**记录人：**

**参会人员：**

---

## 一、会议背景

> 简要说明召开本次会议的原因、目标。

---

## 二、讨论议题

### 议题 1：xxxx

- **讨论要点：**

- **结论 / 决策：**

---

## 三、行动项（Action Items）

| 序号 | 任务内容 | 负责人 | 截止时间 | 状态 |
|------|----------|--------|-----------|--------|
| 1 | | | | 未开始/进行中/完成 |

---

## 四、风险与待解决问题（若有）

- 风险点：

- 需要额外确认的问题：

---

## 五、下次会议事项（可选）

- 预计时间：

- 需准备的资料 / 输入：
`,
        icon: "AiOutlineFileMarkdown",
      },
    ],
  },

  // PPT 制作
  {
    id: "make-ppt",
    label: t("apps.makePPT.name"),
    match: [".ppt.md", ".presentation.md"],
    priority: 100,
    loader: () => import("./provide-app-make-ppt"),
    exportKey: "provideAppMakePPT",
    templates: [
      {
        id: "new-ppt",
        label: t("apps.newPPT"),
        defaultFileName: () => {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = now.getHours();
          const minutes = now.getMinutes();
          const seconds = now.getSeconds();
          const secondsInDay = hours * 3600 + minutes * 60 + seconds;
          return `${year}-${month}-${day}-${secondsInDay}.ppt.md`;
        },
        initialContent: `# 项目演示

## 执行摘要
*   项目概述
*   关键里程碑
*   战略路线图

---

## 市场分析
*   市场需求分析
*   竞争对手分析
*   用户采用趋势

---

## 技术架构
*   核心技术栈
*   系统架构设计
*   安全与合规协议`,
        icon: "AiOutlineFileMarkdown",
      },
    ],
  },

  // AI 简历
  {
    id: "ai-resume",
    label: t("apps.aiResume"),
    match: [".airesume.json"],
    priority: 100,
    loader: () => import("./provide-app-ai-resume"),
    exportKey: "provideAppAIResume",
  },

  // AI 语录卡
  {
    id: "ai-quotes",
    label: t("apps.aiQuotes"),
    match: [".aiquotes.json"],
    priority: 100,
    loader: () => import("./provide-app-ai-quotes"),
    exportKey: "provideAppAIQuotes",
  },

  // AI 故事卡
  {
    id: "ai-story-cards",
    label: t("apps.aiStoryCards"),
    match: [".aicard.json"],
    priority: 100,
    loader: () => import("./provide-app-ai-story-cards"),
    exportKey: "provideAppAIStoryCards",
  },

  // 流式笔记
  {
    id: "streaming-note",
    label: t("apps.streamingNote"),
    match: [".streaming.json"],
    priority: 100,
    loader: () => import("./provide-streaming-note"),
    exportKey: "provideStreamingNote",
  },

  // Zen Notes
  {
    id: "zen-notes",
    label: t("apps.zenNotes"),
    match: [".zennotes.json"],
    priority: 100,
    loader: () => import("./provide-zen-notes"),
    exportKey: "provideZenNotes",
  },

  // 社区
  {
    id: "community",
    label: t("apps.community"),
    match: [".community.json"],
    priority: 100,
    loader: () => import("./provide-community"),
    exportKey: "provideCommunity",
  },
];

/**
 * provideApps 插件 - 延迟加载版本
 *
 * 不再同步导入所有 App Provider，而是注册延迟加载配置
 */
export const provideApps = createPlugin({
  initilize(_xbook) {
    // 注册所有延迟加载的 App
    lazyAppConfigs.forEach((config) => {
      lazyOpenerService.registerLazy(config);
    });

    console.log(
      `[provideApps] Registered ${lazyAppConfigs.length} lazy-loaded app providers`
    );
  },
});
