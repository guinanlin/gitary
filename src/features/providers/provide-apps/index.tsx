import { provideAppAIQuotes } from "./provide-app-ai-quotes";
import { provideAppAIStoryCards } from "./provide-app-ai-story-cards";
import { provideAppAIResume } from "./provide-app-ai-resume";
import { provideAppMeetingMinutes } from "./provide-app-meeting-minutes";
import { provideAppMakePPT } from "./provide-app-make-ppt";
import { provideStreamingNote } from "./provide-streaming-note";
import { provideZenNotes } from "./provide-zen-notes";
import { provideCommunity } from "./provide-community";
import { provideMindFlow } from "./provide-mind-flow";
import { provideFlowDemo } from "./provide-react-flow";
import { provideExcalidraw } from "./provide-excalidraw";
import { provideDrawio } from "./provide-drawio";
import { createPlugin } from "xbook/common/createPlugin";

export const provideApps = createPlugin({
  initilize(xbook) {
    xbook.pluginService.use([
      provideAppAIQuotes,
      provideAppAIStoryCards,
      provideAppAIResume,
      provideAppMeetingMinutes,
      provideAppMakePPT,
      provideStreamingNote,
      provideZenNotes,
      provideCommunity,
      provideMindFlow,
      provideFlowDemo,
      provideExcalidraw,
      provideDrawio,
    ]);
  },
});
