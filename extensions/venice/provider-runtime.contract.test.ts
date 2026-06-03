import { describeVeniceProviderRuntimeContract } from "sunclaw/plugin-sdk/provider-test-contracts";

describeVeniceProviderRuntimeContract(() => import("./index.js"));
