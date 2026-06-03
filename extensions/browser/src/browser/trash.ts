import os from "node:os";
import { movePathToTrash as movePathToTrashWithAllowedRoots } from "sunclaw/plugin-sdk/browser-config";
import { resolvePreferredSunClawTmpDir } from "sunclaw/plugin-sdk/temp-path";

export async function movePathToTrash(targetPath: string): Promise<string> {
  return await movePathToTrashWithAllowedRoots(targetPath, {
    allowedRoots: [os.homedir(), resolvePreferredSunClawTmpDir()],
  });
}
