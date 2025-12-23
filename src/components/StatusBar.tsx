import { Box, Text } from "ink";

interface StatusBarProps {
  message?: string | null;
}

export function StatusBar({ message }: StatusBarProps) {
  const hint = "[e]ditor [a]i [c]opy [d]elete [p]r [r]efresh [q]uit | j/k:move";

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      paddingTop={1}
    >
      {message ? (
        <Text color="green">{message}</Text>
      ) : (
        <Text dimColor>{hint}</Text>
      )}
    </Box>
  );
}
