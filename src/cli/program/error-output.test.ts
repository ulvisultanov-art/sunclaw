import { describe, expect, it } from "vitest";
import { formatCliParseErrorOutput } from "./error-output.js";

describe("formatCliParseErrorOutput", () => {
  it("explains unknown commands with root help and plugin hints", () => {
    const output = formatCliParseErrorOutput("error: unknown command 'wat'\n", {
      argv: ["node", "sunclaw", "wat"],
    });

    expect(output).toBe(
      'SunClaw does not know the command "wat".\nTry: sunclaw --help\nPlugin command? sunclaw plugins list\nDocs: https://docs.sunclaw.complex.az/cli\n',
    );
  });

  it("points unknown options at the active command help", () => {
    const output = formatCliParseErrorOutput("error: unknown option '--wat'\n", {
      argv: ["node", "sunclaw", "channels", "status", "--wat"],
    });

    expect(output).toBe(
      'SunClaw does not recognize option "--wat".\nTry: sunclaw channels status --help\n',
    );
  });

  it("points missing required arguments at command help", () => {
    const output = formatCliParseErrorOutput("error: missing required argument 'name'\n", {
      argv: ["node", "sunclaw", "plugins", "install"],
    });

    expect(output).toBe('Missing required argument "name".\nTry: sunclaw plugins install --help\n');
  });
});
