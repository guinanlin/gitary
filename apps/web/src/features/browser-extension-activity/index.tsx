import { createPlugin } from "xbook/common/createPlugin";
import { BrowserExtensionShortcut } from "./components/browser-extension-shortcut";
import { AiOutlineChrome } from "react-icons/ai";
import { t } from "@/i18n/utils";

export const browserExtensionActivity = createPlugin({
  initilize(xbook) {
    xbook.componentService.register("AiOutlineChrome", AiOutlineChrome);
    xbook.shortcutService.addShortcut({
      id: "browser-extension",
      name: t("browserExtension.name"),
      order: 9998,
      icon: "AiOutlineChrome",
    });
    xbook.componentService.register("shortcut:browser-extension", BrowserExtensionShortcut);
  },
});

