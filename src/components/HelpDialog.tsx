import { Box, Text } from "ink";

export function HelpDialog() {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Help - gtri Keyboard Shortcuts
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="yellow">
          Navigation
        </Text>
        <Box>
          <Text dimColor>  j/k/↑/↓      </Text>
          <Text>Move up/down</Text>
        </Box>
        <Box>
          <Text dimColor>  g/G          </Text>
          <Text>Go to top/bottom</Text>
        </Box>
        <Box>
          <Text dimColor>  1-9          </Text>
          <Text>Quick select by number</Text>
        </Box>
        <Box>
          <Text dimColor>  h/l          </Text>
          <Text>Switch between list and detail panels</Text>
        </Box>
        <Box>
          <Text dimColor>  Tab          </Text>
          <Text>Switch tabs (Worktrees / Open PRs)</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="yellow">
          Worktree Actions
        </Text>
        <Box>
          <Text dimColor>  e            </Text>
          <Text>Open worktree in editor</Text>
        </Box>
        <Box>
          <Text dimColor>  p            </Text>
          <Text>Open/create PR</Text>
        </Box>
        <Box>
          <Text dimColor>  c            </Text>
          <Text>Copy worktree path</Text>
        </Box>
        <Box>
          <Text dimColor>  a            </Text>
          <Text>Copy AI review command</Text>
        </Box>
        <Box>
          <Text dimColor>  d            </Text>
          <Text>Delete worktree</Text>
        </Box>
        <Box>
          <Text dimColor>  n            </Text>
          <Text>Create new worktree</Text>
        </Box>
        <Box>
          <Text dimColor>  r            </Text>
          <Text>Refresh data</Text>
        </Box>
        <Box>
          <Text dimColor>  Enter        </Text>
          <Text>Show action menu</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="yellow">
          PR Actions
        </Text>
        <Box>
          <Text dimColor>  w            </Text>
          <Text>Create worktree from PR</Text>
        </Box>
        <Box>
          <Text dimColor>  p            </Text>
          <Text>Open PR in browser</Text>
        </Box>
      </Box>

      <Box flexDirection="column">
        <Text bold color="yellow">
          General
        </Text>
        <Box>
          <Text dimColor>  ?            </Text>
          <Text>Toggle this help</Text>
        </Box>
        <Box>
          <Text dimColor>  q/Esc        </Text>
          <Text>Quit / Cancel</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press ? or Esc to close</Text>
      </Box>
    </Box>
  );
}
