// Libraries
import { container } from 'tsyringe'

// DataSources
import { SupabaseDataSource } from '../datasources/SupabaseDataSource'
import { SQLiteDataSource } from '../datasources/SQLiteDataSource'

// Interfaces
import { RouteRepository } from '@/src/core/interfaces/RouteRepository'
import { StoreRepository } from '@/src/core/interfaces/StoreRepository'

// Implementations - Supabase
import { SupbaseRouteRepository } from '@/src/infrastructure/repositories/supabase/SupabaseRouteRepository'
import { SupabaseStoreRepository } from '@/src/infrastructure/repositories/supabase/SupabaseStoreRepository'

// Implementations - SQLite
import { SQLiteStoreRepository } from '@/src/infrastructure/repositories/sql_lite/sqlLite_store_repository'

// Utils
import { TOKENS } from './tokens'

// Register DataSources as SINGLETON (one instance for entire app)
container.registerSingleton<SupabaseDataSource>(TOKENS.SupabaseDataSource, SupabaseDataSource)
container.registerSingleton<SQLiteDataSource>(TOKENS.SQLiteDataSource, SQLiteDataSource)

// Register Repositories - Generic (default: Supabase for remote operations)
container.register<RouteRepository>(TOKENS.RouteRepository, {
    useClass: SupbaseRouteRepository
})

container.register<StoreRepository>(TOKENS.StoreRepository, {
    useClass: SupabaseStoreRepository
})

// Register Repositories - Specific implementations
container.register<StoreRepository>(TOKENS.SupabaseStoreRepository, {
    useClass: SupabaseStoreRepository
})

container.register<StoreRepository>(TOKENS.SQLiteStoreRepository, {
    useClass: SQLiteStoreRepository
})



export { container }
