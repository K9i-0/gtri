import type { Key } from "ink";

// Navigation
export function isMoveUp(input: string, key: Key): boolean {
  return key.upArrow || input === "k" || (key.ctrl && input === "p");
}

export function isMoveDown(input: string, key: Key): boolean {
  return key.downArrow || input === "j" || (key.ctrl && input === "n");
}

export function isMoveToTop(input: string, key: Key): boolean {
  return input === "g" || (key.ctrl && input === "a");
}

export function isMoveToBottom(input: string, key: Key): boolean {
  return input === "G" || (key.ctrl && input === "e");
}

// Global
export function isQuit(input: string, key: Key): boolean {
  return input === "q" || key.escape;
}

export function isConfirm(key: Key): boolean {
  return key.return;
}

export function isCancel(key: Key): boolean {
  return key.escape;
}
