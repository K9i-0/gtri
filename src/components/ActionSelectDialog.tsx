import { Box, Text } from "ink";
import type { ActionSelectDialogState } from "../types/worktree.ts";

interface ActionSelectDialogProps {
  state: ActionSelectDialogState;
}

export function ActionSelectDialog({ state }: ActionSelectDialogProps) {
  if (state.mode !== "open") return null;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      marginY={1}
    >
      <Text bold color="cyan">
        Actions: {state.targetLabel}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {state.actions.map((action, index) => {
          const isSelected = index === state.selectedIndex;
          const prefix = isSelected ? "> " : "  ";

          if (action.disabled) {
            return (
              <Text key={action.key} dimColor>
                {prefix}[{action.key}] {action.label}
              </Text>
            );
          }

          return (
            <Text
              key={action.key}
              color={isSelected ? "cyan" : undefined}
              bold={isSelected}
            >
              {prefix}[{action.key}] {action.label}
            </Text>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>[Enter] Execute  [j/k] Move  [Esc] Cancel</Text>
      </Box>
    </Box>
  );
}
