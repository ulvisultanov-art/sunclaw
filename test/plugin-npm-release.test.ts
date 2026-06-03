import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { bundledPluginFile, bundledPluginRoot } from "sunclaw/plugin-sdk/test-fixtures";
import { afterEach, describe, expect, it } from "vitest";
import { collectClawHubPublishablePluginPackages } from "../scripts/lib/plugin-clawhub-release.ts";
import {
  collectPublishablePluginPackages,
  collectChangedExtensionIdsFromPaths,
  collectPublishablePluginPackageErrors,
  SUNCLAW_PLUGIN_NPM_REPOSITORY_URL,
  parsePluginReleaseArgs,
  parsePluginReleaseSelection,
  parsePluginReleaseSelectionMode,
  resolveChangedPublishablePluginPackages,
  resolveSelectedPublishablePluginPackages,
  type PublishablePluginPackage,
} from "../scripts/lib/plugin-npm-release.ts";
import { cleanupTempDirs, makeTempRepoRoot, writeJsonFile } from "./helpers/temp-repo.js";

const tempDirs: string[] = [];

afterEach(() => {
  cleanupTempDirs(tempDirs);
});

describe("parsePluginReleaseSelection", () => {
  it("returns an empty list for blank input", () => {
    expect(parsePluginReleaseSelection("")).toStrictEqual([]);
    expect(parsePluginReleaseSelection("   ")).toStrictEqual([]);
    expect(parsePluginReleaseSelection(undefined)).toStrictEqual([]);
  });

  it("dedupes and sorts comma or whitespace separated package names", () => {
    expect(parsePluginReleaseSelection(" @sunclaw/zalo, @sunclaw/feishu  @sunclaw/zalo ")).toEqual([
      "@sunclaw/feishu",
      "@sunclaw/zalo",
    ]);
  });
});

describe("parsePluginReleaseSelectionMode", () => {
  it("accepts the supported explicit selection modes", () => {
    expect(parsePluginReleaseSelectionMode("selected")).toBe("selected");
    expect(parsePluginReleaseSelectionMode("all-publishable")).toBe("all-publishable");
  });

  it("rejects unsupported selection modes", () => {
    expect(() => parsePluginReleaseSelectionMode("all")).toThrowError(
      'Unknown selection mode: all. Expected "selected" or "all-publishable".',
    );
  });
});

describe("parsePluginReleaseArgs", () => {
  it("rejects blank explicit plugin selections", () => {
    expect(() => parsePluginReleaseArgs(["--plugins", "   "])).toThrowError(
      "`--plugins` must include at least one package name.",
    );
  });

  it("requires plugin names for selected explicit publish mode", () => {
    expect(() => parsePluginReleaseArgs(["--selection-mode", "selected"])).toThrowError(
      "`--selection-mode selected` requires `--plugins`.",
    );
  });

  it("rejects plugin names when all-publishable mode is selected", () => {
    expect(() =>
      parsePluginReleaseArgs(["--selection-mode", "all-publishable", "--plugins", "@sunclaw/zalo"]),
    ).toThrowError("`--selection-mode all-publishable` must not be combined with `--plugins`.");
  });

  it("parses explicit all-publishable mode", () => {
    expect(parsePluginReleaseArgs(["--selection-mode", "all-publishable"])).toEqual({
      baseRef: undefined,
      headRef: undefined,
      selectionMode: "all-publishable",
      selection: [],
      pluginsFlagProvided: false,
    });
  });
});

function externalPluginContract(version: string) {
  return {
    compat: {
      pluginApi: `>=${version}`,
    },
    build: {
      sunclawVersion: version,
    },
  };
}

