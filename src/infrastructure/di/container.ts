// Libraries
import { container } from 'tsyringe'

// DataSources
import { SupabaseDataSource } from '../datasources/SupabaseDataSource'
import { SQLiteDataSource } from '../datasources/SQLiteDataSource'
import { InventoryOperation } from "@/src/core/entities/InventoryOperation";
import { ShiftOrganizationRepository } from "@/src/core/interfaces/ShiftOrganizationRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";


// Interfaces
import { RouteRepository } from '@/src/core/interfaces/RouteRepository'
import { StoreRepository } from '@/src/core/interfaces/StoreRepository'

// Implementations - Supabase
import { SupabaseRouteRepository } from '@/src/infrastructure/repositories/supabase/SupabaseRouteRepository'
import { SupabaseStoreRepository } from '@/src/infrastructure/repositories/supabase/SupabaseStoreRepository'

// Implementations - SQLite
import { SQLiteStoreRepository } from '@/src/infrastructure/repositories/sql_lite/SQLiteStoreRepository'



// Utils
import { TOKENS } from './tokens'

// Register DataSources as SINGLETON (one instance for entire app)
container.registerSingleton<SupabaseDataSource>(TOKENS.SupabaseDataSource, SupabaseDataSource)
container.registerSingleton<SQLiteDataSource>(TOKENS.SQLiteDataSource, SQLiteDataSource)

// Register Repositories - Generic (default: Supabase for remote operations)
container.register<RouteRepository>(TOKENS.RouteRepository, {
    useClass: SupabaseRouteRepository
})

container.register<StoreRepository>(TOKENS.StoreRepository, {
    useClass: SupabaseStoreRepository
})

// Register Repositories - Specific implementations
// SQLite
container.register<StoreRepository>(TOKENS.SQLiteStoreRepository, {
    useClass: SQLiteStoreRepository
})


// Supabase
container.register<StoreRepository>(TOKENS.SupabaseStoreRepository, {
    useClass: SupabaseStoreRepository
})






export { container }
