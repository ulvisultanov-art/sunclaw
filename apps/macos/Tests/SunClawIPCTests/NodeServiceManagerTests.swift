import Foundation
import Testing
@testable import SunClaw

@Suite(.serialized) struct NodeServiceManagerTests {
    @Test func `builds node service commands with current CLI shape`() async throws {
        try await TestIsolation.withUserDefaultsValues(["sunclaw.gatewayProjectRootPath": nil]) {
            let tmp = try makeTempDirForTests()
            CommandResolver.setProjectRoot(tmp.path)

            let sunclawPath = tmp.appendingPathComponent("node_modules/.bin/sunclaw")
            try makeExecutableForTests(at: sunclawPath)

            let start = NodeServiceManager._testServiceCommand(["start"])
            #expect(start == [sunclawPath.path, "node", "start", "--json"])

            let stop = NodeServiceManager._testServiceCommand(["stop"])
            #expect(stop == [sunclawPath.path, "node", "stop", "--json"])
        }
    }
}
