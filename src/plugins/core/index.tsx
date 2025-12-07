import base from "@/plugins/core/base";
import commonUtilityProviders from "@/plugins/core/common-utility-providers";
import { registerLazyLoadingPlaceholder } from "@/plugins/core/register-lazy-loading-placeholder";
import { createPlugin } from "xbook/common/createPlugin";

export const pluginCore = createPlugin({
  initilize(xbook) {
    xbook.pluginService.use([
      commonUtilityProviders,
      base,
      // 注册延迟加载占位组件，必须在 provideApps 之前
      registerLazyLoadingPlaceholder,
    ]);
  },
});
