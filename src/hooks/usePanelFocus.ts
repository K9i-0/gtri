import { useState, useCallback } from "react";

export type PanelType = "list" | "detail";

export function usePanelFocus() {
  const [activePanel, setActivePanel] = useState<PanelType>("list");

  const focusList = useCallback(() => {
    setActivePanel("list");
  }, []);

  const focusDetail = useCallback(() => {
    setActivePanel("detail");
  }, []);

  const togglePanel = useCallback(() => {
    setActivePanel((prev) => (prev === "list" ? "detail" : "list"));
  }, []);

  return {
    activePanel,
    isListActive: activePanel === "list",
    isDetailActive: activePanel === "detail",
    focusList,
    focusDetail,
    togglePanel,
  };
}
