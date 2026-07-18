import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";

export abstract class LocalDatabaseService {
    abstract createDatabase(): Promise<void>;
    abstract dropDatabase(): Promise<void>;
    abstract cleanDatabase(excludeTable?: EMBEDDED_TABLES[]): Promise<void>;
}