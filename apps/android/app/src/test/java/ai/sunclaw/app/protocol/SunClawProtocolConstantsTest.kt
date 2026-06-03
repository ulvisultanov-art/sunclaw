package ai.sunclaw.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class SunClawProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", SunClawCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", SunClawCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", SunClawCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", SunClawCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", SunClawCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", SunClawCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", SunClawCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", SunClawCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", SunClawCapability.Canvas.rawValue)
    assertEquals("camera", SunClawCapability.Camera.rawValue)
    assertEquals("voiceWake", SunClawCapability.VoiceWake.rawValue)
    assertEquals("talk", SunClawCapability.Talk.rawValue)
    assertEquals("location", SunClawCapability.Location.rawValue)
    assertEquals("sms", SunClawCapability.Sms.rawValue)
    assertEquals("device", SunClawCapability.Device.rawValue)
    assertEquals("notifications", SunClawCapability.Notifications.rawValue)
    assertEquals("system", SunClawCapability.System.rawValue)
    assertEquals("photos", SunClawCapability.Photos.rawValue)
    assertEquals("contacts", SunClawCapability.Contacts.rawValue)
    assertEquals("calendar", SunClawCapability.Calendar.rawValue)
    assertEquals("motion", SunClawCapability.Motion.rawValue)
    assertEquals("callLog", SunClawCapability.CallLog.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", SunClawCameraCommand.List.rawValue)
    assertEquals("camera.snap", SunClawCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", SunClawCameraCommand.Clip.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", SunClawNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", SunClawNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", SunClawDeviceCommand.Status.rawValue)
    assertEquals("device.info", SunClawDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", SunClawDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", SunClawDeviceCommand.Health.rawValue)
    assertEquals("device.apps", SunClawDeviceCommand.Apps.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", SunClawSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", SunClawPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", SunClawContactsCommand.Search.rawValue)
    assertEquals("contacts.add", SunClawContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", SunClawCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", SunClawCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", SunClawMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", SunClawMotionCommand.Pedometer.rawValue)
  }

  @Test
  fun smsCommandsUseStableStrings() {
    assertEquals("sms.send", SunClawSmsCommand.Send.rawValue)
    assertEquals("sms.search", SunClawSmsCommand.Search.rawValue)
  }

  @Test
  fun talkCommandsUseStableStrings() {
    assertEquals("talk.ptt.start", SunClawTalkCommand.PttStart.rawValue)
    assertEquals("talk.ptt.stop", SunClawTalkCommand.PttStop.rawValue)
    assertEquals("talk.ptt.cancel", SunClawTalkCommand.PttCancel.rawValue)
    assertEquals("talk.ptt.once", SunClawTalkCommand.PttOnce.rawValue)
  }

  @Test
  fun callLogCommandsUseStableStrings() {
    assertEquals("callLog.search", SunClawCallLogCommand.Search.rawValue)
  }
}
