import { pluginRegistrationContractCases } from "sunclaw/plugin-sdk/plugin-test-contracts";
import { describePluginRegistrationContract } from "sunclaw/plugin-sdk/plugin-test-contracts";

const pluginRegistrationContractCaseList = Object.values(pluginRegistrationContractCases).toSorted(
  (left, right) => left.pluginId.localeCompare(right.pluginId),
);

for (const contractCase of pluginRegistrationContractCaseList) {
  describePluginRegistrationContract(contractCase);
}
