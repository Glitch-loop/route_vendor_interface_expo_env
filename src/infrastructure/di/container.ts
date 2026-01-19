import 'reflect-metadata';

// Libraries
import { container, DependencyContainer, instanceCachingFactory, Lifecycle } from 'tsyringe'

// DataSources
import { SupabaseDataSource } from '../datasources/SupabaseDataSource'
import { SQLiteDataSource } from '../datasources/SQLiteDataSource'

// Interfaces
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository'
import { ProductRepository } from '@/src/core/interfaces/ProductRepository';
import { ShiftOrganizationRepository } from "@/src/core/interfaces/ShiftOrganizationRepository";
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
import { SQLiteDayOperationRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteDayOperationRepository';
import { SQLiteInventoryOperationRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteInventoryOperationRepository'
import { SQLiteProductInventoryRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteProductInventoryRepository';
import { SQLiteProductRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteProductRepository';
import { SQLiteStoreRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteStoreRepository'
import { SQLiteShiftOrganizationRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteShiftOrganizationRepository'
import { SQLiteRouteTransactionRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteRouteTransaction'

// Services
import { UUIDv4Service } from '@/src/infrastructure/services/UUIDv4Service'
import { DateService } from '@/src/infrastructure/services/DateService'
import { SQLiteDatabaseService } from '@/src/infrastructure/services/SQLiteDatabaseService';


// Utils
import { TOKENS } from './tokens'
import { LocalDatabaseService } from '@/src/core/interfaces/LocalDatabaseService';


// Register DataSources as SINGLETON (one instance for entire app)
container.registerSingleton<SupabaseDataSource>(TOKENS.SupabaseDataSource, SupabaseDataSource);

container.register<SQLiteDataSource>(TOKENS.SQLiteDataSource, 
    { useClass: SQLiteDataSource },
    { lifecycle: Lifecycle.Singleton }
)

// Services
container.register<LocalDatabaseService>(TOKENS.SQLiteDatabaseService, {
    useClass: SQLiteDatabaseService
})
// container.registerSingleton<IDService>(TOKENS.IDService, UUIDv4Service);
// container.registerSingleton<IDateService>(TOKENS.DateService, DateService);


// Implementation of repositories - SQLite
container.register<DayOperationRepository>(TOKENS.SQLiteDayOperationRepository, {
    useClass: SQLiteDayOperationRepository
})

container.register<InventoryOperationRepository>(TOKENS.SQLiteInventoryOperationRepository, {
    useClass: SQLiteInventoryOperationRepository
});

container.register<ProductInventoryRepository>(TOKENS.SQLiteProductInventoryRepository, {
    useClass: SQLiteProductInventoryRepository
});

container.register<ProductRepository>(TOKENS.SQLiteProductRepository, {
    useClass: SQLiteProductRepository
});

// RouteRepository: There is not need to register it because there is not implementation needed.

container.register<RouteTransactionRepository>(TOKENS.SQLiteRouteTransactionRepository, {
    useClass: SQLiteRouteTransactionRepository
});

container.register<ShiftOrganizationRepository>(TOKENS.SQLiteShiftOrganizationRepository, {
    useClass: SQLiteShiftOrganizationRepository
});

container.register<StoreRepository>(TOKENS.SQLiteStoreRepository, {
    useClass: SQLiteStoreRepository
});



// TODO
// container.register<RouteRepository>(TOKENS.SQLiteRouteRepository, {
//     useClass: SQLiteRouteTransactionRepository
// })



// Also register under its concrete type
// const SQLiteFactory = (c: DependencyContainer) => {
//     console.log('Creating an instance with factory*****************************')
//     return new SQLiteDatabaseService(c.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource))
// }

// container.register<LocalDatabaseService>(TOKENS.SQLiteDatabaseService, {
//     useFactory: SQLiteFactory
// })

// // Register Repositories - Generic (default: Supabase for remote operations)
// container.register<RouteRepository>(TOKENS.RouteRepository, {
//     useClass: SupabaseRouteRepository
// })

// container.register<StoreRepository>(TOKENS.StoreRepository, {
//     useClass: SupabaseStoreRepository
// })

// // Register Repositories - Specific implementations
// // SQLite


// container.register<ShiftOrganizationRepository>(TOKENS.SQLiteShiftOrganizationRepository, {
//     useClass: SQLiteShiftOrganizationRepository
// })

// container.register<InventoryOperationRepository>(TOKENS.SQLiteInventoryOperationRepository, {
//     useClass: SQLiteInventoryOperationRepository
// })

// container.register<ProductInventoryRepository>(TOKENS.SQLiteInventoryRepository, {
//     useClass: SQLiteInventoryRepository
// })

// container.register<RouteTransactionRepository>(TOKENS.SQLiteRouteTransactionRepository, {
//     useClass: SQLiteRouteTransactionRepository
// })


// Supabase
// container.register<StoreRepository>(TOKENS.SupabaseStoreRepository, {
//     useClass: SupabaseStoreRepository
// })


export { container }
