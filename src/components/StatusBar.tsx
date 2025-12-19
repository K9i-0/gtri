import { Box, Text } from "ink";

interface StatusBarProps {
  message?: string | null;
}

export function StatusBar({ message }: StatusBarProps) {
  return (
    <Box flexDirection="column" borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false} paddingTop={1}>
      {message ? (
        <Text color="green">{message}</Text>
      ) : (
        <Text dimColor>
          [e]ditor [a]i [c]opy [d]elete [r]efresh [q]uit | j/k:move g/G:top/bottom 1-9:select
        </Text>
      )}
    </Box>
  );
}
