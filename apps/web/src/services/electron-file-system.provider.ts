import { Event } from '@/toolkit/vscode/event';
import { EventEmitter } from '@/toolkit/vscode/event-emitter';
import {
  FileChangeEvent,
  FileChangeType,
  FileStat,
  FileSystemProvider,
  FileType,
} from '@/toolkit/vscode/file-system';
import { Uri } from '@/toolkit/vscode/uri';

export class ElectronFileSystemProvider implements FileSystemProvider {
  private readonly _onDidChangeFile = new EventEmitter<FileChangeEvent[]>();
  readonly onDidChangeFile: Event<FileChangeEvent[]> =
    this._onDidChangeFile.event;

  private basePath: string | null = null;

  setBasePath(path: string) {
    this.basePath = path;
  }

  private uriToPath(uri: Uri): string {
    if (uri.scheme !== 'local') {
      throw new Error(`Unsupported scheme: ${uri.scheme}`);
    }
    const uriPath = uri.path;
    if (this.basePath) {
      if (uriPath === '/' || uriPath === '') {
        return this.basePath;
      }
      const normalizedPath = uriPath.startsWith('/') ? uriPath.slice(1) : uriPath;
      const separator = window.electronAPI?.platform === 'win32' ? '\\' : '/';
      return this.basePath + separator + normalizedPath.replace(/\//g, separator);
    }
    return uriPath.startsWith('/') ? uriPath : '/' + uriPath;
  }

  async stat(uri: Uri): Promise<FileStat> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const path = this.uriToPath(uri);
    const stat = await window.electronAPI.fs.stat(path);
    return {
      type: stat.isDirectory ? FileType.Directory : FileType.File,
      ctime: stat.ctime,
      mtime: stat.mtime,
      size: stat.size,
    };
  }

  async readDirectory(uri: Uri): Promise<[string, FileType][]> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const path = this.uriToPath(uri);
    const entries = await window.electronAPI.fs.readDirectory(path);
    return entries.map((entry) => [
      entry.name,
      entry.isDirectory ? FileType.Directory : FileType.File,
    ]);
  }

  async readFile(uri: Uri): Promise<Uint8Array> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const path = this.uriToPath(uri);
    return await window.electronAPI.fs.readFile(path);
  }

  async writeFile(
    uri: Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const path = this.uriToPath(uri);
    await window.electronAPI.fs.writeFile(path, content);
    this._onDidChangeFile.fire([
      {
        type: FileChangeType.Changed,
        uri,
      },
    ]);
  }

  async delete(uri: Uri, options: { recursive: boolean }): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const path = this.uriToPath(uri);
    await window.electronAPI.fs.delete(path);
    this._onDidChangeFile.fire([
      {
        type: FileChangeType.Deleted,
        uri,
      },
    ]);
  }

  async rename(
    oldUri: Uri,
    newUri: Uri,
    options: { overwrite: boolean }
  ): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const oldPath = this.uriToPath(oldUri);
    const newPath = this.uriToPath(newUri);
    await window.electronAPI.fs.rename(oldPath, newPath);
    this._onDidChangeFile.fire([
      {
        type: FileChangeType.Deleted,
        uri: oldUri,
      },
      {
        type: FileChangeType.Created,
        uri: newUri,
      },
    ]);
  }

  async createDirectory(uri: Uri): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const path = this.uriToPath(uri);
    await window.electronAPI.fs.createDirectory(path);
    this._onDidChangeFile.fire([
      {
        type: FileChangeType.Created,
        uri,
      },
    ]);
  }

  async copy(
    source: Uri,
    destination: Uri,
    options: { overwrite: boolean }
  ): Promise<void> {
    const content = await this.readFile(source);
    await this.writeFile(destination, content, {
      create: true,
      overwrite: options.overwrite,
    });
  }
}

