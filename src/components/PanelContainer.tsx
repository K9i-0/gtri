import { Box } from "ink";
import type { ReactNode } from "react";

interface PanelContainerProps {
  left: ReactNode;
  right: ReactNode;
}

export function PanelContainer({ left, right }: PanelContainerProps) {
  return (
    <Box flexDirection="row" marginBottom={1}>
      <Box flexGrow={1} flexShrink={1} flexBasis={0} marginRight={1}>
        {left}
      </Box>
      <Box flexGrow={1} flexShrink={1} flexBasis={0}>
        {right}
      </Box>
    </Box>
  );
}
