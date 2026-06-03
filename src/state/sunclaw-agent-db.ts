import { chmodSync, existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import {
  clearNodeSqliteKyselyCacheForDatabase,
  executeSqliteQuerySync,
  getNodeSqliteKysely,
} from "../infra/kysely-sync.js";
import { requireNodeSqlite } from "../infra/node-sqlite.js";
import { runSqliteImmediateTransactionSync } from "../infra/sqlite-transaction.js";
import { configureSqliteWalMaintenance, type SqliteWalMaintenance } from "../infra/sqlite-wal.js";
import { normalizeAgentId } from "../routing/session-key.js";
import type { DB as SunClawAgentKyselyDatabase } from "./sunclaw-agent-db.generated.js";
import { resolveSunClawAgentSqlitePath } from "./sunclaw-agent-db.paths.js";
import { SUNCLAW_AGENT_SCHEMA_SQL } from "./sunclaw-agent-schema.generated.js";
import type { DB as SunClawStateKyselyDatabase } from "./sunclaw-state-db.generated.js";
import {
  SUNCLAW_SQLITE_BUSY_TIMEOUT_MS,
  openSunClawStateDatabase,
  runSunClawStateWriteTransaction,
  type SunClawStateDatabaseOptions,
} from "./sunclaw-state-db.js";
export { resolveSunClawAgentSqlitePath } from "./sunclaw-agent-db.paths.js";

const SUNCLAW_AGENT_SCHEMA_VERSION = 1;
const SUNCLAW_AGENT_DB_DIR_MODE = 0o700;
const SUNCLAW_AGENT_DB_FILE_MODE = 0o600;
const SUNCLAW_AGENT_DB_SIDECAR_SUFFIXES = ["", "-shm", "-wal"] as const;

export type SunClawAgentDatabase = {
  agentId: string;
  db: DatabaseSync;
  path: string;
  walMaintenance: SqliteWalMaintenance;
};

export type SunClawAgentDatabaseOptions = SunClawStateDatabaseOptions & {
  agentId: string;
};

export type SunClawRegisteredAgentDatabase = {
  agentId: string;
  path: string;
  schemaVersion: number;
  lastSeenAt: number;
  sizeBytes: number | null;
};

type SunClawAgentMetadataDatabase = Pick<SunClawAgentKyselyDatabase, "schema_meta">;
type SunClawAgentRegistryDatabase = Pick<SunClawStateKyselyDatabase, "agent_databases">;

const cachedDatabases = new Map<string, SunClawAgentDatabase>();

type ExistingSchemaMeta = {
  agentId: string | null;
  role: string | null;
};

function readSqliteUserVersion(db: DatabaseSync): number {
  const row = db.prepare("PRAGMA user_version").get() as { user_version?: unknown } | undefined;
  return Number(row?.user_version ?? 0);
}

function assertSupportedAgentSchemaVersion(db: DatabaseSync, pathname: string): void {
  const userVersion = readSqliteUserVersion(db);
  if (userVersion > SUNCLAW_AGENT_SCHEMA_VERSION) {
    throw new Error(
      `SunClaw agent database ${pathname} uses newer schema version ${userVersion}; this SunClaw build supports ${SUNCLAW_AGENT_SCHEMA_VERSION}.`,
    );
  }
}

function ensureSunClawAgentDatabasePermissions(
  pathname: string,
  options: SunClawAgentDatabaseOptions,
): void {
  const dir = path.dirname(pathname);
  const defaultPath = resolveSunClawAgentSqlitePath({
    agentId: options.agentId,
    env: options.env,
  });
  const isDefaultAgentDatabase = path.resolve(pathname) === path.resolve(defaultPath);
  const dirExisted = existsSync(dir);
  mkdirSync(dir, { recursive: true, mode: SUNCLAW_AGENT_DB_DIR_MODE });
  if (isDefaultAgentDatabase || !dirExisted) {
    chmodSync(dir, SUNCLAW_AGENT_DB_DIR_MODE);
  }
  for (const suffix of SUNCLAW_AGENT_DB_SIDECAR_SUFFIXES) {
    const candidate = `${pathname}${suffix}`;
    if (existsSync(candidate)) {
      chmodSync(candidate, SUNCLAW_AGENT_DB_FILE_MODE);
    }
  }
}

function readExistingSchemaMeta(db: DatabaseSync): ExistingSchemaMeta | null {
  const schemaMetaTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_meta'")
    .get();
  if (!schemaMetaTable) {
    return null;
  }
  const row = db
    .prepare("SELECT role, agent_id FROM schema_meta WHERE meta_key = 'primary'")
    .get() as { agent_id?: unknown; role?: unknown } | undefined;
  if (!row) {
    return null;
  }
  return {
    agentId: typeof row.agent_id === "string" ? row.agent_id : null,
    role: typeof row.role === "string" ? row.role : null,
  };
}

function assertExistingSchemaOwner(
  existing: ExistingSchemaMeta | null,
  agentId: string,
  pathname: string,
): void {
  if (!existing) {
    return;
  }
  if (existing.role !== "agent") {
    throw new Error(
      `SunClaw agent database ${pathname} has schema role ${existing.role ?? "unknown"}; expected agent.`,
    );
  }
  if (!existing.agentId) {
    throw new Error(`SunClaw agent database ${pathname} has no agent owner.`);
  }
  if (normalizeAgentId(existing.agentId) !== agentId) {
    throw new Error(
      `SunClaw agent database ${pathname} belongs to agent ${existing.agentId}; requested agent ${agentId}.`,
    );
  }
}

function ensureAgentSchema(db: DatabaseSync, agentId: string, pathname: string): void {
  assertSupportedAgentSchemaVersion(db, pathname);
  assertExistingSchemaOwner(readExistingSchemaMeta(db), agentId, pathname);
  db.exec(SUNCLAW_AGENT_SCHEMA_SQL);
  const kysely = getNodeSqliteKysely<SunClawAgentMetadataDatabase>(db);
  db.exec(`PRAGMA user_version = ${SUNCLAW_AGENT_SCHEMA_VERSION};`);
  const now = Date.now();
  executeSqliteQuerySync(
    db,
    kysely
      .insertInto("schema_meta")
      .values({
        meta_key: "primary",
        role: "agent",
        schema_version: SUNCLAW_AGENT_SCHEMA_VERSION,
        agent_id: agentId,
        app_version: null,
        created_at: now,
        updated_at: now,
      })
      .onConflict((conflict) =>
        conflict.column("meta_key").doUpdateSet({
          role: "agent",
          schema_version: SUNCLAW_AGENT_SCHEMA_VERSION,
          agent_id: agentId,
          app_version: null,
          updated_at: now,
        }),
      ),
  );
}

function registerAgentDatabase(params: {
  agentId: string;
  path: string;
  env?: NodeJS.ProcessEnv;
}): void {
  let sizeBytes: number | null = null;
  try {
    sizeBytes = statSync(params.path).size;
  } catch {
    sizeBytes = null;
  }
  const lastSeenAt = Date.now();
  runSunClawStateWriteTransaction(
    (database) => {
      const db = getNodeSqliteKysely<SunClawAgentRegistryDatabase>(database.db);
      executeSqliteQuerySync(
        database.db,
        db
          .insertInto("agent_databases")
          .values({
            agent_id: params.agentId,
            path: params.path,
            schema_version: SUNCLAW_AGENT_SCHEMA_VERSION,
            last_seen_at: lastSeenAt,
            size_bytes: sizeBytes,
          })
          .onConflict((conflict) =>
            conflict.columns(["agent_id", "path"]).doUpdateSet({
              schema_version: SUNCLAW_AGENT_SCHEMA_VERSION,
              last_seen_at: lastSeenAt,
              size_bytes: sizeBytes,
            }),
          ),
      );
    },
    { env: params.env },
  );
}

export function listSunClawRegisteredAgentDatabases(
  options: SunClawStateDatabaseOptions = {},
): SunClawRegisteredAgentDatabase[] {
  const database = openSunClawStateDatabase(options);
  const db = getNodeSqliteKysely<SunClawAgentRegistryDatabase>(database.db);
  const rows = executeSqliteQuerySync(
    database.db,
    db.selectFrom("agent_databases").selectAll().orderBy("agent_id", "asc").orderBy("path", "asc"),
  ).rows;
  return rows.map((row) => ({
    agentId: normalizeAgentId(row.agent_id),
    path: row.path,
    schemaVersion: row.schema_version,
    lastSeenAt: row.last_seen_at,
    sizeBytes: row.size_bytes,
  }));
}

export function openSunClawAgentDatabase(
  options: SunClawAgentDatabaseOptions,
): SunClawAgentDatabase {
  const agentId = normalizeAgentId(options.agentId);
  const databaseOptions = { ...options, agentId };
  const pathname = resolveSunClawAgentSqlitePath(databaseOptions);
  const cached = cachedDatabases.get(pathname);
  if (cached?.db.isOpen) {
    if (cached.agentId !== agentId) {
      throw new Error(
        `SunClaw agent database ${pathname} is already open for agent ${cached.agentId}; requested agent ${agentId}.`,
      );
    }
    registerAgentDatabase({ agentId, path: pathname, env: options.env });
    return cached;
  }
  if (cached) {
    cached.walMaintenance.close();
    clearNodeSqliteKyselyCacheForDatabase(cached.db);
    cachedDatabases.delete(pathname);
  }

  ensureSunClawAgentDatabasePermissions(pathname, databaseOptions);
  const sqlite = requireNodeSqlite();
  const db = new sqlite.DatabaseSync(pathname);
  const walMaintenance = configureSqliteWalMaintenance(db, {
    databaseLabel: `sunclaw-agent:${agentId}`,
    databasePath: pathname,
  });
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec(`PRAGMA busy_timeout = ${SUNCLAW_SQLITE_BUSY_TIMEOUT_MS};`);
  db.exec("PRAGMA foreign_keys = ON;");
  try {
    ensureAgentSchema(db, agentId, pathname);
  } catch (err) {
    walMaintenance.close();
    db.close();
    throw err;
  }
  ensureSunClawAgentDatabasePermissions(pathname, databaseOptions);
  const database = { agentId, db, path: pathname, walMaintenance };
  cachedDatabases.set(pathname, database);
  registerAgentDatabase({ agentId, path: pathname, env: options.env });
  return database;
}

export function runSunClawAgentWriteTransaction<T>(
  operation: (database: SunClawAgentDatabase) => T,
  options: SunClawAgentDatabaseOptions,
): T {
  const database = openSunClawAgentDatabase(options);
  const result = runSqliteImmediateTransactionSync(database.db, () => operation(database));
  ensureSunClawAgentDatabasePermissions(database.path, options);
  return result;
}

export function closeSunClawAgentDatabasesForTest(): void {
  for (const database of cachedDatabases.values()) {
    database.walMaintenance.close();
    clearNodeSqliteKyselyCacheForDatabase(database.db);
    database.db.close();
  }
  cachedDatabases.clear();
}
