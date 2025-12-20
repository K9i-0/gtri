import { describe, test, expect } from "bun:test";
import { parseWorktreeOutput } from "./gtr.ts";

describe("parseWorktreeOutput", () => {
  test("should parse valid porcelain output", () => {
    const output = `/path/to/main\tmain\tok
/path/to/worktrees\t(detached)\tok
/path/to/feature\tfeature/test\tok`;

    const result = parseWorktreeOutput(output);

    expect(result.length).toBe(3);
    expect(result[0]).toEqual({
      path: "/path/to/main",
      branch: "main",
      status: "ok",
      isMain: true,
    });
    expect(result[1]).toEqual({
      path: "/path/to/worktrees",
      branch: "(detached)",
      status: "ok",
      isMain: false,
    });
    expect(result[2]).toEqual({
      path: "/path/to/feature",
      branch: "feature/test",
      status: "ok",
      isMain: false,
    });
  });

  test("should handle empty output", () => {
    const result = parseWorktreeOutput("");
    expect(result).toEqual([]);
  });

  test("should skip malformed lines", () => {
    const output = `/path/to/main\tmain\tok
invalid-line
/path/to/feature\tfeature/test\tok`;

    const result = parseWorktreeOutput(output);

    expect(result.length).toBe(2);
    expect(result[0]?.branch).toBe("main");
    expect(result[1]?.branch).toBe("feature/test");
  });

  test("should handle different statuses", () => {
    const output = `/path/locked\tbranch1\tlocked
/path/prunable\tbranch2\tprunable`;

    const result = parseWorktreeOutput(output);

    expect(result[0]?.status).toBe("locked");
    expect(result[1]?.status).toBe("prunable");
  });
});
