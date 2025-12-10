import { createPlugin } from 'xbook/common/createPlugin';
import { ElectronFileSystemProvider } from '@/services/electron-file-system.provider';
import { Uri } from '@/toolkit/vscode/uri';

export const ElectronFileSystemPlugin = createPlugin({
  initilize(xbook) {
    if (!window.electronAPI?.isElectron) {
      return;
    }

    const provider = new ElectronFileSystemProvider();

    const selectWorkspace = async () => {
      const selectedPath = await window.electronAPI?.fs.selectDirectory();
      if (selectedPath) {
        provider.setBasePath(selectedPath);
        xbook.fs.registerProvider({
          id: 'electron-local-fs',
          scheme: 'local',
          provider: provider,
          options: { overwrite: true },
        });
        console.log('[ElectronFileSystemPlugin] Registered file system with path:', selectedPath);
      }
    };

    selectWorkspace();
  },
});


