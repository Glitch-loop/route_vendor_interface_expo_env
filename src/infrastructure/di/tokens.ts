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
    // Supabase
    SupabaseDayOperationRepository: Symbol('SupabaseDayOperationRepository'),
    SupabaseInventoryOperationRepository: Symbol('SupabaseInventoryOperationRepository'),
    SupabaseInventoryRepository: Symbol('SupabaseInventoryRepository'),
    SupabaseRouteRepository: Symbol('SupabaseRouteRepository'),
    SupabaseRouteTransactionRepository: Symbol('SupabaseRouteTransactionRepository'),
    SupabaseShiftOrganizationRepository: Symbol('SupabaseShiftOrganizationRepository'),
    SupabaseStoreRepository: Symbol('SupabaseStoreRepository'),
    
    // SQLite
    SQLiteDayOperationRepository: Symbol('SQLiteDayOperationRepository'),
    SQLiteInventoryOperationRepository: Symbol('SQLiteInventoryOperationRepository'),
    SQLiteProductInventoryRepository: Symbol('SQLiteProductInventoryRepository'),
    SQLiteProductRepository: Symbol('SQLiteProductRepository'),
    SQLiteRouteRepository: Symbol('SQLiteRouteRepository'),
    SQLiteRouteTransactionRepository: Symbol('SQLiteRouteTransactionRepository'),
    SQLiteShiftOrganizationRepository: Symbol('SQLiteShiftOrganizationRepository'),
    SQLiteStoreRepository: Symbol('SQLiteStoreRepository'),
    
    // Services
    IDService: Symbol('IDService'),
    DateService: Symbol('DateService'),
    SQLiteDatabaseService: Symbol('SQLiteDatabaseService'),
    LocalDatabaseService: Symbol('LocalDatabaseService'),
}