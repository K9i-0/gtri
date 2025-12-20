import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface BranchInputProps {
  baseBranch: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export function BranchInput({
  baseBranch,
  value,
  onChange,
  onSubmit,
}: BranchInputProps) {
  return (
    <Box flexDirection="column" marginY={1}>
      <Box>
        <Text>New branch name: </Text>
        <TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
      </Box>
      <Text dimColor>Base: {baseBranch}</Text>
      <Text dimColor>[Enter] Create | [Esc] Cancel</Text>
    </Box>
  );
}
