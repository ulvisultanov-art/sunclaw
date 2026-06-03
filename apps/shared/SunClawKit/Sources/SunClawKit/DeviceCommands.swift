import Foundation

public enum SunClawDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum SunClawBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum SunClawThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum SunClawNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum SunClawNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct SunClawBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: SunClawBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: SunClawBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct SunClawThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: SunClawThermalState

    public init(state: SunClawThermalState) {
        self.state = state
    }
}

public struct SunClawStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct SunClawNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: SunClawNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [SunClawNetworkInterfaceType]

    public init(
        status: SunClawNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [SunClawNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct SunClawDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: SunClawBatteryStatusPayload
    public var thermal: SunClawThermalStatusPayload
    public var storage: SunClawStorageStatusPayload
    public var network: SunClawNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: SunClawBatteryStatusPayload,
        thermal: SunClawThermalStatusPayload,
        storage: SunClawStorageStatusPayload,
        network: SunClawNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct SunClawDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
