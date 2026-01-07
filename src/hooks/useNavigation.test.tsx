import { describe, test, expect } from "bun:test";
import React from "react";
import { Text, useInput } from "ink";
import { render } from "ink-testing-library";
import { useNavigation } from "./useNavigation.ts";

// Test component that responds to stdin input
function TestNavigationComponent({ itemCount }: { itemCount: number }) {
  const nav = useNavigation(itemCount);

  useInput((input) => {
    if (input === "j") nav.moveDown();
    if (input === "k") nav.moveUp();
    if (input === "g") nav.moveToTop();
    if (input === "G") nav.moveToBottom();
    if (/^[0-9]$/.test(input)) nav.selectIndex(parseInt(input, 10));
  });

  return <Text>index:{nav.selectedIndex}</Text>;
}

describe("useNavigation", () => {
  test("initializes with selectedIndex 0", () => {
    const { lastFrame } = render(<TestNavigationComponent itemCount={5} />);
    expect(lastFrame()).toContain("index:0");
  });

  test("moveDown via stdin j key", async () => {
    const { lastFrame, stdin } = render(
      <TestNavigationComponent itemCount={5} />
    );

    stdin.write("j");
    await new Promise((r) => setTimeout(r, 50));

    expect(lastFrame()).toContain("index:1");
  });

  test("moveDown does not exceed itemCount - 1", async () => {
    const { lastFrame, stdin } = render(
      <TestNavigationComponent itemCount={3} />
    );

    stdin.write("j");
    stdin.write("j");
    stdin.write("j");
    stdin.write("j");
    await new Promise((r) => setTimeout(r, 50));

    expect(lastFrame()).toContain("index:2");
  });

  test("moveUp via stdin k key", async () => {
    const { lastFrame, stdin } = render(
      <TestNavigationComponent itemCount={5} />
    );

    stdin.write("j");
    stdin.write("j");
    stdin.write("k");
    await new Promise((r) => setTimeout(r, 50));

    expect(lastFrame()).toContain("index:1");
  });

  test("moveUp does not go below 0", async () => {
    const { lastFrame, stdin } = render(
      <TestNavigationComponent itemCount={5} />
    );

    stdin.write("k");
    stdin.write("k");
    await new Promise((r) => setTimeout(r, 50));

    expect(lastFrame()).toContain("index:0");
  });

  test("moveToTop via stdin g key", async () => {
    const { lastFrame, stdin } = render(
      <TestNavigationComponent itemCount={5} />
    );

    stdin.write("j");
    stdin.write("j");
    stdin.write("g");
    await new Promise((r) => setTimeout(r, 50));

    expect(lastFrame()).toContain("index:0");
  });

  test("moveToBottom via stdin G key", async () => {
    const { lastFrame, stdin } = render(
      <TestNavigationComponent itemCount={5} />
    );

    stdin.write("G");
    await new Promise((r) => setTimeout(r, 50));

    expect(lastFrame()).toContain("index:4");
  });

  test("selectIndex via stdin number key", async () => {
    const { lastFrame, stdin } = render(
      <TestNavigationComponent itemCount={5} />
    );

    stdin.write("3");
    await new Promise((r) => setTimeout(r, 50));

    expect(lastFrame()).toContain("index:3");
  });

  test("handles empty list (itemCount = 0)", async () => {
    const { lastFrame } = render(<TestNavigationComponent itemCount={0} />);
    // itemCount=0の場合、初期状態は0
    expect(lastFrame()).toContain("index:0");
  });
});
