import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { executeSqliteQueryTakeFirstSync, getNodeSqliteKysely } from "../infra/kysely-sync.js";
import { requireNodeSqlite } from "../infra/node-sqlite.js";
import { readSqliteNumberPragma } from "../infra/sqlite-pragma.test-support.js";
import type { DB as SunClawAgentKyselyDatabase } from "./sunclaw-agent-db.generated.js";
import {
  closeSunClawAgentDatabasesForTest,
  listSunClawRegisteredAgentDatabases,
  openSunClawAgentDatabase,
  resolveSunClawAgentSqlitePath,
} from "./sunclaw-agent-db.js";
import {
  closeSunClawStateDatabaseForTest,
  openSunClawStateDatabase,
} from "./sunclaw-state-db.js";
import {
  collectSqliteSchemaShape,
  createSqliteSchemaShapeFromSql,
} from "./sqlite-schema-shape.test-support.js";

type AgentDbTestDatabase = Pick<SunClawAgentKyselyDatabase, "schema_meta">;

function createTempStateDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sunclaw-agent-db-"));
}

afterEach(() => {
  closeSunClawAgentDatabasesForTest();
  closeSunClawStateDatabaseForTest();
});

describe("sunclaw agent database", () => {
  it("resolves under the per-agent state directory", () => {
    const stateDir = createTempStateDir();

    expect(
      resolveSunClawAgentSqlitePath({
        agentId: "Worker-1",
        env: { SUNCLAW_STATE_DIR: stateDir },
      }),
    ).toBe(path.join(stateDir, "agents", "worker-1", "agent", "sunclaw-agent.sqlite"));
  });

  it("keeps test default state under a worker-sharded temp directory", () => {
    expect(
      resolveSunClawAgentSqlitePath({
        agentId: "main",
        env: {
          VITEST: "true",
          VITEST_WORKER_ID: "7",
        } as NodeJS.ProcessEnv,
      }),
    ).toBe(
      path.join(
        os.tmpdir(),
        "sunclaw-test-state",
        `${process.pid}-7`,
        "agents",
        "main",
        "agent",
        "sunclaw-agent.sqlite",
      ),
    );
  });

  it("creates the per-agent schema and registers it globally", () => {
    const stateDir = createTempStateDir();
    const database = openSunClawAgentDatabase({
      agentId: "worker-1",
      env: { SUNCLAW_STATE_DIR: stateDir },
    });

    expect(collectSqliteSchemaShape(database.db)).toEqual(
      createSqliteSchemaShapeFromSql(new URL("./sunclaw-agent-schema.sql", import.meta.url)),
    );
    expect(database.agentId).toBe("worker-1");
    expect(database.path).toBe(
      path.join(stateDir, "agents", "worker-1", "agent", "sunclaw-agent.sqlite"),
    );

    const registered = listSunClawRegisteredAgentDatabases({
      env: { SUNCLAW_STATE_DIR: stateDir },
    }).find((entry) => entry.agentId === "worker-1");

    expect(registered).toMatchObject({
      agentId: "worker-1",
      path: database.path,
      schemaVersion: 1,
    });
    expect(registered?.sizeBytes).toBeGreaterThan(0);
  });

  it("keeps multiple registered paths for the same agent", () => {
    const stateDir = createTempStateDir();
    const env = { SUNCLAW_STATE_DIR: stateDir };
    const relocatedPath = path.join(stateDir, "relocated", "worker-1.sqlite");
    const relocated = openSunClawAgentDatabase({
      agentId: "worker-1",
      env,
      path: relocatedPath,
    });
    const defaultDatabase = openSunClawAgentDatabase({
      agentId: "worker-1",
      env,
    });

    expect(
      listSunClawRegisteredAgentDatabases({ env })
        .filter((entry) => entry.agentId === "worker-1")
        .map((entry) => entry.path),
    ).toEqual([defaultDatabase.path, relocated.path].toSorted());
  });

  it("rejects sharing one explicit database path across agent ids", () => {
    const stateDir = createTempStateDir();
    const env = { SUNCLAW_STATE_DIR: stateDir };
    const databasePath = path.join(stateDir, "relocated", "shared.sqlite");

    openSunClawAgentDatabase({
      agentId: "worker-1",
      env,
      path: databasePath,
    });

    expect(() =>
      openSunClawAgentDatabase({
        agentId: "worker-2",
        env,
        path: databasePath,
      }),
    ).toThrow(/already open for agent worker-1/);

    closeSunClawAgentDatabasesForTest();
    expect(() =>
      openSunClawAgentDatabase({
        agentId: "worker-2",
        env,
        path: databasePath,
      }),
    ).toThrow(/belongs to agent worker-1/);
  });

  it("rejects explicit paths that point at the global state database", () => {
    const stateDir = createTempStateDir();
    const env = { SUNCLAW_STATE_DIR: stateDir };
    const databasePath = path.join(stateDir, "state", "sunclaw.sqlite");
    const stateDatabase = openSunClawStateDatabase({
      env,
      path: databasePath,
    });
    closeSunClawStateDatabaseForTest();

    expect(() =>
      openSunClawAgentDatabase({
        agentId: "worker-1",
        env,
        path: stateDatabase.path,
      }),
    ).toThrow(/schema role global/);

    const reopenedStateDatabase = openSunClawStateDatabase({
      env,
      path: databasePath,
    });
    const row = reopenedStateDatabase.db
      .prepare("SELECT role, agent_id FROM schema_meta WHERE meta_key = 'primary'")
      .get() as { agent_id?: unknown; role?: unknown } | undefined;
    expect(row).toEqual({ role: "global", agent_id: null });
  });

  it("does not chmod shared parent directories for explicit database paths", () => {
    const parentDir = createTempStateDir();
    fs.chmodSync(parentDir, 0o755);
    const databasePath = path.join(parentDir, "worker-1.sqlite");

    openSunClawAgentDatabase({
      agentId: "worker-1",
      path: databasePath,
    });

    expect(fs.statSync(parentDir).mode & 0o777).toBe(0o755);
  });

  it("configures durable SQLite connection pragmas", () => {
    const stateDir = createTempStateDir();
    const database = openSunClawAgentDatabase({
      agentId: "worker-1",
      env: { SUNCLAW_STATE_DIR: stateDir },
    });

    expect(readSqliteNumberPragma(database.db, "busy_timeout")).toBe(30_000);
    expect(readSqliteNumberPragma(database.db, "foreign_keys")).toBe(1);
    expect(readSqliteNumberPragma(database.db, "synchronous")).toBe(1);
    expect(readSqliteNumberPragma(database.db, "user_version")).toBe(1);
    expect(readSqliteNumberPragma(database.db, "wal_autocheckpoint")).toBe(1000);
    const journalMode = database.db.prepare("PRAGMA journal_mode").get() as
      | { journal_mode?: string }
      | undefined;
    expect(journalMode?.journal_mode?.toLowerCase()).toBe("wal");
  });

  it("records durable per-agent schema metadata", () => {
    const stateDir = createTempStateDir();
    const database = openSunClawAgentDatabase({
      agentId: "worker-1",
      env: { SUNCLAW_STATE_DIR: stateDir },
    });
    const agentDb = getNodeSqliteKysely<AgentDbTestDatabase>(database.db);

    expect(
      executeSqliteQueryTakeFirstSync(
        database.db,
        agentDb.selectFrom("schema_meta").select(["role", "schema_version", "agent_id"]),
      ),
    ).toEqual({
      role: "agent",
      schema_version: 1,
      agent_id: "worker-1",
    });
  });

  it("refuses to open newer per-agent schema versions", () => {
    const stateDir = createTempStateDir();
    const databasePath = path.join(
      stateDir,
      "agents",
      "worker-1",
      "agent",
      "sunclaw-agent.sqlite",
    );
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    const { DatabaseSync } = requireNodeSqlite();
    const db = new DatabaseSync(databasePath);
    db.exec("PRAGMA user_version = 2;");
    db.close();

    expect(() =>
      openSunClawAgentDatabase({
        agentId: "worker-1",
        env: { SUNCLAW_STATE_DIR: stateDir },
      }),
    ).toThrow(/newer schema version 2/);
  });
});
