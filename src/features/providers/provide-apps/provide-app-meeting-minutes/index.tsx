import { openerService } from "@/services/opener.service";
import { AppMeetingMinutes } from "./app";
import { createPlugin } from "xbook/common/createPlugin";
import { t } from "@/i18n/utils";

const MEETING_MINUTES_TEMPLATE = `# 会议纪要  

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

  -  

- **结论 / 决策：**  

  -  



### 议题 2：xxxx

- **讨论要点：**  

  -  

- **结论 / 决策：**  

  -  



### 议题 3：xxxx

- **讨论要点：**  

  -  

- **结论 / 决策：**  

  -  



---

## 三、行动项（Action Items）

| 序号 | 任务内容 | 负责人 | 截止时间 | 状态 |
|------|----------|--------|-----------|--------|
| 1 | | | | 未开始/进行中/完成 |
| 2 | | | | |
| 3 | | | | |



---

## 四、风险与待解决问题（若有）

- 风险点：  

- 需要额外确认的问题：  



---

## 五、下次会议事项（可选）

- 预计时间：  

- 需准备的资料 / 输入：  



---

## 六、附件（可选）

- 链接：  

- 文档：  

`;

export const provideAppMeetingMinutes = createPlugin({
  initilize(xbook) {
    xbook.componentService.register("meeting-minutes", AppMeetingMinutes);
    openerService.register({
      id: "meeting-minutes",
      label: t("apps.meetingMinutes"),
      match: [".meeting.md", ".meetingminutes.md"],
      priority: 100,
      templates: [
        {
          id: "new-meeting-minutes",
          label: t("apps.newMeetingMinutes"),
          defaultFileName: "会议纪要.meeting.md",
          initialContent: MEETING_MINUTES_TEMPLATE,
          icon: "AiOutlineFileMarkdown",
        },
      ],
      init: (uri) => {
        const getFileName = (uri: string) => {
          return uri.split("/").pop() ?? "unknown";
        };
        xbook.layoutService.pageBox.addPage({
          id: `meeting-minutes:${uri}`,
          title: `${t("apps.meetingMinutes")}:${getFileName(uri)}`,
          viewData: {
            type: "meeting-minutes",
            props: { uri },
          },
        });
      },
    });
  },
});

