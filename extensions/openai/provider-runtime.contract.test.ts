import { describeOpenAIProviderRuntimeContract } from "sunclaw/plugin-sdk/provider-test-contracts";

describeOpenAIProviderRuntimeContract(() => import("./index.js"));
