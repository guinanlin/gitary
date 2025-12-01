import { DEFAULT_MIND_MAP_DATA } from "@/components/mind-map/constants";
import { openerService } from "@/services/opener.service";
import { AppMindFlow } from "./app";
import { createPlugin } from "xbook/common/createPlugin";
import { t } from "@/i18n/utils";
import { FILE_TYPES } from "@/plugins/space/folderTreeService/constants/fileTypes";

const MINDMAP_COLOR = FILE_TYPES.mindMap.color;

export const provideMindFlow = createPlugin({
  initilize(xbook) {
    xbook.componentService.register("mind-flow", AppMindFlow);
    openerService.register({
      id: "mind-flow",
      label: t("apps.mindFlow"),
      showInTreeMenu: true,
      icon: "Brain",
      match: [".mindflow.json", ".mindmap.json"],
      priority: 100,
      templates: [
        {
          id: "new-mindflow",
          label: t("apps.newMindMap"),
          defaultFileName: "Untitled.mindmap.json",
          initialContent: JSON.stringify(DEFAULT_MIND_MAP_DATA, null, 2),
          icon: "Brain",
        },
      ],
      init: (uri) => {
        const getFileName = (value: string) => {
          return value.split("/").pop() ?? "unknown";
        };
        xbook.layoutService.pageBox.addPage({
          id: `mind-flow:${uri}`,
          title: `${t("apps.mindFlow")}:${getFileName(uri)}`,
          viewData: {
            type: "mind-flow",
            props: { uri },
          },
        });
      },
    });
  },
}); 
