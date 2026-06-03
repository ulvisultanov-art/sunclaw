import Testing
@testable import SunClaw

@Suite(.serialized) struct SunClawAppDelegateTests {
    @Test @MainActor func resolvesRegistryModelBeforeViewTaskAssignsDelegateModel() {
        let registryModel = NodeAppModel()
        SunClawAppModelRegistry.appModel = registryModel
        defer { SunClawAppModelRegistry.appModel = nil }

        let delegate = SunClawAppDelegate()

        #expect(delegate._test_resolvedAppModel() === registryModel)
    }

    @Test @MainActor func prefersExplicitDelegateModelOverRegistryFallback() {
        let registryModel = NodeAppModel()
        let explicitModel = NodeAppModel()
        SunClawAppModelRegistry.appModel = registryModel
        defer { SunClawAppModelRegistry.appModel = nil }

        let delegate = SunClawAppDelegate()
        delegate.appModel = explicitModel

        #expect(delegate._test_resolvedAppModel() === explicitModel)
    }
}
