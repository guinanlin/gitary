import { createFolderTreePlugin } from "@/plugins/space/folderTreeService/plugins/base";
import { TreeEventKeys, TreeServicePoints } from "@/plugins/space/folderTreeService/tokens";
import { FolderTreeNode } from "@/plugins/space/folderTreeService/types";
import { t } from "@/i18n/utils";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { FileUploadDialog } from "../components/file-upload-dialog";

interface DialogState {
  open: boolean;
  targetNode: FolderTreeNode | null;
}

export default createFolderTreePlugin({
  addOptions() {
    return {
      dialogContainer: null as HTMLElement | null,
      dialogRoot: null as Root | null,
      dialogState: { open: false, targetNode: null } as DialogState,
    };
  },
  activate({ viewSystem, eventBus, serviceBus }) {
    const treeService = serviceBus.createProxy(TreeServicePoints.TreeService);
    const space = treeService.getSpace();

    viewSystem.addNodeMenuItems([
      {
        id: "uploadFile",
        key: "uploadFile",
        name: t("tree.uploadFile"),
        label: t("tree.uploadFile"),
        event: TreeEventKeys.UploadFileAt.name,
        when: "type === 'dir'",
        icon: "AiOutlineUpload",
        group: "add",
      },
    ]);

    const renderDialog = () => {
      const dialogState = this.options.dialogState;
      if (!dialogState) return;

      const { open, targetNode } = dialogState;

      if (!open || !targetNode) {
        if (this.options.dialogRoot) {
          this.options.dialogRoot.render(React.createElement(React.Fragment));
        }
        return;
      }

      if (!this.options.dialogContainer) {
        this.options.dialogContainer = document.createElement("div");
        this.options.dialogContainer.id = "file-upload-dialog-container";
        document.body.appendChild(this.options.dialogContainer);
        this.options.dialogRoot = createRoot(this.options.dialogContainer);
      }

      if (!this.options.dialogRoot) return;

      this.options.dialogRoot.render(
        React.createElement(FileUploadDialog, {
          open: open,
          onOpenChange: (newOpen: boolean) => {
            if (this.options.dialogState) {
              this.options.dialogState.open = newOpen;
              if (!newOpen) {
                this.options.dialogState.targetNode = null;
              }
              renderDialog();
            }
          },
          targetNode: targetNode,
          spaceId: space.id,
          serviceBus: serviceBus,
          onSuccess: () => {
            if (this.options.dialogState) {
              this.options.dialogState.open = false;
              this.options.dialogState.targetNode = null;
              renderDialog();
            }
          },
        })
      );
    };

    const handleUploadFile = ({ node }: { node: FolderTreeNode }) => {
      if (!this.options.dialogState) return;
      this.options.dialogState.targetNode = node;
      this.options.dialogState.open = true;
      renderDialog();
    };

    const off = eventBus.on(TreeEventKeys.UploadFileAt, handleUploadFile);

    return {
      unsubscribe: () => {
        off();
      },
    };
  },
  deactivate() {
    if (this.options.dialogRoot) {
      this.options.dialogRoot.unmount();
      this.options.dialogRoot = null;
    }
    if (this.options.dialogContainer && this.options.dialogContainer.parentNode) {
      document.body.removeChild(this.options.dialogContainer);
      this.options.dialogContainer = null;
    }
    if (this.options.dialogState) {
      this.options.dialogState.open = false;
      this.options.dialogState.targetNode = null;
    }
  },
});

