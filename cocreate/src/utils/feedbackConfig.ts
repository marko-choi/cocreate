import { FeedbackConfig } from "../types/global";

// Shared feedback configuration loader (Qualtrics can set window.cocreateFeedbackConfig)
export const getFeedbackConfig = (): FeedbackConfig => {
  const defaultConfig: FeedbackConfig = {
    showFunctionValue: true,
    showAestheticValue: true,
    showComment: true,
  };

  if (typeof window !== "undefined" && (window as any).cocreateFeedbackConfig) {
    return (window as any).cocreateFeedbackConfig as FeedbackConfig;
  }

  return defaultConfig;
};
