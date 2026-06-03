package ai.sunclaw.app.node

import ai.sunclaw.app.protocol.SunClawCalendarCommand
import ai.sunclaw.app.protocol.SunClawCallLogCommand
import ai.sunclaw.app.protocol.SunClawCameraCommand
import ai.sunclaw.app.protocol.SunClawCapability
import ai.sunclaw.app.protocol.SunClawContactsCommand
import ai.sunclaw.app.protocol.SunClawDeviceCommand
import ai.sunclaw.app.protocol.SunClawLocationCommand
import ai.sunclaw.app.protocol.SunClawMotionCommand
import ai.sunclaw.app.protocol.SunClawNotificationsCommand
import ai.sunclaw.app.protocol.SunClawPhotosCommand
import ai.sunclaw.app.protocol.SunClawSmsCommand
import ai.sunclaw.app.protocol.SunClawSystemCommand
import ai.sunclaw.app.protocol.SunClawTalkCommand
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      SunClawCapability.Canvas.rawValue,
      SunClawCapability.Device.rawValue,
      SunClawCapability.Notifications.rawValue,
      SunClawCapability.System.rawValue,
      SunClawCapability.Talk.rawValue,
      SunClawCapability.Contacts.rawValue,
      SunClawCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      SunClawCapability.Camera.rawValue,
      SunClawCapability.Location.rawValue,
      SunClawCapability.Sms.rawValue,
      SunClawCapability.CallLog.rawValue,
      SunClawCapability.VoiceWake.rawValue,
      SunClawCapability.Motion.rawValue,
      SunClawCapability.Photos.rawValue,
    )

  private val coreCommands =
    setOf(
      SunClawDeviceCommand.Status.rawValue,
      SunClawDeviceCommand.Info.rawValue,
      SunClawDeviceCommand.Permissions.rawValue,
      SunClawDeviceCommand.Health.rawValue,
      SunClawNotificationsCommand.List.rawValue,
      SunClawNotificationsCommand.Actions.rawValue,
      SunClawSystemCommand.Notify.rawValue,
      SunClawTalkCommand.PttStart.rawValue,
      SunClawTalkCommand.PttStop.rawValue,
      SunClawTalkCommand.PttCancel.rawValue,
      SunClawTalkCommand.PttOnce.rawValue,
      SunClawContactsCommand.Search.rawValue,
      SunClawContactsCommand.Add.rawValue,
      SunClawCalendarCommand.Events.rawValue,
      SunClawCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      SunClawCameraCommand.Snap.rawValue,
      SunClawCameraCommand.Clip.rawValue,
      SunClawCameraCommand.List.rawValue,
      SunClawLocationCommand.Get.rawValue,
      SunClawMotionCommand.Activity.rawValue,
      SunClawMotionCommand.Pedometer.rawValue,
      SunClawSmsCommand.Send.rawValue,
      SunClawSmsCommand.Search.rawValue,
      SunClawCallLogCommand.Search.rawValue,
      SunClawPhotosCommand.Latest.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          sendSmsAvailable = true,
          readSmsAvailable = true,
          smsSearchPossible = true,
          callLogAvailable = true,
          photosAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesDeviceAppsOnlyWhenUserOptedIn() {
    val disabled = InvokeCommandRegistry.advertisedCommands(defaultFlags(installedAppsSharingEnabled = false))
    val enabled = InvokeCommandRegistry.advertisedCommands(defaultFlags(installedAppsSharingEnabled = true))

    assertFalse(disabled.contains(SunClawDeviceCommand.Apps.rawValue))
    assertTrue(enabled.contains(SunClawDeviceCommand.Apps.rawValue))
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          sendSmsAvailable = true,
          readSmsAvailable = true,
          smsSearchPossible = true,
          callLogAvailable = true,
          photosAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          sendSmsAvailable = false,
          readSmsAvailable = false,
          smsSearchPossible = false,
          callLogAvailable = false,
          photosAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          installedAppsSharingEnabled = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(SunClawMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(SunClawMotionCommand.Pedometer.rawValue))
  }

  @Test
  fun advertisedCommands_splitsSmsSendAndSearchAvailability() {
    val readOnlyCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(readSmsAvailable = true, smsSearchPossible = true),
      )
    val sendOnlyCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(sendSmsAvailable = true),
      )
    val requestableSearchCommands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(smsSearchPossible = true),
      )

    assertTrue(readOnlyCommands.contains(SunClawSmsCommand.Search.rawValue))
    assertFalse(readOnlyCommands.contains(SunClawSmsCommand.Send.rawValue))
    assertTrue(sendOnlyCommands.contains(SunClawSmsCommand.Send.rawValue))
    assertFalse(sendOnlyCommands.contains(SunClawSmsCommand.Search.rawValue))
    assertTrue(requestableSearchCommands.contains(SunClawSmsCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_includeSmsWhenEitherSmsPathIsAvailable() {
    val readOnlyCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(readSmsAvailable = true),
      )
    val sendOnlyCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(sendSmsAvailable = true),
      )
    val requestableSearchCapabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(smsSearchPossible = true),
      )

    assertTrue(readOnlyCapabilities.contains(SunClawCapability.Sms.rawValue))
    assertTrue(sendOnlyCapabilities.contains(SunClawCapability.Sms.rawValue))
    assertFalse(requestableSearchCapabilities.contains(SunClawCapability.Sms.rawValue))
  }

  @Test
  fun advertisedCommands_excludesCallLogWhenUnavailable() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags(callLogAvailable = false))

    assertFalse(commands.contains(SunClawCallLogCommand.Search.rawValue))
  }

  @Test
  fun advertisedCapabilities_excludesCallLogWhenUnavailable() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags(callLogAvailable = false))

    assertFalse(capabilities.contains(SunClawCapability.CallLog.rawValue))
  }

  @Test
  fun advertisedPhotosSurface_respectsFeatureAvailability() {
    val disabledFlags = defaultFlags(photosAvailable = false)
    val enabledFlags = defaultFlags(photosAvailable = true)

    assertFalse(InvokeCommandRegistry.advertisedCapabilities(disabledFlags).contains(SunClawCapability.Photos.rawValue))
    assertFalse(InvokeCommandRegistry.advertisedCommands(disabledFlags).contains(SunClawPhotosCommand.Latest.rawValue))
    assertTrue(InvokeCommandRegistry.advertisedCapabilities(enabledFlags).contains(SunClawCapability.Photos.rawValue))
    assertTrue(InvokeCommandRegistry.advertisedCommands(enabledFlags).contains(SunClawPhotosCommand.Latest.rawValue))
  }

  @Test
  fun advertisedCapabilities_includesVoiceWakeWithoutAdvertisingCommands() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags(voiceWakeEnabled = true))
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags(voiceWakeEnabled = true))

    assertTrue(capabilities.contains(SunClawCapability.VoiceWake.rawValue))
    assertFalse(commands.any { it.contains("voice", ignoreCase = true) })
  }

  @Test
  fun find_returnsForegroundMetadataForCameraCommands() {
    val list = InvokeCommandRegistry.find(SunClawCameraCommand.List.rawValue)
    val location = InvokeCommandRegistry.find(SunClawLocationCommand.Get.rawValue)

    assertNotNull(list)
    assertEquals(true, list?.requiresForeground)
    assertNotNull(location)
    assertEquals(false, location?.requiresForeground)
  }

  @Test
  fun find_returnsNullForUnknownCommand() {
    assertNull(InvokeCommandRegistry.find("not.real"))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    sendSmsAvailable: Boolean = false,
    readSmsAvailable: Boolean = false,
    smsSearchPossible: Boolean = false,
    callLogAvailable: Boolean = false,
    photosAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    installedAppsSharingEnabled: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      sendSmsAvailable = sendSmsAvailable,
      readSmsAvailable = readSmsAvailable,
      smsSearchPossible = smsSearchPossible,
      callLogAvailable = callLogAvailable,
      photosAvailable = photosAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      installedAppsSharingEnabled = installedAppsSharingEnabled,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(
    actual: List<String>,
    expected: Set<String>,
  ) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(
    actual: List<String>,
    forbidden: Set<String>,
  ) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
