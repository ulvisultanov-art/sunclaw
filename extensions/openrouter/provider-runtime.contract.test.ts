import { describeOpenRouterProviderRuntimeContract } from "sunclaw/plugin-sdk/provider-test-contracts";

describeOpenRouterProviderRuntimeContract(() => import("./index.js"));
