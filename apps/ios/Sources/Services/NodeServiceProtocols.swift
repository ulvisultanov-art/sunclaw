import CoreLocation
import Foundation
import SunClawKit
import UIKit

typealias SunClawCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias SunClawCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: SunClawCameraSnapParams) async throws -> SunClawCameraSnapResult
    func clip(params: SunClawCameraClipParams) async throws -> SunClawCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: SunClawLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: SunClawLocationGetParams,
        desiredAccuracy: SunClawLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: SunClawLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> SunClawDeviceStatusPayload
    func info() -> SunClawDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: SunClawPhotosLatestParams) async throws -> SunClawPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: SunClawContactsSearchParams) async throws -> SunClawContactsSearchPayload
    func add(params: SunClawContactsAddParams) async throws -> SunClawContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: SunClawCalendarEventsParams) async throws -> SunClawCalendarEventsPayload
    func add(params: SunClawCalendarAddParams) async throws -> SunClawCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: SunClawRemindersListParams) async throws -> SunClawRemindersListPayload
    func add(params: SunClawRemindersAddParams) async throws -> SunClawRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: SunClawMotionActivityParams) async throws -> SunClawMotionActivityPayload
    func pedometer(params: SunClawPedometerParams) async throws -> SunClawPedometerPayload
}

struct WatchMessagingStatus: Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchExecApprovalResolveEvent: Equatable {
    var replyId: String
    var approvalId: String
    var decision: SunClawWatchExecApprovalDecision
    var sentAtMs: Int?
    var transport: String
}

struct WatchExecApprovalSnapshotRequestEvent: Equatable {
    var requestId: String
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setStatusHandler(_ handler: (@Sendable (WatchMessagingStatus) -> Void)?)
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func setExecApprovalResolveHandler(_ handler: (@Sendable (WatchExecApprovalResolveEvent) -> Void)?)
    func setExecApprovalSnapshotRequestHandler(
        _ handler: (@Sendable (WatchExecApprovalSnapshotRequestEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: SunClawWatchNotifyParams) async throws -> WatchNotificationSendResult
    func sendExecApprovalPrompt(
        _ message: SunClawWatchExecApprovalPromptMessage) async throws -> WatchNotificationSendResult
    func sendExecApprovalResolved(
        _ message: SunClawWatchExecApprovalResolvedMessage) async throws -> WatchNotificationSendResult
    func sendExecApprovalExpired(
        _ message: SunClawWatchExecApprovalExpiredMessage) async throws -> WatchNotificationSendResult
    func syncExecApprovalSnapshot(
        _ message: SunClawWatchExecApprovalSnapshotMessage) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
