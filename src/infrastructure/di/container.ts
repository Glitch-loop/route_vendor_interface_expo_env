import 'reflect-metadata';

// Libraries
import { container, Lifecycle } from 'tsyringe'

// DataSources
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource'
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource'
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Interfaces
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository'
import { ProductRepository } from '@/src/core/interfaces/ProductRepository';
import { ShiftOrganizationRepository } from "@/src/core/interfaces/ShiftOrganizationRepository";
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository'
import { IDService } from '@/src/core/interfaces/IDService'
import { DateService as IDateService } from '@/src/core/interfaces/DateService'
import { LocationService } from '@/src/core/interfaces/LocationService'
import { LocalUserRepository } from '@/src/core/interfaces/LocalUserRepository';
import { ServerUserRepository } from '@/src/core/interfaces/ServerUserRepository';

// Sync interfaces
import { SyncStoreRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncStoreRepository';
import { SyncWorkdayInformationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncWorkdayInformationRepository';
import { SyncRouteTransactionRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncRouteTransactionRepository';
import { SyncInventoryOperationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncInventoryOperationRepository';
import { SyncDayOperationInformationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncDayOperationRepository';
import { SyncServerDayOperationRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerDayOperationRepository';


// Interfaces
import { RouteRepository } from '@/src/core/interfaces/RouteRepository'
import { StoreRepository } from '@/src/core/interfaces/StoreRepository'

// Implementations - Supabase
import { SupabaseRouteRepository } from '@/src/infrastructure/repositories/supabase/SupabaseRouteRepository'
import { SupabaseStoreRepository } from '@/src/infrastructure/repositories/supabase/SupabaseStoreRepository'
import { SupabaseProductRepository } from '@/src/infrastructure/repositories/supabase/SupabaseProductRepository'
import { SupabaseRouteTransactionRepository } from '@/src/infrastructure/repositories/supabase/SupabaseRouteTransactionRepository'
import { SupabaseInventoryOperationRepository } from '@/src/infrastructure/repositories/supabase/SupabaseInventoryOperationRepository'
import { SupabaseWorkdayInformationRepository } from '@/src/infrastructure/repositories/supabase/SupabaseWorkdayInformationRepository'
import { SupabaseServerUserRepository } from '@/src/infrastructure/repositories/supabase/SupabaseServerUserRepository'

// Implementations - SQLite
import { SQLiteDayOperationRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteDayOperationRepository';
import { SQLiteInventoryOperationRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteInventoryOperationRepository'
import { SQLiteProductInventoryRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteProductInventoryRepository';
import { SQLiteProductRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteProductRepository';
import { SQLiteStoreRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteStoreRepository'
import { SQLiteShiftOrganizationRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteShiftOrganizationRepository'
import { SQLiteRouteTransactionRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteRouteTransactionRepository'
import { SQLiteUserRepository } from '@/src/infrastructure/repositories/SQLite/SQLiteUserRepository'


// Implementations - Backend
import { BackendUserRepository } from '@/src/infrastructure/repositories/backend-server/BackendUserRepository';
import { BackendWorkdayInformationRepository } from '@/src/infrastructure/repositories/backend-server/BackendWorkdayInformationRepository';

// Services
import { UUIDv4Service } from '@/src/infrastructure/services/UUIDv4Service'
import { DateService } from '@/src/infrastructure/services/DateService'
import { SQLiteDatabaseService } from '@/src/infrastructure/services/SQLiteDatabaseService';
import { AndroidPlatformPermissions } from '@/src/infrastructure/services/AndroidPlataformPermissions';
import { GpsService } from '@/src/infrastructure/services/GPSService';
import DataReplicationService from '@/src/infrastructure/services/DataReplicationService';


// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens'
import { LocalDatabaseService } from '@/src/core/interfaces/LocalDatabaseService';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';
import { MapperLocalServerModel } from '@/src/infrastructure/mappers/MapperLocalServerModel';
import { PlatformPermissionsService } from '@/src/core/interfaces/PlatformPermissions';
import { BackendRouteRepository } from '../repositories/backend-server/BackendRouteRepository';
import { BackendProductRepository } from '../repositories/backend-server/BackendProductRepository';
import { BackendStoreRepository } from '../repositories/backend-server/BackendStoreRepository';
import { BackendDayOperationRepository } from '../repositories/backend-server/BackendDayOperationRepository';
import { BackendRouteTransactionRepository } from '../repositories/backend-server/BackendRouteTransactionRepository';
import { BackendInventoryOperationRepository } from '../repositories/backend-server/BackendInventoryOperationRepository';



// Register DataSources as SINGLETON (one instance for entire app)
container.registerSingleton<SupabaseDataSource>(TOKENS.SupabaseDataSource, SupabaseDataSource);

container.registerSingleton<BackendDataSource>(TOKENS.BackendDataSource, BackendDataSource)

container.register<SQLiteDataSource>(TOKENS.SQLiteDataSource, 
    { useClass: SQLiteDataSource },
    { lifecycle: Lifecycle.Singleton }
);

// =================== DTOs ====================
container.registerSingleton<MapperDTO>(MapperDTO, MapperDTO);
container.registerSingleton<MapperLocalServerModel>(MapperLocalServerModel, MapperLocalServerModel);

// =================== Services ====================
container.registerSingleton<IDService>(TOKENS.IDService, UUIDv4Service);

container.registerSingleton<IDateService>(TOKENS.DateService, DateService);

container.registerSingleton<LocationService>(TOKENS.LocationService, GpsService);

container.register<LocalDatabaseService>(TOKENS.LocalDatabaseService, {
    useClass: SQLiteDatabaseService
});

container.register<PlatformPermissionsService>(TOKENS.PlataformService, {
    useClass: AndroidPlatformPermissions
});

container.register(TOKENS.DataReplicationService, {
    useClass: DataReplicationService
});


// =================== Implementation of repositories - SQLite ====================
container.register<DayOperationRepository>(TOKENS.SQLiteDayOperationRepository, {
    useClass: SQLiteDayOperationRepository
});

container.register<InventoryOperationRepository>(TOKENS.SQLiteInventoryOperationRepository, {
    useClass: SQLiteInventoryOperationRepository
});

container.register<ProductInventoryRepository>(TOKENS.SQLiteProductInventoryRepository, {
    useClass: SQLiteProductInventoryRepository
});

container.register<ProductRepository>(TOKENS.SQLiteProductRepository, {
    useClass: SQLiteProductRepository
});

container.register<LocalUserRepository>(TOKENS.LocalAuthenticationRepository, {
    useClass: SQLiteUserRepository
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


// =================== Implementation of repositories - Sync ====================
container.register<SyncStoreRepository>(TOKENS.SyncStoreRepository, {
    useClass: SQLiteStoreRepository
});

container.register<SyncWorkdayInformationRepository>(TOKENS.SyncWorkdayInformationRepository, {
    useClass: SQLiteShiftOrganizationRepository
});

container.register<SyncRouteTransactionRepository>(TOKENS.SyncRouteTransactionRepository, {
    useClass: SQLiteRouteTransactionRepository
});

container.register<SyncInventoryOperationRepository>(TOKENS.SyncInventoryOperationRepository, {
    useClass: SQLiteInventoryOperationRepository
});

container.register<SyncDayOperationInformationRepository>(TOKENS.SyncDayOperationRepository, {
    useClass: SQLiteDayOperationRepository
});


// =================== Implementation of repositories - Backend server ====================
container.register<StoreRepository>(TOKENS.ServerStoreRepository, {
    useClass: BackendStoreRepository
});

/*
Alternative:
    - SupabaseStoreRepository
*/

container.register<RouteRepository>(TOKENS.ServerRouteRepository, {
    useClass: BackendRouteRepository
});

/*
Alternative:
    - SupabaseRouteRepository
*/

container.register<ProductRepository>(TOKENS.ServerProductRepository, {
    useClass: BackendProductRepository
});

/*
Alternative:
    - SupabaseProductRepository
        Note (06-18-26): Product entity has been modified.

*/

container.register<RouteTransactionRepository>(TOKENS.ServerProductRepository, {
    useClass: BackendRouteTransactionRepository
});


container.register<ServerUserRepository>(TOKENS.ServerAuthenticationRepository, {
    useClass: BackendUserRepository
});

/*
Alternative:
    - SupabaseServerUserRepository
*/

// =================== Implementation of repositories - SyncServer (Supabase) ====================
container.register(TOKENS.SyncServerStoreRepository, {
    useClass: BackendStoreRepository
});
container.register(TOKENS.SyncServerRouteTransactionRepository, {
    useClass: BackendRouteTransactionRepository
});
container.register(TOKENS.SyncServerInventoryOperationRepository, {
    useClass: BackendInventoryOperationRepository
});
container.register(TOKENS.SyncServerWorkdayInformationRepository, {
    useClass: BackendWorkdayInformationRepository
});

container.register<SyncServerDayOperationRepository>(TOKENS.SyncServerDayOperationRepository, {
    useClass: BackendDayOperationRepository
});

export { container }
