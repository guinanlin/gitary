import { openerService } from "@/services/opener.service";
import { AppMakePPT } from "./app";
import { createPlugin } from "xbook/common/createPlugin";
import { t } from "@/i18n/utils";

const PPT_TEMPLATE = `# 项目演示

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
*   安全与合规协议`;

export const provideAppMakePPT = createPlugin({
  initilize(xbook) {
    xbook.componentService.register("make-ppt", AppMakePPT);
    openerService.register({
      id: "make-ppt",
      label: t("apps.makePPT.name"),
      match: [".ppt.md", ".presentation.md"],
      priority: 100,
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
          initialContent: PPT_TEMPLATE,
          icon: "AiOutlineFileMarkdown",
        },
      ],
      init: (uri) => {
        const getFileName = (uri: string) => {
          return uri.split("/").pop() ?? "unknown";
        };
        xbook.layoutService.pageBox.addPage({
          id: `make-ppt:${uri}`,
          title: `${t("apps.makePPT.name")}:${getFileName(uri)}`,
          viewData: {
            type: "make-ppt",
            props: { uri },
          },
        });
      },
    });
  },
});


