import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  resolveCodexAppServerProtocolSource,
  resolveCodexProtocolPnpmCommand,
} from "../../scripts/lib/codex-app-server-protocol-source.js";
import { createScriptTestHarness } from "./test-helpers.js";

const { createTempDir } = createScriptTestHarness();
const originalSunClawCodexRepo = process.env.SUNCLAW_CODEX_REPO;

afterEach(() => {
  if (originalSunClawCodexRepo === undefined) {
    delete process.env.SUNCLAW_CODEX_REPO;
  } else {
    process.env.SUNCLAW_CODEX_REPO = originalSunClawCodexRepo;
  }
});

describe("codex app-server protocol source resolver", () => {
  it("wraps Windows pnpm formatting through cmd.exe without shell mode", () => {
    expect(
      resolveCodexProtocolPnpmCommand(
        ["exec", "oxfmt", "--write", "--threads=1", String.raw`C:\tmp\generated types`],
        {
          comSpec: String.raw`C:\Windows\System32\cmd.exe`,
          npmExecPath: String.raw`C:\Program Files\nodejs\pnpm.cmd`,
          platform: "win32",
        },
      ),
    ).toEqual({
      args: [
        "/d",
        "/s",
        "/c",
        String.raw`""C:\Program Files\nodejs\pnpm.cmd" exec oxfmt --write --threads=1 "C:\tmp\generated types""`,
      ],
      command: String.raw`C:\Windows\System32\cmd.exe`,
      shell: false,
      windowsVerbatimArguments: true,
    });
  });

  it("uses SUNCLAW_CODEX_REPO when provided", async () => {
    const root = createTempDir("sunclaw-protocol-source-root-");
    const codexRepo = createTempDir("sunclaw-protocol-source-codex-");
    createProtocolSchema(codexRepo);
    process.env.SUNCLAW_CODEX_REPO = codexRepo;

    await expect(resolveCodexAppServerProtocolSource(root)).resolves.toEqual({
      codexRepo,
      sourceRoot: path.join(codexRepo, "codex-rs/app-server-protocol/schema"),
    });
  });

  it("finds the primary checkout sibling from a git worktree", async () => {
    const parentDir = createTempDir("sunclaw-protocol-source-parent-");
    const primarySunClaw = path.join(parentDir, "sunclaw");
    const codexRepo = path.join(parentDir, "codex");
    const worktreeRoot = createTempDir("sunclaw-protocol-source-worktree-");
    fs.mkdirSync(path.join(primarySunClaw, ".git", "worktrees", "codex-harness"), {
      recursive: true,
    });
    fs.mkdirSync(worktreeRoot, { recursive: true });
    fs.writeFileSync(
      path.join(worktreeRoot, ".git"),
      `gitdir: ${path.join(primarySunClaw, ".git", "worktrees", "codex-harness")}\n`,
    );
    createProtocolSchema(codexRepo);
    delete process.env.SUNCLAW_CODEX_REPO;

    await expect(resolveCodexAppServerProtocolSource(worktreeRoot)).resolves.toEqual({
      codexRepo,
      sourceRoot: path.join(codexRepo, "codex-rs/app-server-protocol/schema"),
    });
  });
});

function createProtocolSchema(codexRepo: string): void {
  fs.mkdirSync(path.join(codexRepo, "codex-rs/app-server-protocol/schema/typescript"), {
    recursive: true,
  });
}
