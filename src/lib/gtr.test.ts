import { describe, test, expect, mock } from "bun:test";
import {
  parseWorktreeOutput,
  validateBranchName,
  buildGtrNewCommand,
  processStderrLine,
  type ProgressCallback,
} from "./gtr.ts";

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

describe("validateBranchName", () => {
  test("empty string is invalid", () => {
    const result = validateBranchName("");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("whitespace only is invalid", () => {
    const result = validateBranchName("   ");
    expect(result.valid).toBe(false);
  });

  test("valid simple name", () => {
    const result = validateBranchName("feature");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("valid name with slash", () => {
    const result = validateBranchName("feature/test");
    expect(result.valid).toBe(true);
  });

  test("valid name with dash", () => {
    const result = validateBranchName("feature-test");
    expect(result.valid).toBe(true);
  });

  test("invalid chars: space", () => {
    const result = validateBranchName("feature test");
    expect(result.valid).toBe(false);
  });

  test("invalid chars: tilde", () => {
    const result = validateBranchName("feature~test");
    expect(result.valid).toBe(false);
  });

  test("invalid chars: caret", () => {
    const result = validateBranchName("feature^test");
    expect(result.valid).toBe(false);
  });

  test("invalid chars: colon", () => {
    const result = validateBranchName("feature:test");
    expect(result.valid).toBe(false);
  });

  test("invalid chars: question mark", () => {
    const result = validateBranchName("feature?test");
    expect(result.valid).toBe(false);
  });

  test("invalid chars: asterisk", () => {
    const result = validateBranchName("feature*test");
    expect(result.valid).toBe(false);
  });

  test("invalid chars: bracket", () => {
    const result = validateBranchName("feature[test]");
    expect(result.valid).toBe(false);
  });

  test("invalid chars: backslash", () => {
    const result = validateBranchName("feature\\test");
    expect(result.valid).toBe(false);
  });

  test("double dot is invalid", () => {
    const result = validateBranchName("feature..test");
    expect(result.valid).toBe(false);
  });

  test("double slash is invalid", () => {
    const result = validateBranchName("feature//test");
    expect(result.valid).toBe(false);
  });

  test("starts with dash is invalid", () => {
    const result = validateBranchName("-feature");
    expect(result.valid).toBe(false);
  });

  test("ends with dot is invalid", () => {
    const result = validateBranchName("feature.");
    expect(result.valid).toBe(false);
  });

  test("ends with slash is invalid", () => {
    const result = validateBranchName("feature/");
    expect(result.valid).toBe(false);
  });

  test("@ alone is invalid", () => {
    const result = validateBranchName("@");
    expect(result.valid).toBe(false);
  });

  test("@{ is invalid", () => {
    const result = validateBranchName("feature@{test}");
    expect(result.valid).toBe(false);
  });
});

describe("buildGtrNewCommand", () => {
  test("default mode", () => {
    const result = buildGtrNewCommand("feature/test", { type: "default" });
    expect(result).toEqual(["new", "feature/test", "--yes"]);
  });

  test("fromCurrent mode", () => {
    const result = buildGtrNewCommand("feature/test", { type: "fromCurrent" });
    expect(result).toEqual(["new", "feature/test", "--from-current", "--yes"]);
  });

  test("fromSelected mode", () => {
    const result = buildGtrNewCommand("feature/test", {
      type: "fromSelected",
      ref: "develop",
    });
    expect(result).toEqual([
      "new",
      "feature/test",
      "--from",
      "develop",
      "--yes",
    ]);
  });

  test("specific mode", () => {
    const result = buildGtrNewCommand("feature/test", {
      type: "specific",
      ref: "release/v1.0",
    });
    expect(result).toEqual([
      "new",
      "feature/test",
      "--from",
      "release/v1.0",
      "--yes",
    ]);
  });
});

describe("processStderrLine", () => {
  test("detects 'Worktree created with' pattern", () => {
    const onProgress = mock<ProgressCallback>(() => {});

    processStderrLine("Worktree created with new branch feature/test", onProgress, "/path/to/worktree");

    expect(onProgress).toHaveBeenCalledWith({
      type: "worktree_created",
      path: "/path/to/worktree",
    });
  });

  test("detects 'Worktree created tracking' pattern", () => {
    const onProgress = mock<ProgressCallback>(() => {});

    processStderrLine("Worktree created tracking remote branch feature/test", onProgress, "/path/to/worktree");

    expect(onProgress).toHaveBeenCalledWith({
      type: "worktree_created",
      path: "/path/to/worktree",
    });
  });

  test("detects 'Copying files' pattern", () => {
    const onProgress = mock<ProgressCallback>(() => {});

    processStderrLine("Copying files from .gtrconfig", onProgress, undefined);

    expect(onProgress).toHaveBeenCalledWith({
      type: "copying",
    });
  });

  test("detects 'Copying directories' pattern", () => {
    const onProgress = mock<ProgressCallback>(() => {});

    processStderrLine("Copying directories node_modules", onProgress, undefined);

    expect(onProgress).toHaveBeenCalledWith({
      type: "copying",
    });
  });

  test("detects 'Running hooks' pattern", () => {
    const onProgress = mock<ProgressCallback>(() => {});

    processStderrLine("Running postCreate hooks...", onProgress, undefined);

    expect(onProgress).toHaveBeenCalledWith({
      type: "hooks",
    });
  });

  test("does not call callback for unmatched lines", () => {
    const onProgress = mock<ProgressCallback>(() => {});

    processStderrLine("Some random log message", onProgress, undefined);
    processStderrLine("", onProgress, undefined);
    processStderrLine("Branch feature/test is up to date", onProgress, undefined);

    expect(onProgress).not.toHaveBeenCalled();
  });

  test("handles undefined detectedPath", () => {
    const onProgress = mock<ProgressCallback>(() => {});

    processStderrLine("Worktree created with new branch feature/test", onProgress, undefined);

    expect(onProgress).toHaveBeenCalledWith({
      type: "worktree_created",
      path: undefined,
    });
  });
});
