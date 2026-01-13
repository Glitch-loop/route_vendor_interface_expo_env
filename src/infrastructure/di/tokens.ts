/**
 * DI Tokens for dependency injection
 * Use these when injecting interfaces in constructors
 */
export const TOKENS = {
    // DataSources
    SupabaseDataSource: Symbol('SupabaseDataSource'),
    SQLiteDataSource: Symbol('SQLiteDataSource'),

    // Repositories - Generic (default implementations)
    RouteRepository: Symbol('RouteRepository'),
    StoreRepository: Symbol('StoreRepository'),

    // Repositories - Specific implementations
    SupabaseStoreRepository: Symbol('SupabaseStoreRepository'),
    SQLiteStoreRepository: Symbol('SQLiteStoreRepository'),

    // Services
}