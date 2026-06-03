import { describeGithubCopilotProviderRuntimeContract } from "sunclaw/plugin-sdk/provider-test-contracts";

describeGithubCopilotProviderRuntimeContract(() => import("./index.js"));
