// Libraries
import { inject, injectable } from "tsyringe";

// Repository
import { SyncInventoryOperationRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncInventoryOperationRepository";
import { SyncRouteTransactionRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncRouteTransactionRepository";
import { SyncStoreRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncStoreRepository";
import { SyncWorkdayInformationRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncWorkdayInformationRepository";
import { SyncDayOperationInformationRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncDayOperationRepository";
import { SyncServerStoreRepository } from "@/src/infrastructure/persitence/interface/server-database/SyncServerStoreRepository";
import { SyncServerWorkdayInformationRepository } from "@/src/infrastructure/persitence/interface/server-database/SyncServerWorkdayInformationRepository";
import { SyncServerRouteTransactionRepository } from "@/src/infrastructure/persitence/interface/server-database/SyncServerRouteTransactionRepository";
import { SyncServerInventoryOperationRepository } from "@/src/infrastructure/persitence/interface/server-database/SyncServerInventoryOperationRepository";
import { SyncServerDayOperationRepository } from "@/src/infrastructure/persitence/interface/server-database/SyncServerDayOperationRepository";

// di container
import { TOKENS } from "@/src/infrastructure/di/tokens";

// DTOs
import UserDTO from "@/src/application/dto/UserDTO";

// Models
import WorkDayInformationModel from "@/src/infrastructure/persitence/model/server-models/WorkdayInformationServerModel";
import UserModel from "@/src/infrastructure/persitence/model/server-models/UserModel";

// Mappers
import { MapperLocalServerModel } from "@/src/infrastructure/mappers/MapperLocalServerModel";
import WorkDayInformationDTO from "@/src/application/dto/WorkdayInformationDTO";
import { SQLiteShiftOrganizationRepository } from "../repositories/SQLite/SQLiteShiftOrganizationRepository";
import InventoryOperationServerModel from "../persitence/model/server-models/InventoryOperationServerModel";
import RouteTransactionServerModel from "../persitence/model/server-models/RouteTransactionServerModel";
import RouteTransactionLocalModel from "../persitence/model/local-models/RouteTransactionLocalModel";
import InventoryOperationLocalModel from "../persitence/model/local-models/InventoryOperationLocalModel";
import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";

@injectable()
export default class DataReplicationService {
  constructor(
    // Local database dependencies
    @inject(TOKENS.SQLiteShiftOrganizationRepository) private readonly workDayInventories: SQLiteShiftOrganizationRepository,
    @inject(TOKENS.SyncInventoryOperationRepository) private readonly syncInventoryOpRepo: SyncInventoryOperationRepository,
    @inject(TOKENS.SyncRouteTransactionRepository) private readonly syncRouteTxRepo: SyncRouteTransactionRepository,
    @inject(TOKENS.SyncStoreRepository) private readonly syncStoreRepo: SyncStoreRepository,
    @inject(TOKENS.SyncWorkdayInformationRepository) private readonly syncWorkdayInfoRepo: SyncWorkdayInformationRepository,
    @inject(TOKENS.SyncDayOperationRepository) private readonly syncDayOperationRepo: SyncDayOperationInformationRepository,

    // Server database dependencies
    @inject(TOKENS.SyncServerStoreRepository) private readonly serverStoreRepo: SyncServerStoreRepository,
    @inject(TOKENS.SyncServerWorkdayInformationRepository) private readonly serverWorkdayRepo: SyncServerWorkdayInformationRepository,
    @inject(TOKENS.SyncServerRouteTransactionRepository) private readonly serverRouteTxRepo: SyncServerRouteTransactionRepository,
    @inject(TOKENS.SyncServerInventoryOperationRepository) private readonly serverInventoryRepo: SyncServerInventoryOperationRepository,
    @inject(TOKENS.SyncServerDayOperationRepository) private readonly serverDayOperationRepo: SyncServerDayOperationRepository,

    private readonly mapperLocalServerModel: MapperLocalServerModel,
  ) { }
  
  async executeReplicationSession(): Promise<boolean> {
    // Retrieving current work day.
    // Note (30-06-26): In theory, only may be 1 workday in the device.
    const workday:WorkDayInformation[] = await this.workDayInventories.listWorkDays();
    console.log("Listing invenotry operations: ", workday)
    const currnetWorkDay:WorkDayInformation|undefined = workday.pop();
    let wasReplicationSessionCompletedSucessfully: boolean = true;

    if (currnetWorkDay === undefined) {
      throw new Error("Current workday user is required to sync inventory operations.");
    }

    // Phase 1: Work day and stores
    try {
      const pendingWorkDays = await this.syncWorkdayInfoRepo.listPendingWorkdayInformationToSync();
      const pendingStores = await this.syncStoreRepo.listPendingStoreToSync();
      const workDaysWithUser:(WorkDayInformationModel)[] = pendingWorkDays.map(wd => ({
        ...this.mapperLocalServerModel.toServerModel(wd)
      }));
      const storesToSync = pendingStores.map((store) => this.mapperLocalServerModel.toServerModel(store));
      
      console.log(`Pending work days to sync: ${pendingWorkDays.length}`);
      console.log(`Pending stores to sync: ${pendingStores.length}`);

      if (pendingWorkDays.length > 0) {
        await this.serverWorkdayRepo.upsertWorkdayInformations(workDaysWithUser);
        await this.syncWorkdayInfoRepo.markWorkdayInformationAsSynced(pendingWorkDays.map(w => w.id_work_day));
      }
      if (pendingStores.length > 0) {
        await this.serverStoreRepo.upsertStores(storesToSync);
        await this.syncStoreRepo.markStoreAsSynced(pendingStores.map(s => s.id_store));
      }
    } catch (error) {
      console.error("Phase 1 error: ", error);
      wasReplicationSessionCompletedSucessfully = false;
      // Do not mark as synced on failure; let future session retry
    }

    // Phase 2: Route transactions and inventory operations
    try {
      const pendingRouteTx = await this.syncRouteTxRepo.listPendingRouteTransactionToSync();
      const pendingInvOps = await this.syncInventoryOpRepo.listPendingInventoryOperationToSync();

      console.log(`Pending route transactions to sync: ${pendingRouteTx.length}`);
      console.log(`Pending inventory operations to sync: ${pendingInvOps.length}`);

      type PendingOperation =
        | { type: "route-transaction"; date: string; data: RouteTransactionLocalModel }
        | { type: "inventory-operation"; date: string; data: InventoryOperationLocalModel };

      const operationsToSyncFIFO: PendingOperation[] = [
        ...pendingRouteTx.map((routeTransaction) => ({
          type: "route-transaction" as const,
          date: routeTransaction.date,
          data: routeTransaction,
        })),
        ...pendingInvOps.map((inventoryOperation) => ({
          type: "inventory-operation" as const,
          date: inventoryOperation.date,
          data: inventoryOperation,
        })),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const operation of operationsToSyncFIFO) {
        if (operation.type === "route-transaction") {
          const routeTransactionToSync = this.mapperLocalServerModel.toServerModel(operation.data) as RouteTransactionServerModel;
          await this.serverRouteTxRepo.upsertRouteTransactions([routeTransactionToSync]);
          await this.syncRouteTxRepo.markRouteTransactionsAsSynced([operation.data]);
          continue;
        }

        const inventoryOperationToSync = {
          ...this.mapperLocalServerModel.toServerModel(operation.data),
          id_user: currnetWorkDay.id_user,
        } as InventoryOperationServerModel;

        await this.serverInventoryRepo.upsertInventoryOperations([inventoryOperationToSync]);
        await this.syncInventoryOpRepo.markInventoryOperationsAsSynced([operation.data.id_inventory_operation]);
      }
    } catch (error) {
      console.error("Phase 2 error: ", error);
      wasReplicationSessionCompletedSucessfully = false;
    }

    // Phase 3: Day operations
    try {
      const pendingDayOperations = await this.syncDayOperationRepo.listPendingDayOperationToSync();

      const dayOperationsToSync = pendingDayOperations.map((operation) => this.mapperLocalServerModel.toServerModel(operation));

      console.log(`Pending day operations to sync: ${pendingDayOperations.length}`);

      if (pendingDayOperations.length > 0) {
        if(currnetWorkDay === undefined) throw new Error("It doesn't exist a workday for replicate the information");
        await this.serverDayOperationRepo.upsertDayOperations(currnetWorkDay.id_work_day, dayOperationsToSync);
        await this.syncDayOperationRepo.markDayOperationAsSynced(pendingDayOperations.map(o => o.id_day_operation));
      }
    } catch (error) {
      console.error("Phase 3 error: ", error);
      wasReplicationSessionCompletedSucessfully = false;
    }

    return wasReplicationSessionCompletedSucessfully;
  }

  async areAllRecordsReplicated(): Promise<boolean> {
    const pendingWorkDays = await this.syncWorkdayInfoRepo.listPendingWorkdayInformationToSync();
    const pendingStores = await this.syncStoreRepo.listPendingStoreToSync();        
    const pendingRouteTx = await this.syncRouteTxRepo.listPendingRouteTransactionToSync();
    const pendingInvOps = await this.syncInventoryOpRepo.listPendingInventoryOperationToSync();
    const pendingDayOperations = await this.syncDayOperationRepo.listPendingDayOperationToSync();

    return (
      pendingWorkDays.length === 0 &&
      pendingStores.length === 0 &&
      pendingRouteTx.length === 0 &&
      pendingInvOps.length === 0 &&
      pendingDayOperations.length === 0
    );
  }
}