describe("collectPublishablePluginPackageErrors", () => {
  it("accepts a valid publishable plugin package candidate", () => {
    expect(
      collectPublishablePluginPackageErrors({
        extensionId: "zalo",
        packageDir: bundledPluginRoot("zalo"),
        packageJson: {
          name: "@sunclaw/zalo",
          version: "2026.3.15",
          repository: {
            type: "git",
            url: SUNCLAW_PLUGIN_NPM_REPOSITORY_URL,
          },
          sunclaw: {
            extensions: ["./index.ts"],
            ...externalPluginContract("2026.3.15"),
            install: {
              npmSpec: "@sunclaw/zalo",
            },
            release: {
              publishToNpm: true,
            },
          },
        },
      }),
    ).toStrictEqual([]);
  });

  it("flags invalid publishable plugin metadata", () => {
    expect(
      collectPublishablePluginPackageErrors({
        extensionId: "broken",
        packageDir: bundledPluginRoot("broken"),
        packageJson: {
          name: "broken",
          version: "latest",
          private: true,
          sunclaw: {
            extensions: [""],
            ...externalPluginContract("2026.3.15"),
            install: {
              npmSpec: "   ",
            },
            release: {
              publishToNpm: true,
            },
          },
        },
      }),
    ).toEqual([
      'package name must start with "@sunclaw/"; found "broken".',
      "package.json private must not be true.",
      `package.json repository.url must be "${SUNCLAW_PLUGIN_NPM_REPOSITORY_URL}" so npm provenance can validate GitHub trusted publishing; found "<missing>".`,
      'package.json version must match YYYY.M.D, YYYY.M.D-N, YYYY.M.D-alpha.N, or YYYY.M.D-beta.N; found "latest".',
      "sunclaw.extensions must contain only non-empty strings.",
      "sunclaw.install.npmSpec must be a non-empty string for publishable plugins.",
    ]);
  });

  it("requires the GitHub repository URL npm provenance validates for trusted publishing", () => {
    expect(
      collectPublishablePluginPackageErrors({
        extensionId: "twitch",
        packageDir: bundledPluginRoot("twitch"),
        packageJson: {
          name: "@sunclaw/twitch",
          version: "2026.5.1-beta.1",
          sunclaw: {
            extensions: ["./index.ts"],
            ...externalPluginContract("2026.5.1-beta.1"),
            install: {
              npmSpec: "@sunclaw/twitch",
            },
            release: {
              publishToNpm: true,
            },
          },
        },
      }),
    ).toEqual([
      `package.json repository.url must be "${SUNCLAW_PLUGIN_NPM_REPOSITORY_URL}" so npm provenance can validate GitHub trusted publishing; found "<missing>".`,
    ]);
  });

  it("requires npm install metadata for publishable plugins", () => {
    expect(
      collectPublishablePluginPackageErrors({
        extensionId: "voice-call",
        packageDir: bundledPluginRoot("voice-call"),
        packageJson: {
          name: "@sunclaw/voice-call",
          version: "2026.5.1-beta.1",
          repository: {
            type: "git",
            url: SUNCLAW_PLUGIN_NPM_REPOSITORY_URL,
          },
          sunclaw: {
            extensions: ["./index.ts"],
            ...externalPluginContract("2026.5.1-beta.1"),
            release: {
              publishToNpm: true,
            },
          },
        },
      }),
    ).toEqual(["sunclaw.install.npmSpec must be a non-empty string for publishable plugins."]);
  });

  it("requires the external plugin package compatibility contract for npm publish", () => {
    expect(
      collectPublishablePluginPackageErrors({
        extensionId: "voice-call",
        packageDir: bundledPluginRoot("voice-call"),
        packageJson: {
          name: "@sunclaw/voice-call",
          version: "2026.5.1-beta.1",
          repository: {
            type: "git",
            url: SUNCLAW_PLUGIN_NPM_REPOSITORY_URL,
          },
          sunclaw: {
            extensions: ["./index.ts"],
            install: {
              npmSpec: "@sunclaw/voice-call",
            },
            release: {
              publishToNpm: true,
            },
          },
        },
      }),
    ).toEqual([
      "sunclaw.compat.pluginApi is required for external code plugin packages.",
      "sunclaw.build.sunclawVersion is required for external code plugin packages.",
    ]);
  });
});

