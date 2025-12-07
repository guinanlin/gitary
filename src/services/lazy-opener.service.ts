/**
 * Lazy Opener Service
 *
 * 延迟加载器服务：支持编辑器插件的按需加载
 *
 * 核心功能：
 * 1. 注册延迟加载的 opener 配置
 * 2. 在用户打开文件时动态加载对应插件
 * 3. 加载期间显示 Loading 占位组件
 */

import { openerService, FileOpenerOptions } from "@/services/opener.service";
import { FolderTreeNode } from "@/plugins/space/folderTreeService/types";
import { spaceHelper } from "@/helpers/space.helper";
import { device } from "xbook/common/device";
import xbook from "xbook/index";

export type LazyOpenerConfig = {
  /**
   * Unique id of this opener
   */
  id: string;
  /**
   * Human readable label
   */
  label?: string;
  /**
   * Optional icon id
   */
  icon?: string;
  /**
   * Whether to show in tree menu
   */
  showInTreeMenu?: boolean;
  /**
   * File extensions or patterns to match
   */
  match: string[] | RegExp[] | ((s: string) => boolean);
  /**
   * Priority for opener selection (higher = preferred)
   */
  priority?: number;
  /**
   * Dynamic import loader that returns the plugin
   */
  loader: () => Promise<{ default?: any;[key: string]: any }>;
  /**
   * Key to extract from the loaded module (if not using default export)
   */
  exportKey?: string;
  /**
   * Optional file templates
   */
  templates?: FileOpenerOptions["templates"];
};

type LoadingState = "idle" | "loading" | "loaded" | "error";

class LazyOpenerService {
  private configs: Map<string, LazyOpenerConfig> = new Map();
  private loadingStates: Map<string, LoadingState> = new Map();
  private loadedPlugins: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  /**
   * Register a lazy-loadable opener
   */
  registerLazy = (config: LazyOpenerConfig): void => {
    this.configs.set(config.id, config);
    this.loadingStates.set(config.id, "idle");

    // Register a placeholder opener that triggers lazy loading
    openerService.register({
      id: config.id,
      label: config.label,
      icon: config.icon,
      showInTreeMenu: config.showInTreeMenu,
      match: config.match,
      priority: config.priority,
      templates: config.templates,
      init: (uri: string) => {
        this.handleOpen(config.id, uri);
      },
    });
  };

  /**
   * Handle file open - load plugin if needed, then open the file
   */
  private handleOpen = async (openerId: string, uri: string): Promise<void> => {
    const config = this.configs.get(openerId);
    if (!config) {
      console.error(`[LazyOpenerService] No config found for opener: ${openerId}`);
      return;
    }

    const state = this.loadingStates.get(openerId);

    // Already loaded - just open the file
    if (state === "loaded") {
      this.openWithLoadedPlugin(openerId, uri);
      return;
    }

    // Currently loading - wait for it to finish
    if (state === "loading") {
      const existingPromise = this.loadingPromises.get(openerId);
      if (existingPromise) {
        await existingPromise;
        this.openWithLoadedPlugin(openerId, uri);
      }
      return;
    }

    // Need to load - show loading page first
    this.showLoadingPage(openerId, uri, config.label || openerId);

    // Start loading
    this.loadingStates.set(openerId, "loading");
    const loadPromise = this.loadPlugin(config);
    this.loadingPromises.set(openerId, loadPromise);

    try {
      await loadPromise;
      this.loadingStates.set(openerId, "loaded");

      // Close loading page and open the actual file
      this.closeLoadingPage(openerId, uri);
      this.openWithLoadedPlugin(openerId, uri);
    } catch (error) {
      console.error(`[LazyOpenerService] Failed to load plugin: ${openerId}`, error);
      this.loadingStates.set(openerId, "error");
      this.showErrorPage(openerId, uri, error);
    } finally {
      this.loadingPromises.delete(openerId);
    }
  };

  /**
   * Load the plugin module
   */
  private loadPlugin = async (config: LazyOpenerConfig): Promise<void> => {
    const module = await config.loader();
    const plugin = config.exportKey ? module[config.exportKey] : (module.default || module);

    // Activate the plugin
    if (plugin && typeof plugin.activate === "function") {
      plugin.activate(xbook);
    } else if (plugin && typeof plugin.initilize === "function") {
      // Support initilize (typo in original codebase)
      plugin.initilize(xbook);
    }

    this.loadedPlugins.set(config.id, plugin);
  };

  /**
   * Open file with the loaded plugin
   */
  private openWithLoadedPlugin = (openerId: string, uri: string): void => {
    const config = this.configs.get(openerId);
    if (!config) {
      console.error(`[LazyOpenerService] No config found for opener: ${openerId}`);
      return;
    }

    // Get filename from uri
    const getFileName = (value: string) => {
      return value.split("/").pop() ?? "unknown";
    };

    // The plugin has registered its component during activation
    // We directly add a page with the component type
    xbook.layoutService.pageBox.addPage({
      id: `${openerId}:${uri}`,
      title: `${config.label || openerId}:${getFileName(uri)}`,
      viewData: {
        type: openerId,
        props: { uri },
      },
    });
  };

  /**
   * Show a loading placeholder page
   */
  private showLoadingPage = (openerId: string, uri: string, label: string): void => {
    const pageId = `lazy-loading:${openerId}:${uri}`;
    xbook.layoutService.pageBox.addPage({
      id: pageId,
      title: `Loading ${label}...`,
      status: "loading",
      viewData: {
        type: "lazy-loading-placeholder",
        props: {
          openerId,
          uri,
          label,
          status: "loading",
        },
      },
    });
  };

  /**
   * Close the loading placeholder page
   */
  private closeLoadingPage = (openerId: string, uri: string): void => {
    const pageId = `lazy-loading:${openerId}:${uri}`;
    xbook.layoutService.pageBox.removePage(pageId);
  };

  /**
   * Show an error page when loading fails
   */
  private showErrorPage = (openerId: string, uri: string, error: unknown): void => {
    const pageId = `lazy-loading:${openerId}:${uri}`;
    xbook.layoutService.pageBox.updatePage({
      id: pageId,
      title: `Failed to load`,
      status: undefined,
      viewData: {
        type: "lazy-loading-placeholder",
        props: {
          openerId,
          uri,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
          onRetry: () => {
            this.loadingStates.set(openerId, "idle");
            this.closeLoadingPage(openerId, uri);
            this.handleOpen(openerId, uri);
          },
        },
      },
    });
  };

  /**
   * Check if an opener is loaded
   */
  isLoaded = (openerId: string): boolean => {
    return this.loadingStates.get(openerId) === "loaded";
  };

  /**
   * Get loading state of an opener
   */
  getLoadingState = (openerId: string): LoadingState => {
    return this.loadingStates.get(openerId) || "idle";
  };

  /**
   * Preload an opener without opening a file
   */
  preload = async (openerId: string): Promise<void> => {
    const config = this.configs.get(openerId);
    if (!config) return;

    const state = this.loadingStates.get(openerId);
    if (state === "loaded" || state === "loading") return;

    this.loadingStates.set(openerId, "loading");
    try {
      await this.loadPlugin(config);
      this.loadingStates.set(openerId, "loaded");
    } catch (error) {
      console.error(`[LazyOpenerService] Failed to preload plugin: ${openerId}`, error);
      this.loadingStates.set(openerId, "error");
    }
  };
}

// Export singleton instance
export const lazyOpenerService = new LazyOpenerService();
