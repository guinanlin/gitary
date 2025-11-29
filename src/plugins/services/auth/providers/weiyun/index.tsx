import { authService } from "@/services/auth.service";
import { createPlugin } from "xbook/common/createPlugin";
import xbook from "xbook/index";
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription } from "@/components/ui/dialog";
import { createDeferredComponentProxy } from "xbook/hooks/useDeferredComponentProxy";

export default createPlugin({
  initilize(xbook) {
    const authProvider = {
      id: "weiyun",
      platform: "weiyun",
      name: "腾讯微云",
      title: "腾讯微云",
      description: "通过 Cookie 授权访问腾讯微云",

      getLoginUrl: () => {
        return "https://www.weiyun.com";
      },

      authenticate: async (options) => {
        const cookieInput = createDeferredComponentProxy<{
          getValue: () => string;
        }>(({ proxy }) => {
          const [cookies, setCookies] = useState("");
          useEffect(() => {
            proxy.register({
              getValue: () => cookies,
            });
          }, [cookies, proxy]);

          return (
            <div className="space-y-4">
              <DialogDescription>
                <div className="space-y-2">
                  <p>请按以下步骤获取 Cookie：</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>在浏览器中打开{" "}
                      <a
                        href="https://www.weiyun.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        https://www.weiyun.com
                      </a>{" "}
                      并登录
                    </li>
                    <li>打开开发者工具 (F12) → Network</li>
                    <li>刷新页面，找到任意请求</li>
                    <li>复制请求头中的 Cookie 值</li>
                    <li>粘贴到下方输入框</li>
                  </ol>
                  <p className="text-sm text-muted-foreground mt-2">
                    需要包含的 Cookie: uin, skey, p_uin, p_skey 等
                  </p>
                </div>
              </DialogDescription>
              <Textarea
                value={cookies}
                onChange={(e) => setCookies(e.target.value)}
                placeholder="p_skey=xxx; p_uin=xxx; pt4_token=xxx; skey=xxx; uin=xxx; vcookie=xxx"
                className="min-h-[120px] font-mono text-sm"
                autoFocus
              />
            </div>
          );
        });

        return new Promise<void>((resolve) => {
          const modal = xbook.modalService.open({
            title: "授权腾讯微云",
            content: cookieInput.instance,
            width: "600px",
            okText: "确认授权",
            cancelText: "取消",
            onOk: () => {
              const cookies = cookieInput.proxy.getValue();
              if (!cookies || !cookies.trim()) {
                xbook.notificationService.error("请输入 Cookie");
                return;
              }

              const match = cookies.match(/uin=([^;]+)/);
              const uin = match ? match[1] : "unknown";

              authService.saveAuthInfo({
                platform: "weiyun",
                username: uin,
                accessToken: cookies.trim(),
                createdAt: Date.now() / 1000,
              });

              modal.close();
              xbook.notificationService.success("微云授权成功");
              resolve();
            },
            onCancel: () => {
              modal.close();
              resolve();
            },
          });
        });
      },
    };

    authService.registerAuthProvider(authProvider);
  },
});

