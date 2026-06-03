import { describeZAIProviderRuntimeContract } from "sunclaw/plugin-sdk/provider-test-contracts";

describeZAIProviderRuntimeContract(() => import("./index.js"));
