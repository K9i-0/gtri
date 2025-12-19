import { useState, useCallback } from "react";

interface UseNavigationReturn {
  selectedIndex: number;
  moveUp: () => void;
  moveDown: () => void;
  moveToTop: () => void;
  moveToBottom: () => void;
  selectIndex: (index: number) => void;
}

export function useNavigation(itemCount: number): UseNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => Math.min(itemCount - 1, prev + 1));
  }, [itemCount]);

  const moveToTop = useCallback(() => {
    setSelectedIndex(0);
  }, []);

  const moveToBottom = useCallback(() => {
    setSelectedIndex(Math.max(0, itemCount - 1));
  }, [itemCount]);

  const selectIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < itemCount) {
        setSelectedIndex(index);
      }
    },
    [itemCount]
  );

  return {
    selectedIndex,
    moveUp,
    moveDown,
    moveToTop,
    moveToBottom,
    selectIndex,
  };
}