describe("collectPublishablePluginPackages", () => {
  it("keeps publishable plugin dist trees out of the core npm package files list", () => {
    const corePackageRuntimePluginIds = new Set(["discord"]);
    const rootPackage = JSON.parse(readFileSync("package.json", "utf8")) as {
      files?: unknown;
    };
    const packageFiles = new Set(Array.isArray(rootPackage.files) ? rootPackage.files : []);
    const publishablePlugins = [
      ...collectPublishablePluginPackages(),
      ...collectClawHubPublishablePluginPackages(),
    ];
    const missingExclusions = Array.from(
      new Set(
        publishablePlugins
          .filter((plugin) => !corePackageRuntimePluginIds.has(plugin.extensionId))
          .map((plugin) => `!dist/extensions/${plugin.extensionId}/**`),
      ),
    ).filter((entry) => !packageFiles.has(entry));

    expect(missingExclusions).toStrictEqual([]);
  });

  it("collects publishable npm plugins from extension package manifests", () => {
    const repoDir = makeTempRepoRoot(tempDirs, "sunclaw-plugin-npm-release-");
    mkdirSync(join(repoDir, "extensions", "demo-plugin"), { recursive: true });
    writeJsonFile(join(repoDir, "extensions", "demo-plugin", "package.json"), {
      name: "@sunclaw/demo-plugin",
      version: "2026.4.10",
      repository: {
        type: "git",
        url: SUNCLAW_PLUGIN_NPM_REPOSITORY_URL,
      },
      sunclaw: {
        extensions: ["./index.ts"],
        ...externalPluginContract("2026.4.10"),
        install: {
          npmSpec: "@sunclaw/demo-plugin",
        },
        release: {
          publishToNpm: true,
        },
      },
    });

    expect(collectPublishablePluginPackages(repoDir)).toEqual([
      {
        extensionId: "demo-plugin",
        packageDir: "extensions/demo-plugin",
        packageName: "@sunclaw/demo-plugin",
        version: "2026.4.10",
        channel: "stable",
        publishTag: "latest",
        installNpmSpec: "@sunclaw/demo-plugin",
      },
    ]);
  });

  it("does not validate unselected publishable plugin manifests", () => {
    const repoDir = makeTempRepoRoot(tempDirs, "sunclaw-plugin-npm-release-");
    mkdirSync(join(repoDir, "extensions", "demo-plugin"), { recursive: true });
    writeJsonFile(join(repoDir, "extensions", "demo-plugin", "package.json"), {
      name: "@sunclaw/demo-plugin",
      version: "2026.4.10-beta.1",
      repository: {
        type: "git",
        url: SUNCLAW_PLUGIN_NPM_REPOSITORY_URL,
      },
      sunclaw: {
        extensions: ["./index.ts"],
        ...externalPluginContract("2026.4.10-beta.1"),
        install: {
          npmSpec: "@sunclaw/demo-plugin",
        },
        release: {
          publishToNpm: true,
        },
      },
    });
    mkdirSync(join(repoDir, "extensions", "private-plugin"), { recursive: true });
    writeJsonFile(join(repoDir, "extensions", "private-plugin", "package.json"), {
      name: "@sunclaw/private-plugin",
      version: "2026.4.10-beta.1",
      private: true,
      sunclaw: {
        extensions: ["./index.ts"],
        ...externalPluginContract("2026.4.10-beta.1"),
        install: {
          npmSpec: "@sunclaw/private-plugin",
        },
        release: {
          publishToNpm: true,
        },
      },
    });

    expect(
      collectPublishablePluginPackages(repoDir, {
        packageNames: ["@sunclaw/demo-plugin"],
      }),
    ).toEqual([
      {
        extensionId: "demo-plugin",
        packageDir: "extensions/demo-plugin",
        installNpmSpec: "@sunclaw/demo-plugin",
        channel: "beta",
        packageName: "@sunclaw/demo-plugin",
        publishTag: "beta",
        version: "2026.4.10-beta.1",
      },
    ]);
  });

  it("treats an explicit empty extension filter as no candidates", () => {
    const repoDir = makeTempRepoRoot(tempDirs, "sunclaw-plugin-npm-release-");
    mkdirSync(join(repoDir, "extensions", "private-plugin"), { recursive: true });
    writeJsonFile(join(repoDir, "extensions", "private-plugin", "package.json"), {
      name: "@sunclaw/private-plugin",
      version: "2026.4.10-beta.1",
      private: true,
      sunclaw: {
        extensions: ["./index.ts"],
        ...externalPluginContract("2026.4.10-beta.1"),
        release: {
          publishToNpm: true,
        },
      },
    });

    expect(
      collectPublishablePluginPackages(repoDir, {
        extensionIds: [],
      }),
    ).toStrictEqual([]);
  });

  it("publishes alpha plugin packages to the alpha dist-tag", () => {
    const repoDir = makeTempRepoRoot(tempDirs, "sunclaw-plugin-npm-release-");
    mkdirSync(join(repoDir, "extensions", "demo-plugin"), { recursive: true });
    writeJsonFile(join(repoDir, "extensions", "demo-plugin", "package.json"), {
      name: "@sunclaw/demo-plugin",
      version: "2026.4.10-alpha.1",
      repository: {
        type: "git",
        url: SUNCLAW_PLUGIN_NPM_REPOSITORY_URL,
      },
      sunclaw: {
        extensions: ["./index.ts"],
        ...externalPluginContract("2026.4.10-alpha.1"),
        install: {
          npmSpec: "@sunclaw/demo-plugin",
        },
        release: {
          publishToNpm: true,
        },
      },
    });

    expect(collectPublishablePluginPackages(repoDir)).toEqual([
      {
        extensionId: "demo-plugin",
        packageDir: "extensions/demo-plugin",
        installNpmSpec: "@sunclaw/demo-plugin",
        packageName: "@sunclaw/demo-plugin",
        channel: "alpha",
        publishTag: "alpha",
        version: "2026.4.10-alpha.1",
      },
    ]);
  });
});

