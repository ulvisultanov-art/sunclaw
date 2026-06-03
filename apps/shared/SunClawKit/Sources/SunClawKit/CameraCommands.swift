import Foundation

public enum SunClawCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum SunClawCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum SunClawCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum SunClawCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct SunClawCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: SunClawCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: SunClawCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: SunClawCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: SunClawCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct SunClawCameraClipParams: Codable, Sendable, Equatable {
    public var facing: SunClawCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: SunClawCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: SunClawCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: SunClawCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
