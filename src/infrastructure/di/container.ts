// Libraries
import { container } from 'tsyringe'

// DataSources
import { SupabaseDataSource } from '../datasources/SupabaseDataSource'

// Interfaces
import { RouteRepository } from '@/src/core/interfaces/RouteRepository'
import { StoreRepository } from '@/src/core/interfaces/StoreRepository'

// Implementations
import { SupbaseRouteRepository } from '@/src/infrastructure/repositories/supabase/SupabaseRouteRepository'
import { SupabaseStoreRepository } from '@/src/infrastructure/repositories/supabase/SupabaseStoreRepository'

// Utils
import { TOKENS } from './tokens'

// Register DataSource as SINGLETON (one instance for entire app)
container.registerSingleton<SupabaseDataSource>(TOKENS.SupabaseDataSource, SupabaseDataSource)

// Register Repositories
container.register<RouteRepository>(TOKENS.RouteRepository, {
    useClass: SupbaseRouteRepository
})

container.register<StoreRepository>(TOKENS.StoreRepository, {
    useClass: SupabaseStoreRepository
})



export { container }