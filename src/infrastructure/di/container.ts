import 'reflect-metadata';

// Libraries
import { container, DependencyContainer, instanceCachingFactory } from 'tsyringe'



// DataSources
import { SupabaseDataSource } from '../datasources/SupabaseDataSource'
import { SQLiteDataSource } from '../datasources/SQLiteDataSource'

// Interfaces
import { ShiftOrganizationRepository } from "@/src/core/interfaces/ShiftOrganizationRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository'
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository'
import { IDService } from '@/src/core/interfaces/IDService'
import { DateService as IDateService } from '@/src/core/interfaces/DateService'


// Interfaces
import { RouteRepository } from '@/src/core/interfaces/RouteRepository'
import { StoreRepository } from '@/src/core/interfaces/StoreRepository'

// Implementations - Supabase
import { SupabaseRouteRepository } from '@/src/infrastructure/repositories/supabase/SupabaseRouteRepository'
import { SupabaseStoreRepository } from '@/src/infrastructure/repositories/supabase/SupabaseStoreRepository'

// Implementations - SQLite
import { SQLiteStoreRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteStoreRepository'
import { SQLiteShiftOrganizationRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteShiftOrganizationRepository'
import { SQLiteInventoryOperationRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteInventoryOperationRepository'
import { SQLiteInventoryRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteInventoryRepository'
import { SQLiteRouteTransactionRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteRouteTransaction'

// Services
import { UUIDv4Service } from '@/src/infrastructure/services/UUIDv4Service'
import { DateService } from '@/src/infrastructure/services/DateService'
import { SQLiteDatabaseService } from '@/src/infrastructure/services/SQLiteDatabaseService';


// Utils
import { TOKENS } from './tokens'
import { LocalDatabaseService } from '@/src/core/interfaces/LocalDatabaseService';

const SQLiteDataSourceFactory =  (c: DependencyContainer) => {
    console.log('Creating SQLiteDataSource instance with factory*****************************')
    const client = new SQLiteDataSource()
    // await client.initialize()
    return client
}

// Register DataSources as SINGLETON (one instance for entire app)
// container.registerSingleton<SQLiteDataSource>(TOKENS.SQLiteDataSource, {
//     useFactory: SQLiteDataSourceFactory,
// })


container.register(SQLiteDataSource, {
  useFactory: instanceCachingFactory(async () => {
    const client = new SQLiteDataSource()
    await client.initialize()
    // const client = await SQLite.openDatabaseAsync('mydb.db');
    return client;
  })
});

container.registerSingleton<SupabaseDataSource>(TOKENS.SupabaseDataSource, SupabaseDataSource)



// Services
container.registerSingleton<IDService>(TOKENS.IDService, UUIDv4Service)
container.registerSingleton<IDateService>(TOKENS.DateService, DateService)

console.log('Registering Services...');

// Register LocalDatabaseService using factory to manually inject dependencies
// container.registerSingleton<LocalDatabaseService>(TOKENS.LocalDatabaseService, {
//     useFactory: (c) => new SQLiteDatabaseService(c.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource))
// })

// Also register under its concrete type

const SQLiteFactory = (c: DependencyContainer) => {
    console.log('Creating an instance with factory*****************************')
    return new SQLiteDatabaseService(c.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource))
}

container.register<SQLiteDatabaseService>(TOKENS.SQLiteDatabaseService, {
    useFactory: SQLiteFactory
})



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

container.register<ShiftOrganizationRepository>(TOKENS.SQLiteShiftOrganizationRepository, {
    useClass: SQLiteShiftOrganizationRepository
})

container.register<InventoryOperationRepository>(TOKENS.SQLiteInventoryOperationRepository, {
    useClass: SQLiteInventoryOperationRepository
})

container.register<ProductInventoryRepository>(TOKENS.SQLiteInventoryRepository, {
    useClass: SQLiteInventoryRepository
})

container.register<RouteTransactionRepository>(TOKENS.SQLiteRouteTransactionRepository, {
    useClass: SQLiteRouteTransactionRepository
})


// Supabase
container.register<StoreRepository>(TOKENS.SupabaseStoreRepository, {
    useClass: SupabaseStoreRepository
})


export { container }
