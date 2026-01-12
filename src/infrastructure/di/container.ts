// Libraries
import { container } from 'tsyringe'

// DataSources
import { SupabaseDataSource } from '../datasources/SupabaseDataSource'

// Interfaces
import { RouteRepository } from '@/src/core/interfaces/RouteRepository'

// Implementations
import { SupbaseRouteRepository } from '@/src/infrastructure/repositories/supabase/SupabaseRouteRepository'

// Utils
import { TOKENS } from './tokens'

// Register DataSource as SINGLETON (one instance for entire app)
container.registerSingleton<SupabaseDataSource>(TOKENS.SupabaseDataSource, SupabaseDataSource)

// Register Repositories
container.register<RouteRepository>(TOKENS.RouteRepository, {
    useClass: SupbaseRouteRepository
})


export { container }