import { WeiyunClient } from "@/services/weiyun-client";
import { WeiyunDir } from "@/services/weiyun-types";
import { ChevronDown, ChevronRight, Folder, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface WeiyunFolderSelectorProps {
    client: WeiyunClient;
    rootDirKey: string;
    onSelect: (path: string, dirKey: string) => void;
    onSelectRoot: () => void;
}

interface FolderNode {
    dir: WeiyunDir;
    path: string;
    expanded: boolean;
    loading: boolean;
    children: FolderNode[];
    loaded: boolean;
}

function updateNode(nodes: FolderNode[], dirKey: string, updater: (node: FolderNode) => FolderNode): FolderNode[] {
    return nodes.map((node) => {
        if (node.dir.DirKey === dirKey) {
            return updater(node);
        }
        if (node.children.length > 0) {
            return {
                ...node,
                children: updateNode(node.children, dirKey, updater),
            };
        }
        return node;
    });
}

export function WeiyunFolderSelector({
    client,
    rootDirKey,
    onSelect,
    onSelectRoot,
}: WeiyunFolderSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [rootFolders, setRootFolders] = useState<FolderNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRootFolders();
    }, []);

    const loadRootFolders = async () => {
        try {
            setLoading(true);
            const fileList = await client.diskDirFileList(rootDirKey);
            const folders = fileList.DirList.map((dir) => ({
                dir,
                path: `/${dir.DirName}`,
                expanded: false,
                loading: false,
                children: [],
                loaded: false,
            }));
            setRootFolders(folders);
        } catch (error) {
            console.error("Failed to load root folders:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadChildren = async (node: FolderNode) => {
        setRootFolders((prev) =>
            updateNode(prev, node.dir.DirKey, (n) => ({ ...n, loading: true }))
        );

        try {
            const fileList = await client.diskDirFileList(node.dir.DirKey);
            const children = fileList.DirList.map((dir) => ({
                dir,
                path: `${node.path}/${dir.DirName}`,
                expanded: false,
                loading: false,
                children: [],
                loaded: false,
            }));

            setRootFolders((prev) =>
                updateNode(prev, node.dir.DirKey, (n) => ({
                    ...n,
                    children,
                    loaded: true,
                    loading: false,
                }))
            );
        } catch (error) {
            console.error("Failed to load folder children:", error);
            setRootFolders((prev) =>
                updateNode(prev, node.dir.DirKey, (n) => ({ ...n, loading: false }))
            );
        }
    };

    const toggleFolder = async (node: FolderNode) => {
        const newExpanded = !node.expanded;
        setRootFolders((prev) =>
            updateNode(prev, node.dir.DirKey, (n) => ({ ...n, expanded: newExpanded }))
        );

        if (newExpanded && !node.loaded) {
            await loadChildren(node);
        }
    };

    const renderFolder = (node: FolderNode, level: number = 0): React.ReactNode => {
        const matchesSearch =
            searchQuery === "" ||
            node.dir.DirName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.children.some((child) =>
                child.dir.DirName.toLowerCase().includes(searchQuery.toLowerCase())
            );

        if (!matchesSearch && searchQuery !== "") {
            return null;
        }

        return (
            <div key={node.dir.DirKey}>
                <CommandItem
                    onSelect={() => onSelect(node.path, node.dir.DirKey)}
                    className="cursor-pointer px-2 py-1.5 rounded-sm text-sm"
                    style={{ paddingLeft: `${8 + level * 16}px` }}
                >
                    <div className="flex items-center gap-2 w-full">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFolder(node);
                            }}
                            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-muted rounded"
                        >
                            {node.loading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : node.children.length > 0 || !node.loaded ? (
                                node.expanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                ) : (
                                    <ChevronRight className="h-3 w-3" />
                                )
                            ) : (
                                <div className="w-3 h-3" />
                            )}
                        </button>
                        <Folder className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 truncate">{node.dir.DirName}</span>
                    </div>
                </CommandItem>
                {node.expanded && node.children.map((child) => renderFolder(child, level + 1))}
            </div>
        );
    };

    return (
        <div className="space-y-2">
            <button
                onClick={onSelectRoot}
                className="w-full h-8 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center gap-2 px-3"
            >
                <Folder className="h-3.5 w-3.5" />
                <span>使用根目录</span>
            </button>
            <Command className="bg-transparent">
                <CommandInput
                    placeholder="搜索文件夹..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="h-8 text-sm border-0 focus:ring-0 bg-transparent"
                />
                <CommandList className="max-h-[240px]">
                    <CommandGroup className="p-0">
                        {loading ? (
                            <div className="py-4 text-center text-xs flex items-center justify-center gap-2 text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                加载中...
                            </div>
                        ) : rootFolders.length === 0 ? (
                            <div className="py-4 text-center text-xs text-muted-foreground">
                                没有文件夹
                            </div>
                        ) : (
                            rootFolders.map((node) => renderFolder(node))
                        )}
                    </CommandGroup>
                    {!loading && rootFolders.length > 0 && searchQuery !== "" && (
                        <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                            未找到匹配的文件夹
                        </CommandEmpty>
                    )}
                </CommandList>
            </Command>
        </div>
    );
}
