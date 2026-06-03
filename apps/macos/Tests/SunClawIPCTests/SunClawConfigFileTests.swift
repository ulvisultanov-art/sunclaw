import Foundation
import Testing
@testable import SunClaw

@Suite(.serialized)
struct SunClawConfigFileTests {
    private func makeConfigOverridePath() -> String {
        FileManager().temporaryDirectory
            .appendingPathComponent("sunclaw-config-\(UUID().uuidString)")
            .appendingPathComponent("sunclaw.json")
            .path
    }

    @Test
    func `config path respects env override`() async {
        let override = self.makeConfigOverridePath()

        await TestIsolation.withEnvValues(["SUNCLAW_CONFIG_PATH": override]) {
            #expect(SunClawConfigFile.url().path == override)
        }
    }

    @MainActor
    @Test
    func `remote gateway port parses and matches host`() async {
        let override = self.makeConfigOverridePath()

        await TestIsolation.withEnvValues(["SUNCLAW_CONFIG_PATH": override]) {
            SunClawConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "ws://gateway.ts.net:19999",
                    ],
                ],
            ])
            #expect(SunClawConfigFile.remoteGatewayPort() == 19999)
            #expect(SunClawConfigFile.remoteGatewayPort(matchingHost: "gateway.ts.net") == 19999)
            #expect(SunClawConfigFile.remoteGatewayPort(matchingHost: "GATEWAY.ts.net.") == 19999)
            #expect(SunClawConfigFile.remoteGatewayPort(matchingHost: "gateway") == nil)
            #expect(SunClawConfigFile.remoteGatewayPort(matchingHost: "other.ts.net") == nil)
            #expect(SunClawConfigFile.remoteGatewayPort(matchingHost: "gateway.attacker.tld") == nil)
        }
    }

    @MainActor
    @Test
    func `set remote gateway url string replaces scheme`() async {
        let override = self.makeConfigOverridePath()

        await TestIsolation.withEnvValues(["SUNCLAW_CONFIG_PATH": override]) {
            SunClawConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            SunClawConfigFile.setRemoteGatewayUrlString("ws://127.0.0.1:18789")
            let root = SunClawConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "ws://127.0.0.1:18789")
        }
    }

    @MainActor
    @Test
    func `set remote gateway url preserves scheme`() async {
        let override = self.makeConfigOverridePath()

        await TestIsolation.withEnvValues(["SUNCLAW_CONFIG_PATH": override]) {
            SunClawConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            SunClawConfigFile.setRemoteGatewayUrl(host: "new-host", port: 2222)
            let root = SunClawConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "wss://new-host:2222")
        }
    }

    @MainActor
    @Test
    func `clear remote gateway url removes only url field`() async {
        let override = self.makeConfigOverridePath()

        await TestIsolation.withEnvValues(["SUNCLAW_CONFIG_PATH": override]) {
            SunClawConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                        "token": "tok",
                    ],
                ],
            ])
            SunClawConfigFile.clearRemoteGatewayUrl()
            let root = SunClawConfigFile.loadDict()
            let remote = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any]) ?? [:]
            #expect((remote["url"] as? String) == nil)
            #expect((remote["token"] as? String) == "tok")
        }
    }

    @Test
    func `state dir override sets config path`() async {
        let dir = FileManager().temporaryDirectory
            .appendingPathComponent("sunclaw-state-\(UUID().uuidString)", isDirectory: true)
            .path

        await TestIsolation.withEnvValues([
            "SUNCLAW_CONFIG_PATH": nil,
            "SUNCLAW_STATE_DIR": dir,
        ]) {
            #expect(SunClawConfigFile.stateDirURL().path == dir)
            #expect(SunClawConfigFile.url().path == "\(dir)/sunclaw.json")
        }
    }

    @MainActor
    @Test
    func `save dict appends config audit log`() async throws {
        let stateDir = FileManager().temporaryDirectory
            .appendingPathComponent("sunclaw-state-\(UUID().uuidString)", isDirectory: true)
        let configPath = stateDir.appendingPathComponent("sunclaw.json")
        let auditPath = stateDir.appendingPathComponent("logs/config-audit.jsonl")

        defer { try? FileManager().removeItem(at: stateDir) }

        try await TestIsolation.withEnvValues([
            "SUNCLAW_STATE_DIR": stateDir.path,
            "SUNCLAW_CONFIG_PATH": configPath.path,
        ]) {
            SunClawConfigFile.saveDict([
                "gateway": ["mode": "local"],
            ])

            let configData = try Data(contentsOf: configPath)
            let configRoot = try JSONSerialization.jsonObject(with: configData) as? [String: Any]
            #expect((configRoot?["meta"] as? [String: Any]) != nil)

            let rawAudit = try String(contentsOf: auditPath, encoding: .utf8)
            let lines = rawAudit
                .split(whereSeparator: \.isNewline)
                .map(String.init)
            #expect(!lines.isEmpty)
            guard let last = lines.last else {
                Issue.record("Missing config audit line")
                return
            }
            let auditRoot = try JSONSerialization.jsonObject(with: Data(last.utf8)) as? [String: Any]
            #expect(auditRoot?["source"] as? String == "macos-sunclaw-config-file")
            #expect(auditRoot?["event"] as? String == "config.write")
            #expect(auditRoot?["result"] as? String == "success")
            #expect(auditRoot?["configPath"] as? String == configPath.path)
            #expect(auditRoot?["previousMode"] is NSNull)
            #expect(auditRoot?["nextMode"] is NSNumber)
            #expect(auditRoot?["previousIno"] is NSNull)
            #expect(auditRoot?["nextIno"] as? String != nil)
        }
    }

    @MainActor
    @Test
    func `save dict preserves gateway auth unless explicitly allowed`() async throws {
        let stateDir = FileManager().temporaryDirectory
            .appendingPathComponent("sunclaw-state-\(UUID().uuidString)", isDirectory: true)
        let configPath = stateDir.appendingPathComponent("sunclaw.json")

        defer { try? FileManager().removeItem(at: stateDir) }

        await TestIsolation.withEnvValues([
            "SUNCLAW_STATE_DIR": stateDir.path,
            "SUNCLAW_CONFIG_PATH": configPath.path,
        ]) {
            SunClawConfigFile.saveDict([
                "gateway": [
                    "mode": "remote",
                    "auth": [
                        "mode": "token",
                        "token": "existing-token", // pragma: allowlist secret
                    ],
                ],
            ])

            SunClawConfigFile.saveDict([
                "gateway": [
                    "mode": "local",
                ],
            ])

            let root = SunClawConfigFile.loadDict()
            let gateway = root["gateway"] as? [String: Any]
            let auth = gateway?["auth"] as? [String: Any]
            #expect(gateway?["mode"] as? String == "local")
            #expect(auth?["mode"] as? String == "token")
            #expect(auth?["token"] as? String == "existing-token") // pragma: allowlist secret

            SunClawConfigFile.saveDict([
                "gateway": [
                    "mode": "local",
                ],
            ], allowGatewayAuthMutation: true)

            let allowedRoot = SunClawConfigFile.loadDict()
            let allowedGateway = allowedRoot["gateway"] as? [String: Any]
            #expect(allowedGateway?["mode"] as? String == "local")
            #expect((allowedGateway?["auth"] as? [String: Any]) == nil)
        }
    }

    @MainActor
    @Test
    func `save dict can merge local fallback writes with fresh config`() async throws {
        let stateDir = FileManager().temporaryDirectory
            .appendingPathComponent("sunclaw-state-\(UUID().uuidString)", isDirectory: true)
        let configPath = stateDir.appendingPathComponent("sunclaw.json")

        defer { try? FileManager().removeItem(at: stateDir) }

        await TestIsolation.withEnvValues([
            "SUNCLAW_STATE_DIR": stateDir.path,
            "SUNCLAW_CONFIG_PATH": configPath.path,
        ]) {
            SunClawConfigFile.saveDict([
                "gateway": [
                    "mode": "remote",
                    "auth": [
                        "mode": "password",
                        "password": "existing-password", // pragma: allowlist secret
                    ],
                ],
                "browser": [
                    "enabled": true,
                    "profile": "work",
                ],
                "channels": [
                    "discord": [
                        "enabled": true,
                    ],
                ],
            ])

            SunClawConfigFile.saveDict([
                "gateway": [
                    "mode": "local",
                ],
                "browser": [
                    "enabled": false,
                ],
            ], preserveExistingKeys: true)

            let root = SunClawConfigFile.loadDict()
            let gateway = root["gateway"] as? [String: Any]
            let auth = gateway?["auth"] as? [String: Any]
            let browser = root["browser"] as? [String: Any]
            let discord = ((root["channels"] as? [String: Any])?["discord"] as? [String: Any])
            #expect(gateway?["mode"] as? String == "local")
            #expect(auth?["mode"] as? String == "password")
            #expect(auth?["password"] as? String == "existing-password") // pragma: allowlist secret
            #expect(browser?["enabled"] as? Bool == false)
            #expect(browser?["profile"] as? String == "work")
            #expect(discord?["enabled"] as? Bool == true)
        }
    }

    @MainActor
    @Test
    func `load dict audits suspicious out-of-band clobbers`() async throws {
        let stateDir = FileManager().temporaryDirectory
            .appendingPathComponent("sunclaw-state-\(UUID().uuidString)", isDirectory: true)
        let configPath = stateDir.appendingPathComponent("sunclaw.json")
        let auditPath = stateDir.appendingPathComponent("logs/config-audit.jsonl")

        defer { try? FileManager().removeItem(at: stateDir) }

        try await TestIsolation.withEnvValues([
            "SUNCLAW_STATE_DIR": stateDir.path,
            "SUNCLAW_CONFIG_PATH": configPath.path,
        ]) {
            try SunClawConfigFile.withTestingFileLock {
                SunClawConfigFile.saveDict([
                    "update": ["channel": "beta"],
                    "browser": ["enabled": true],
                    "gateway": ["mode": "local"],
                    "channels": [
                        "discord": [
                            "enabled": true,
                            "dmPolicy": "pairing",
                        ],
                    ],
                ])
                _ = SunClawConfigFile.loadDict()

                let clobbered = """
                {
                  "update": {
                    "channel": "beta"
                  }
                }
                """
                try clobbered.write(to: configPath, atomically: true, encoding: .utf8)

                let loaded = SunClawConfigFile.loadDict()
                #expect((loaded["gateway"] as? [String: Any]) == nil)

                let rawAudit = try String(contentsOf: auditPath, encoding: .utf8)
                let lines = rawAudit
                    .split(whereSeparator: \.isNewline)
                    .map(String.init)
                let observeLine = lines.reversed().first { $0.contains("\"event\":\"config.observe\"") }
                #expect(observeLine != nil)
                guard let observeLine else {
                    Issue.record("Missing config.observe audit line")
                    return
                }
                let auditRoot = try JSONSerialization.jsonObject(with: Data(observeLine.utf8)) as? [String: Any]
                #expect(auditRoot?["source"] as? String == "macos-sunclaw-config-file")
                #expect(auditRoot?["configPath"] as? String == configPath.path)
                #expect(auditRoot?["mode"] is NSNumber)
                #expect(auditRoot?["ino"] as? String != nil)
                #expect(auditRoot?["lastKnownGoodMode"] is NSNumber)
                #expect(auditRoot?["backupMode"] is NSNull)
                let suspicious = auditRoot?["suspicious"] as? [String] ?? []
                #expect(suspicious.contains("gateway-mode-missing-vs-last-good"))
                #expect(suspicious.contains("update-channel-only-root"))

                let clobberedPath = auditRoot?["clobberedPath"] as? String
                #expect(clobberedPath != nil)
                if let clobberedPath {
                    let preserved = try String(contentsOfFile: clobberedPath, encoding: .utf8)
                    #expect(preserved == clobbered)
                }
            }
        }
    }

    @MainActor
    @Test
    func `save dict records preserved gateway auth in audit`() async throws {
        let stateDir = FileManager().temporaryDirectory
            .appendingPathComponent("sunclaw-state-\(UUID().uuidString)", isDirectory: true)
        let configPath = stateDir.appendingPathComponent("sunclaw.json")
        let auditPath = stateDir.appendingPathComponent("logs/config-audit.jsonl")

        defer { try? FileManager().removeItem(at: stateDir) }

        try await TestIsolation.withEnvValues([
            "SUNCLAW_STATE_DIR": stateDir.path,
            "SUNCLAW_CONFIG_PATH": configPath.path,
        ]) {
            SunClawConfigFile.saveDict([
                "gateway": [
                    "mode": "local",
                    "auth": [
                        "mode": "token",
                        "token": "test-token", // pragma: allowlist secret
                    ],
                ],
            ])

            let saved = SunClawConfigFile.saveDict([
                "gateway": [
                    "mode": "local",
                ],
                "browser": [
                    "enabled": false,
                ],
            ])

            #expect(saved)
            let data = try Data(contentsOf: configPath)
            let root = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let gateway = root?["gateway"] as? [String: Any]
            let auth = gateway?["auth"] as? [String: Any]
            #expect(gateway?["mode"] as? String == "local")
            #expect(auth?["mode"] as? String == "token")
            #expect(auth?["token"] as? String == "test-token") // pragma: allowlist secret
            #expect((root?["meta"] as? [String: Any]) != nil)

            let rawAudit = try String(contentsOf: auditPath, encoding: .utf8)
            let last = rawAudit.split(whereSeparator: \.isNewline).map(String.init).last
            let auditRoot = try JSONSerialization.jsonObject(with: Data((last ?? "{}").utf8)) as? [String: Any]
            #expect(auditRoot?["result"] as? String == "success")
            #expect(auditRoot?["preservedGatewayAuth"] as? Bool == true)
            let suspicious = auditRoot?["suspicious"] as? [String] ?? []
            #expect(suspicious.contains("gateway-auth-preserved"))
        }
    }

    @MainActor
    @Test
    func `save dict rejects gateway mode removal and keeps previous config`() async throws {
        let stateDir = FileManager().temporaryDirectory
            .appendingPathComponent("sunclaw-state-\(UUID().uuidString)", isDirectory: true)
        let configPath = stateDir.appendingPathComponent("sunclaw.json")
        let auditPath = stateDir.appendingPathComponent("logs/config-audit.jsonl")

        defer { try? FileManager().removeItem(at: stateDir) }

        try await TestIsolation.withEnvValues([
            "SUNCLAW_STATE_DIR": stateDir.path,
            "SUNCLAW_CONFIG_PATH": configPath.path,
        ]) {
            SunClawConfigFile.saveDict([
                "gateway": [
                    "mode": "local",
                    "auth": [
                        "mode": "token",
                        "token": "test-token", // pragma: allowlist secret
                    ],
                ],
                "browser": [
                    "enabled": true,
                ],
            ])
            let before = try String(contentsOf: configPath, encoding: .utf8)

            let saved = SunClawConfigFile.saveDict([
                "browser": [
                    "enabled": false,
                ],
            ])

            #expect(!saved)
            let after = try String(contentsOf: configPath, encoding: .utf8)
            #expect(after == before)

            let rawAudit = try String(contentsOf: auditPath, encoding: .utf8)
            let lines = rawAudit.split(whereSeparator: \.isNewline).map(String.init)
            guard let last = lines.last else {
                Issue.record("Missing rejected config audit line")
                return
            }
            let auditRoot = try JSONSerialization.jsonObject(with: Data(last.utf8)) as? [String: Any]
            #expect(auditRoot?["result"] as? String == "rejected")
            let suspicious = auditRoot?["suspicious"] as? [String] ?? []
            let blocking = auditRoot?["blocking"] as? [String] ?? []
            #expect(suspicious.contains("gateway-mode-removed"))
            #expect(blocking.contains("gateway-mode-removed"))
            if let rejectedPath = auditRoot?["rejectedPath"] as? String {
                #expect(FileManager().fileExists(atPath: rejectedPath))
                let attributes = try FileManager().attributesOfItem(atPath: rejectedPath)
                let mode = attributes[.posixPermissions] as? NSNumber
                #expect(mode?.intValue == 0o600)
            } else {
                Issue.record("Missing rejected payload path")
            }
        }
    }
}
