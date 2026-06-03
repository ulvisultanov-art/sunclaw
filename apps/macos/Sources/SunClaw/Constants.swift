import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-sunclaw writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.sunclaw.mac"
let gatewayLaunchdLabel = "ai.sunclaw.gateway"
let onboardingVersionKey = "sunclaw.onboardingVersion"
let onboardingSeenKey = "sunclaw.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "sunclaw.pauseEnabled"
let iconAnimationsEnabledKey = "sunclaw.iconAnimationsEnabled"
let swabbleEnabledKey = "sunclaw.swabbleEnabled"
let swabbleTriggersKey = "sunclaw.swabbleTriggers"
let voiceWakeTriggerChimeKey = "sunclaw.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "sunclaw.voiceWakeSendChime"
let showDockIconKey = "sunclaw.showDockIcon"
let defaultVoiceWakeTriggers = ["sunclaw"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "sunclaw.voiceWakeMicID"
let voiceWakeMicNameKey = "sunclaw.voiceWakeMicName"
let voiceWakeLocaleKey = "sunclaw.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "sunclaw.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "sunclaw.voicePushToTalkEnabled"
let voiceWakeTriggersTalkModeKey = "sunclaw.voiceWakeTriggersTalkMode"
let talkEnabledKey = "sunclaw.talkEnabled"
let talkPhaseSoundsEnabledKey = "sunclaw.talkPhaseSoundsEnabled"
let talkShiftToStopEnabledKey = "sunclaw.talkShiftToStopEnabled"
let iconOverrideKey = "sunclaw.iconOverride"
let connectionModeKey = "sunclaw.connectionMode"
let remoteTargetKey = "sunclaw.remoteTarget"
let remoteIdentityKey = "sunclaw.remoteIdentity"
let remoteProjectRootKey = "sunclaw.remoteProjectRoot"
let remoteCliPathKey = "sunclaw.remoteCliPath"
let canvasEnabledKey = "sunclaw.canvasEnabled"
let cameraEnabledKey = "sunclaw.cameraEnabled"
let systemRunPolicyKey = "sunclaw.systemRunPolicy"
let systemRunAllowlistKey = "sunclaw.systemRunAllowlist"
let systemRunEnabledKey = "sunclaw.systemRunEnabled"
let locationModeKey = "sunclaw.locationMode"
let locationPreciseKey = "sunclaw.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "sunclaw.peekabooBridgeEnabled"
let deepLinkKeyKey = "sunclaw.deepLinkKey"
let cliInstallPromptedVersionKey = "sunclaw.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "sunclaw.heartbeatsEnabled"
let debugPaneEnabledKey = "sunclaw.debugPaneEnabled"
let debugFileLogEnabledKey = "sunclaw.debug.fileLogEnabled"
let appLogLevelKey = "sunclaw.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
