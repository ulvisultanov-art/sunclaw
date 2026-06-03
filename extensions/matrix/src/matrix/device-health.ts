export type MatrixManagedDeviceInfo = {
  deviceId: string;
  displayName: string | null;
  current: boolean;
};

export type MatrixDeviceHealthSummary = {
  currentDeviceId: string | null;
  staleSunClawDevices: MatrixManagedDeviceInfo[];
  currentSunClawDevices: MatrixManagedDeviceInfo[];
};

const SUNCLAW_DEVICE_NAME_PREFIX = "SunClaw ";

export function isSunClawManagedMatrixDevice(displayName: string | null | undefined): boolean {
  return displayName?.startsWith(SUNCLAW_DEVICE_NAME_PREFIX) === true;
}

export function summarizeMatrixDeviceHealth(
  devices: MatrixManagedDeviceInfo[],
): MatrixDeviceHealthSummary {
  const currentDeviceId = devices.find((device) => device.current)?.deviceId ?? null;
  const sunClawDevices = devices.filter((device) =>
    isSunClawManagedMatrixDevice(device.displayName),
  );
  return {
    currentDeviceId,
    staleSunClawDevices: sunClawDevices.filter((device) => !device.current),
    currentSunClawDevices: sunClawDevices.filter((device) => device.current),
  };
}