describe("resolveSelectedPublishablePluginPackages", () => {
  const publishablePlugins: PublishablePluginPackage[] = [
    {
      extensionId: "feishu",
      packageDir: bundledPluginRoot("feishu"),
      packageName: "@sunclaw/feishu",
      version: "2026.3.15",
      channel: "stable",
      publishTag: "latest",
    },
    {
      extensionId: "zalo",
      packageDir: bundledPluginRoot("zalo"),
      packageName: "@sunclaw/zalo",
      version: "2026.3.15-beta.1",
      channel: "beta",
      publishTag: "beta",
    },
  ];

  it("returns all publishable plugins when no selection is provided", () => {
    expect(
      resolveSelectedPublishablePluginPackages({
        plugins: publishablePlugins,
        selection: [],
      }),
    ).toEqual(publishablePlugins);
  });

  it("filters by selected publishable package names", () => {
    expect(
      resolveSelectedPublishablePluginPackages({
        plugins: publishablePlugins,
        selection: ["@sunclaw/zalo"],
      }),
    ).toEqual([publishablePlugins[1]]);
  });

  it("throws when the selection contains an unknown package name", () => {
    expect(() =>
      resolveSelectedPublishablePluginPackages({
        plugins: publishablePlugins,
        selection: ["@sunclaw/missing"],
      }),
    ).toThrowError("Unknown or non-publishable plugin package selection: @sunclaw/missing.");
  });
});

describe("collectChangedExtensionIdsFromPaths", () => {
  it("extracts unique extension ids from changed extension paths", () => {
    expect(
      collectChangedExtensionIdsFromPaths([
        bundledPluginFile("zalo", "index.ts"),
        bundledPluginFile("zalo", "package.json"),
        bundledPluginFile("feishu", "src/client.ts"),
        "docs/reference/RELEASING.md",
      ]),
    ).toEqual(["feishu", "zalo"]);
  });
});

describe("resolveChangedPublishablePluginPackages", () => {
  const publishablePlugins: PublishablePluginPackage[] = [
    {
      extensionId: "feishu",
      packageDir: bundledPluginRoot("feishu"),
      packageName: "@sunclaw/feishu",
      version: "2026.3.15",
      channel: "stable",
      publishTag: "latest",
    },
    {
      extensionId: "zalo",
      packageDir: bundledPluginRoot("zalo"),
      packageName: "@sunclaw/zalo",
      version: "2026.3.15-beta.1",
      channel: "beta",
      publishTag: "beta",
    },
  ];

  it("returns only changed publishable plugins", () => {
    expect(
      resolveChangedPublishablePluginPackages({
        plugins: publishablePlugins,
        changedExtensionIds: ["zalo"],
      }),
    ).toEqual([publishablePlugins[1]]);
  });

  it("returns an empty list when no publishable plugins changed", () => {
    expect(
      resolveChangedPublishablePluginPackages({
        plugins: publishablePlugins,
        changedExtensionIds: [],
      }),
    ).toStrictEqual([]);
  });
});
