/**
 * Plugin: Register Lazy Loading Placeholder Component
 *
 * 注册延迟加载占位组件，必须在 provideApps 之前加载
 */

import { LazyLoadingPlaceholder } from "@/components/lazy-loading-placeholder";
import { createPlugin } from "xbook/common/createPlugin";

export const registerLazyLoadingPlaceholder = createPlugin({
    initilize(xbook) {
        xbook.componentService.register(
            "lazy-loading-placeholder",
            LazyLoadingPlaceholder
        );
    },
});
