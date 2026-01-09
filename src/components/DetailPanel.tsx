import { Box, Text } from "ink";
import Link from "ink-link";
import type { Worktree } from "../types/worktree.ts";
import type { PR } from "../types/pr.ts";

interface DetailPanelProps {
  type: "worktree" | "pr";
  worktree?: Worktree;
  pr?: PR;
  isActive: boolean;
}

export function DetailPanel({ type, worktree, pr, isActive }: DetailPanelProps) {
  const borderColor = isActive ? "cyan" : "gray";

  if (type === "worktree" && worktree) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={borderColor}
        paddingX={1}
        paddingY={1}
        minWidth={50}
      >
        <Box marginBottom={1}>
          <Text bold color="cyan">
            {worktree.isMain ? "★ " : ""}
            {worktree.branch}
          </Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="yellow">
            Path
          </Text>
          <Text dimColor>
            {worktree.path.replace(process.env.HOME || "", "~")}
          </Text>
        </Box>

        {worktree.shortHash && (
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color="yellow">
              Commit
            </Text>
            <Text dimColor>{worktree.shortHash}</Text>
          </Box>
        )}

        {worktree.prInfo && (
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color="yellow">
              Pull Request
            </Text>
            <Box>
              <Text
                color={
                  worktree.prInfo.state === "OPEN"
                    ? "green"
                    : worktree.prInfo.state === "MERGED"
                      ? "magenta"
                      : "red"
                }
              >
                [{worktree.prInfo.state}]
              </Text>
              {worktree.prInfo.isDraft && <Text color="gray"> [Draft]</Text>}
              <Text> </Text>
              <Link url={worktree.prInfo.url}>
                <Text color="cyan">#{worktree.prInfo.number}</Text>
              </Link>
            </Box>
            <Box>
              <Text dimColor>by </Text>
              <Link url={`https://github.com/${worktree.prInfo.author.login}`}>
                <Text color="yellow">@{worktree.prInfo.author.login}</Text>
              </Link>
            </Box>
            <Text dimColor>{worktree.prInfo.title}</Text>
          </Box>
        )}

        <Box flexDirection="column">
          <Text bold color="yellow">
            Actions
          </Text>
          <Box>
            <Text dimColor>  e  </Text>
            <Text>Open in editor</Text>
          </Box>
          <Box>
            <Text dimColor>  p  </Text>
            <Text>Open/create PR</Text>
          </Box>
          <Box>
            <Text dimColor>  c  </Text>
            <Text>Copy path</Text>
          </Box>
          <Box>
            <Text dimColor>  a  </Text>
            <Text>Copy AI command</Text>
          </Box>
          {!worktree.isMain && (
            <Box>
              <Text dimColor>  d  </Text>
              <Text>Delete worktree</Text>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  if (type === "pr" && pr) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={borderColor}
        paddingX={1}
        paddingY={1}
        minWidth={50}
      >
        <Box marginBottom={1}>
          <Link url={pr.url}>
            <Text bold color="cyan">
              #{pr.number}
            </Text>
          </Link>
          <Text> </Text>
          <Text
            color={
              pr.state === "OPEN"
                ? "green"
                : pr.state === "MERGED"
                  ? "magenta"
                  : "red"
            }
          >
            [{pr.state}]
          </Text>
          {pr.isDraft && <Text color="gray"> [Draft]</Text>}
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="yellow">
            Title
          </Text>
          <Text>{pr.title}</Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="yellow">
            Branch
          </Text>
          <Text dimColor>{pr.headRefName}</Text>
        </Box>

        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="yellow">
            Author
          </Text>
          <Link url={`https://github.com/${pr.author.login}`}>
            <Text color="yellow">@{pr.author.login}</Text>
          </Link>
        </Box>

        <Box flexDirection="column">
          <Text bold color="yellow">
            Actions
          </Text>
          <Box>
            <Text dimColor>  w  </Text>
            <Text>Create worktree from PR</Text>
          </Box>
          <Box>
            <Text dimColor>  p  </Text>
            <Text>Open PR in browser</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      paddingY={1}
      minWidth={50}
      justifyContent="center"
      alignItems="center"
    >
      <Text dimColor>Select an item to view details</Text>
    </Box>
  );
}
