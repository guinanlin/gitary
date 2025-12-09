import { EventKeys } from "@/constants/eventKeys";
import { folderTreeService } from "@/services/folder-tree.service";
import { StorageKeys } from "@/constants/storageKeys";
import { storage } from "@/toolkit/utils/storage";
import { spaceHelper } from "@/helpers/space.helper";
import { SpaceDef } from "@/toolkit/types/space";
import { createPlugin } from "xbook/common/createPlugin";
import { spaceService } from "@/services/space.service";
import { t } from "@/i18n/utils";
import React from "react";

export default createPlugin({
  initilize(xbook) {
    // Use a simple storage cache to restore last focused space on startup
    const LAST_FOCUSED_SPACE_KEY = StorageKeys.LastFocusedSpaceId;
    let prevSpaces: SpaceDef[] = [];
    xbook.eventBus.on(EventKeys.Space.SpacesChanged, (spaces: SpaceDef[]) => {
      const prevIds = prevSpaces.map((p) => p.id);
      const ids = spaces.map((s) => s.id);
      const spacesAdded = spaces.filter((s) => !prevIds.includes(s.id));
      const spacesRemoved = prevSpaces.filter((s) => !ids.includes(s.id));
      const spacesAddedOrUpdated = spaces.filter(
        (s) => !prevSpaces.includes(s)
      );
      // const spacesUpdated = spacesAddedOrUpdated.filter(
      //   (s) => !spacesAdded.includes(s)
      // );
      prevSpaces = spaces;
      spacesAddedOrUpdated.forEach((space) => {
        folderTreeService.add(space);
      });
      spacesRemoved.forEach((space) => {
        folderTreeService.remove(space.id);
      });

      // Ensure there is an active view; prefer cached last focused space when available
      const list = xbook.layoutService.sidebar.getViewList();
      const activeId = xbook.layoutService.sidebar.getActiveViewId();
      const activeValid = list.some((v) => v.id === activeId);
      if (!activeValid) {
        let nextId: string | undefined;
        const cached = storage.get(LAST_FOCUSED_SPACE_KEY);
        if (cached && list.some((v) => v.id === cached)) {
          nextId = cached;
        }
        if (!nextId) nextId = list[0]?.id;
        if (nextId) xbook.layoutService.sidebar.setActiveViewId(nextId);
      }
    });
    xbook.eventBus.on(
      EventKeys.ActivityBar.DragItem,
      ({ prevIndex: idx1, nextIndex: idx2 }) => {
        const store = spaceHelper.getStore();
        store.getActions().reduce((data) => {
          if (idx1 === idx2) return data;
          const before = data.slice(0, Math.min(idx1, idx2));
          const after = data.slice(Math.max(idx1, idx2) + 1);
          const middle = data.slice(
            Math.min(idx1, idx2) + 1,
            Math.max(idx1, idx2)
          );
          const source = data[idx1];
          const target = data[idx2];
          let res;
          if (idx1 < idx2) {
            res = [...before, ...middle, target, source, ...after];
          } else {
            res = [...before, source, target, ...middle, ...after];
          }
          return res;
        });
      }
    );

    const invalidSpaceNotifications = new Set<string>();

    xbook.eventBus.on(EventKeys.Space.InvalidSpace, ({ spaceId, owner, repo }) => {
      if (invalidSpaceNotifications.has(spaceId)) {
        return;
      }
      invalidSpaceNotifications.add(spaceId);

      const space = spaceService.getSpace(spaceId);
      if (!space) return;

      xbook.notificationService.warning({
        title: t("space.repositoryNotFound"),
        description: t("space.deleteInvalidSpace", { owner, repo }),
        duration: 10000,
        isClosable: true,
      });

      setTimeout(() => {
        if (!spaceService.getSpace(spaceId)) {
          invalidSpaceNotifications.delete(spaceId);
          return;
        }

        const modal = xbook.modalService.createModal({
          title: t("space.repositoryNotFound"),
          content: React.createElement(
            "div",
            { style: { padding: "1rem 0" } },
            React.createElement(
              "p",
              { style: { marginBottom: "1rem" } },
              t("space.deleteInvalidSpace", { owner, repo })
            )
          ),
          okText: t("space.deleteSpace"),
          cancelText: t("common.cancel"),
          footer: true,
          onOk: () => {
            spaceService.getSpaceStore().getActions().delete(spaceId);
            invalidSpaceNotifications.delete(spaceId);
            xbook.notificationService.success({
              title: t("space.spaceDeleted"),
              duration: 3000,
            });
            modal.close();
          },
          onCancel: () => {
            invalidSpaceNotifications.delete(spaceId);
            modal.close();
          },
        });
        modal.open();
      }, 1000);
    });
  },
});
