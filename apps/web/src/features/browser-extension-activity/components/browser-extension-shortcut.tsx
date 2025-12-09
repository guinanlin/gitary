import { BaseActivityItem } from "xbook/ui/activiti-bar/components/base-activity-item";
import { AiOutlineChrome } from "react-icons/ai";

interface BrowserExtensionShortcutProps {
  shortcut: {
    id: string;
    name: string;
    icon: string;
  };
  isExpanded: boolean;
}

export function BrowserExtensionShortcut({
  shortcut,
  isExpanded,
}: BrowserExtensionShortcutProps) {
  const chromeStoreUrl = "https://chromewebstore.google.com/detail/gitary-companion/halhhaelcfghngkpkikcnlcjbmlkgjed";
  
  return (
    <BaseActivityItem
      activity={{ id: shortcut.id, name: shortcut.name, icon: shortcut.icon } as any}
      isExpanded={isExpanded}
      icon={<AiOutlineChrome className="w-full h-full" />}
      onClick={() => {
        window.open(chromeStoreUrl, "_blank", "noopener,noreferrer");
      }}
    />
  );
}

