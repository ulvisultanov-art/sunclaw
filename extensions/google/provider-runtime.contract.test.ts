import { describeGoogleProviderRuntimeContract } from "sunclaw/plugin-sdk/provider-test-contracts";

describeGoogleProviderRuntimeContract(() => import("./index.js"));
