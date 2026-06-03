// swift-tools-version: 6.2
// Package manifest for the SunClaw macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "SunClaw",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "SunClawIPC", targets: ["SunClawIPC"]),
        .library(name: "SunClawDiscovery", targets: ["SunClawDiscovery"]),
        .executable(name: "SunClaw", targets: ["SunClaw"]),
        .executable(name: "sunclaw-mac", targets: ["SunClawMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.3.0"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.4.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.10.1"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.9.0"),
        .package(url: "https://github.com/steipete/Peekaboo.git", exact: "3.2.1"),
        .package(path: "../shared/SunClawKit"),
        .package(path: "../swabble"),
    ],
    targets: [
        .target(
            name: "SunClawIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "SunClawDiscovery",
            dependencies: [
                .product(name: "SunClawKit", package: "SunClawKit"),
            ],
            path: "Sources/SunClawDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "SunClaw",
            dependencies: [
                "SunClawIPC",
                "SunClawDiscovery",
                .product(name: "SunClawKit", package: "SunClawKit"),
                .product(name: "SunClawChatUI", package: "SunClawKit"),
                .product(name: "SunClawProtocol", package: "SunClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/SunClaw.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "SunClawMacCLI",
            dependencies: [
                "SunClawDiscovery",
                .product(name: "SunClawKit", package: "SunClawKit"),
                .product(name: "SunClawProtocol", package: "SunClawKit"),
            ],
            path: "Sources/SunClawMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "SunClawIPCTests",
            dependencies: [
                "SunClawIPC",
                "SunClaw",
                "SunClawMacCLI",
                "SunClawDiscovery",
                .product(name: "SunClawProtocol", package: "SunClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
