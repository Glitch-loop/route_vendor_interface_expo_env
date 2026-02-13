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
    SupabaseProductRepository: Symbol('SupabaseProductRepository'),
    
    // SQLite
    SQLiteDayOperationRepository: Symbol('SQLiteDayOperationRepository'),
    SQLiteInventoryOperationRepository: Symbol('SQLiteInventoryOperationRepository'),
    SQLiteProductInventoryRepository: Symbol('SQLiteProductInventoryRepository'),
    SQLiteProductRepository: Symbol('SQLiteProductRepository'),
    // SQLiteRouteRepository: Symbol('SQLiteRouteRepository'), // Not needed
    SQLiteRouteTransactionRepository: Symbol('SQLiteRouteTransactionRepository'),
    SQLiteShiftOrganizationRepository: Symbol('SQLiteShiftOrganizationRepository'),
    SQLiteStoreRepository: Symbol('SQLiteStoreRepository'),
    //Sync Repositories
    SyncInventoryOperationRepository: Symbol('SyncInventoryOperationRepository'),
    SyncRouteTransactionRepository: Symbol('SyncRouteTransactionRepository'),
    SyncStoreRepository: Symbol('SyncStoreRepository'),
    SyncWorkdayInformationRepository: Symbol('SyncWorkdayInformationRepository'),

    // Sync Server Repositories
    SyncServerStoreRepository: Symbol('SyncServerStoreRepository'),
    SyncServerRouteTransactionRepository: Symbol('SyncServerRouteTransactionRepository'),
    SyncServerInventoryOperationRepository: Symbol('SyncServerInventoryOperationRepository'),
    SyncServerWorkdayInformationRepository: Symbol('SyncServerWorkdayInformationRepository'),


    // Services
    IDService: Symbol('IDService'),
    DateService: Symbol('DateService'),
    SQLiteDatabaseService: Symbol('SQLiteDatabaseService'),
    LocalDatabaseService: Symbol('LocalDatabaseService'),
    PlataformService: Symbol('PlataformService'),
    PrinterService: Symbol('PrinterService'),
    LocationService: Symbol('LocationService'),
    DataReplicationService: Symbol('DataReplicationService'),
}