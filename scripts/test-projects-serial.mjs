process.env.SUNCLAW_TEST_PROJECTS_SERIAL = "1";
process.env.SUNCLAW_VITEST_MAX_WORKERS = "1";

await import("./test-projects.mjs");
