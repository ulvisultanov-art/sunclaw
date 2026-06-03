import { describeGithubCopilotProviderAuthContract } from "sunclaw/plugin-sdk/provider-test-contracts";

describeGithubCopilotProviderAuthContract(() => import("./index.js"));
