import { describe, expect, it } from "vitest";
import { collectPresentSunClawTools } from "./sunclaw-tools.registration.js";
import { createPdfTool } from "./tools/pdf-tool.js";

describe("createSunClawTools PDF registration", () => {
  it("includes the pdf tool when the pdf factory returns a tool", () => {
    const pdfTool = createPdfTool({
      agentDir: "/tmp/sunclaw-agent-main",
      config: {
        agents: {
          defaults: {
            pdfModel: { primary: "openai/gpt-5.4-mini" },
          },
        },
      },
    });

    expect(pdfTool?.name).toBe("pdf");
    expect(collectPresentSunClawTools([pdfTool]).map((tool) => tool.name)).toEqual(["pdf"]);
  });
});
