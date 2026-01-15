
export abstract class LocalDatabaseService {
    abstract createDatabase(): Promise<void>;
    abstract dropDatabase(): Promise<void>;
    abstract cleanDatabase(): Promise<void>;
}