export async function copyToClipboard(text: string): Promise<boolean> {
  const platform = process.platform;

  let command: string[];
  if (platform === "darwin") {
    command = ["pbcopy"];
  } else if (platform === "linux") {
    command = ["xclip", "-selection", "clipboard"];
  } else if (platform === "win32") {
    command = ["clip"];
  } else {
    return false;
  }

  const proc = Bun.spawn(command, {
    stdin: "pipe",
    stdout: "ignore",
    stderr: "ignore",
  });

  proc.stdin.write(text);
  proc.stdin.end();

  const exitCode = await proc.exited;
  return exitCode === 0;
}
