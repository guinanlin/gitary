import { openerService } from "@/services/opener.service";
import { AppFlowDemo } from "./app";
import { createPlugin } from "xbook/common/createPlugin";
import { t } from "@/i18n/utils";
import { FILE_TYPES } from "@/plugins/space/folderTreeService/constants/fileTypes";

const REACT_FLOW_COLOR = FILE_TYPES.reactFlow.color;

export const provideFlowDemo = createPlugin({
  initilize(xbook) {
    xbook.componentService.register("flow-demo", AppFlowDemo);

    openerService.register({
      id: "flow-demo",
      label: t("apps.reactFlow"),
      showInTreeMenu: true,
      icon: "GitBranch",
      match: [".flowdemo.json"],
      priority: 100,
      templates: [
        {
          id: "new-react-flow",
          label: t("reactFlow.newFile"),
          defaultFileName: "Untitled.flowdemo.json",
          initialContent: JSON.stringify({ nodes: [], edges: [] }, null, 2),
          icon: "GitBranch",
        },
      ],
      init: (uri) => {
        const getFileName = (value: string) => {
          return value.split("/").pop() ?? "unknown";
        };
        xbook.layoutService.pageBox.addPage({
          id: `flow-demo:${uri}`,
          title: `${t("apps.reactFlow")}:${getFileName(uri)}`,
          viewData: {
            type: "flow-demo",
            props: { uri },
          },
        });
      },
    });
  },
}); 
