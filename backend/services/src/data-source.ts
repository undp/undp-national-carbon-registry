import "reflect-metadata";
import { config as loadEnv } from "dotenv-flow";
import { DataSource } from "typeorm";

// The TypeORM CLI runs outside the NestJS DI container, so it needs its own
// DataSource. We load the same .env files the app uses (.env, .env.${NODE_ENV})
// via dotenv-flow so connection details have a single source of truth.
loadEnv({ default_node_env: "dev" });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "carbondev",

  // The CLI must never auto-sync; schema changes go through migrations only.
  synchronize: false,
  logging: ["error", "schema"],


  // tables from the generated baseline. See docs/migrations-plan.md.
  entities: ["libs/shared/src/entities/*.ts"],
  migrations: ["src/migrations/*.ts"],

  // Bookkeeping table TypeORM uses to track which migrations have run.
  migrationsTableName: "migrations",
});
