import ActivityKit
import Foundation

/// Shared schema used by iOS app + Live Activity widget extension.
struct SunClawActivityAttributes: ActivityAttributes {
    var agentName: String
    var sessionKey: String

    struct ContentState: Codable, Hashable {
        var statusText: String
        var isIdle: Bool
        var isDisconnected: Bool
        var isConnecting: Bool
        var startedAt: Date
    }
}

#if DEBUG
extension SunClawActivityAttributes {
    static let preview = SunClawActivityAttributes(agentName: "main", sessionKey: "main")
}

extension SunClawActivityAttributes.ContentState {
    static let connecting = SunClawActivityAttributes.ContentState(
        statusText: "Connecting...",
        isIdle: false,
        isDisconnected: false,
        isConnecting: true,
        startedAt: .now)

    static let idle = SunClawActivityAttributes.ContentState(
        statusText: "Idle",
        isIdle: true,
        isDisconnected: false,
        isConnecting: false,
        startedAt: .now)

    static let disconnected = SunClawActivityAttributes.ContentState(
        statusText: "Disconnected",
        isIdle: false,
        isDisconnected: true,
        isConnecting: false,
        startedAt: .now)

    static let attention = SunClawActivityAttributes.ContentState(
        statusText: "Approval needed",
        isIdle: false,
        isDisconnected: false,
        isConnecting: false,
        startedAt: .now)
}
#endif
