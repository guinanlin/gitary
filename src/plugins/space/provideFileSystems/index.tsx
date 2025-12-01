import { SpaceFileSystemProviderProxy } from "@/services/space-file-system-provider-proxy";
import { spacePlatformRegistry } from "@/services/space-platform.registry";
import { spaceService } from "@/services/space.service";
import { authService } from "@/services/auth.service";
import { createPlugin } from "xbook/common/createPlugin";

export const AddFileSystemProviderForEachSpace = createPlugin({
  initilize(xbook) {
    // Use singleton services directly

    spaceService.subscribeSpaces(async (spaces) => {
      // Use Promise.all to ensure all providers are registered before continuing
      await Promise.all(
        spaces.map(async (space) => {
          try {
            const platform = spacePlatformRegistry.getPlatform(space.platform);
            if (!platform) {
              console.warn(`[FileSystemProvider] Platform not found for space ${space.id}: ${space.platform}`);
              return;
            }

            const providerOrPromise = platform.getProvider({
              accessToken: authService.getAnyAuthInfo(space.platform, space.owner)?.accessToken,
              owner: space.owner,
              repo: space.repo,
            });

            const provider = providerOrPromise instanceof Promise
              ? await providerOrPromise
              : providerOrPromise;

            const proxyProvider = new SpaceFileSystemProviderProxy(provider, space.id);

            xbook.fs.registerProvider({
              id: `space-${space.id}`,
              scheme: 'space',
              provider: proxyProvider,
              authority: space.id,
              options: { overwrite: true },
            });

            console.log(`[FileSystemProvider] Successfully registered provider for space: ${space.id}`);
          } catch (error) {
            console.error(`[FileSystemProvider] Failed to register provider for space ${space.id}:`, error);
            // Continue with other spaces even if one fails
          }
        })
      );
    });
  },
});
