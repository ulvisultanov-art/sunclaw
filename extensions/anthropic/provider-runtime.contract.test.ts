import { describeAnthropicProviderRuntimeContract } from "sunclaw/plugin-sdk/provider-test-contracts";

describeAnthropicProviderRuntimeContract(() => import("./index.js"));
