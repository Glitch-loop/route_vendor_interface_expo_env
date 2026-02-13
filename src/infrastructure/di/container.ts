import 'reflect-metadata';

// Libraries
import { container, Lifecycle } from 'tsyringe'

// DataSources
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource'
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource'

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

// Sync interfaces
import { SyncStoreRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncStoreRepository';
import { SyncWorkdayInformationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncWorkdayInformationRepository';
import { SyncRouteTransactionRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncRouteTransactionRepository';
import { SyncInventoryOperationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncInventoryOperationRepository';

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
import { AndroidPlatformPermissions } from '@/src/infrastructure/services/AndroidPlataformPermissions';
import { GpsService } from '@/src/infrastructure/services/GPSService';
import DataReplicationService from '@/src/infrastructure/services/DataReplicationService';


// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens'
import { LocalDatabaseService } from '@/src/core/interfaces/LocalDatabaseService';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';
import { PlatformPermissionsService } from '@/src/core/interfaces/PlatformPermissions';



// Register DataSources as SINGLETON (one instance for entire app)
container.registerSingleton<SupabaseDataSource>(TOKENS.SupabaseDataSource, SupabaseDataSource);

container.register<SQLiteDataSource>(TOKENS.SQLiteDataSource, 
    { useClass: SQLiteDataSource },
    { lifecycle: Lifecycle.Singleton }
);

// =================== DTOs ====================
container.registerSingleton<MapperDTO>(MapperDTO, MapperDTO);

// =================== Services ====================
container.registerSingleton<IDService>(TOKENS.IDService, UUIDv4Service);

container.registerSingleton<IDateService>(TOKENS.DateService, DateService);

container.register<LocalDatabaseService>(TOKENS.LocalDatabaseService, {
    useClass: SQLiteDatabaseService
});

container.register<PlatformPermissionsService>(TOKENS.PlataformService, {
    useClass: AndroidPlatformPermissions
});

container.register<LocationService>(TOKENS.LocationService, {
    useClass: GpsService
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


// =================== Implementation of repositories - Supabase ====================
container.register<StoreRepository>(TOKENS.SupabaseStoreRepository, {
    useClass: SupabaseStoreRepository
});

container.register<RouteRepository>(TOKENS.SupabaseRouteRepository, {
    useClass: SupabaseRouteRepository
});

container.register<ProductRepository>(TOKENS.SupabaseProductRepository, {
    useClass: SupabaseProductRepository
});

// =================== Implementation of repositories - SyncServer (Supabase) ====================
container.register(TOKENS.SyncServerStoreRepository, {
    useClass: SupabaseStoreRepository
});
container.register(TOKENS.SyncServerRouteTransactionRepository, {
    useClass: SupabaseRouteTransactionRepository
});
container.register(TOKENS.SyncServerInventoryOperationRepository, {
    useClass: SupabaseInventoryOperationRepository
});
container.register(TOKENS.SyncServerWorkdayInformationRepository, {
    useClass: SupabaseWorkdayInformationRepository
});

export { container }
