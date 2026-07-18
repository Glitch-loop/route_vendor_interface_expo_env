// Libraries
import * as Network from 'expo-network';
import { inject, injectable } from "tsyringe";

// Repository
import { SyncStoreRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncStoreRepository";
import { SQLiteShiftOrganizationRepository } from "@/src/infrastructure/repositories/SQLite/SQLiteShiftOrganizationRepository";
import { SyncServerStoreRepository } from "@/src/infrastructure/persitence/interface/server-database/SyncServerStoreRepository";
import { SyncRouteTransactionRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncRouteTransactionRepository";
import { SyncDayOperationInformationRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncDayOperationRepository";
import { SyncWorkdayInformationRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncWorkdayInformationRepository";
import { SyncInventoryOperationRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncInventoryOperationRepository";
import { SyncServerDayOperationRepository } from "@/src/infrastructure/persitence/interface/server-database/SyncServerDayOperationRepository";
import { SyncServerWorkdayInformationRepository } from "@/src/infrastructure/persitence/interface/server-database/SyncServerWorkdayInformationRepository";
import { SyncServerRouteTransactionRepository } from "@/src/infrastructure/persitence/interface/server-database/SyncServerRouteTransactionRepository";
import { SyncServerInventoryOperationRepository } from "@/src/infrastructure/persitence/interface/server-database/SyncServerInventoryOperationRepository";

// Entities
import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";

// di container
import { TOKENS } from "@/src/infrastructure/di/tokens";

// Models
import RouteTransactionLocalModel from "@/src/infrastructure/persitence/model/local-models/RouteTransactionLocalModel";
import RouteTransactionServerModel from "@/src/infrastructure/persitence/model/server-models/RouteTransactionServerModel";
import InventoryOperationLocalModel from "@/src/infrastructure/persitence/model/local-models/InventoryOperationLocalModel";
import InventoryOperationServerModel from "@/src/infrastructure/persitence/model/server-models/InventoryOperationServerModel";

// Mappers
import { MapperLocalServerModel } from "@/src/infrastructure/mappers/MapperLocalServerModel";
import { StoreRepository } from '@/src/core/interfaces/StoreRepository';

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
    // Sync dependencies
    @inject(TOKENS.SyncServerStoreRepository) private readonly serverStoreRepo: SyncServerStoreRepository,
    @inject(TOKENS.SyncServerWorkdayInformationRepository) private readonly serverWorkdayRepo: SyncServerWorkdayInformationRepository,
    @inject(TOKENS.SyncServerRouteTransactionRepository) private readonly serverRouteTxRepo: SyncServerRouteTransactionRepository,
    @inject(TOKENS.SyncServerInventoryOperationRepository) private readonly serverInventoryRepo: SyncServerInventoryOperationRepository,
    @inject(TOKENS.SyncServerDayOperationRepository) private readonly serverDayOperationRepo: SyncServerDayOperationRepository,
    
    // Consult dependecies
    @inject(TOKENS.SyncServerStoreRepository) private readonly serverStoreRepoConsult: StoreRepository,
    @inject(TOKENS.SyncServerRouteTransactionRepository) private readonly serverRouteTxRepoConsult: SyncServerRouteTransactionRepository,
    @inject(TOKENS.SyncServerInventoryOperationRepository) private readonly serverInventoryRepoConsult: SyncServerInventoryOperationRepository,
    @inject(TOKENS.SyncServerDayOperationRepository) private readonly serverDayOperationRepoConsult: SyncServerDayOperationRepository,


    private readonly mapperLocalServerModel: MapperLocalServerModel,
  ) { }
  
  async executeReplicationSession(): Promise<boolean> {
    // Retrieving current work day.
    // Note (30-06-26): In theory, only may be 1 workday in the device.
    const workday:WorkDayInformation[] = await this.workDayInventories.listWorkDays();
    const currnetWorkDay:WorkDayInformation|undefined = workday.pop();

    if (currnetWorkDay === undefined) {
      throw new Error("Current workday user is required to sync inventory operations.");
    }

    if ((await Network.getNetworkStateAsync()).isConnected === true 
    && (await Network.getNetworkStateAsync()).isInternetReachable === true) {
      // Phase 1: Start work day and stores
      // Phase 2: Route transactions and inventory operations
      // Phase 3: Day operations
      // Phase 4 Finish work day
      if (await this.executePhase1()) {
        if(await this.executePhase2(currnetWorkDay)) {
          if (await this.executePhase3(currnetWorkDay)) {
            if (await this.executePhase4()) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  // Each phase must be an method.
  private async executePhase1(): Promise<boolean> {
    try {
      // Workdays 
      const pendingWorkDays = await this.syncWorkdayInfoRepo.listPendingWorkdayInformationToSync();
      console.log(`Pending starting work days to sync: ${pendingWorkDays.length}`);

      if (pendingWorkDays.length > 0) {
        const startWorkDays = pendingWorkDays
          .filter((workDay) => { return workDay.finish_date === null && workDay.final_petty_cash === null; });
        await this.serverWorkdayRepo.upsertWorkdayInformations(startWorkDays);
        await this.syncWorkdayInfoRepo.markWorkdayInformationAsSynced(startWorkDays.map(w => w.id_work_day));
      }

      // Stores
      const pendingStores = await this.syncStoreRepo.listPendingStoreToSync();
      const storesToSync = pendingStores.map((store) => this.mapperLocalServerModel.toServerModel(store));
      console.log(`Pending stores to sync: ${pendingStores.length}`);

      if (pendingStores.length > 0) {
        console.log("PENDING STORES TO BE SYNCED")
        console.log(storesToSync)
        await this.serverStoreRepo.upsertStores(storesToSync);
        await this.syncStoreRepo.markStoreAsSynced(pendingStores.map(s => s.id_store));
      }



      console.log("Phase 1 finishing: ", true)
      return true;
    } catch (error) {
      console.error("Phase 1 error: ", error);
      return false;
      // Do not mark as synced on failure; let future session retry
    }
  }

  private async executePhase2(currnetWorkDay: WorkDayInformation): Promise<boolean> { 
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

      return true;
    } catch (error) {
      console.error("Phase 2 error: ", error);
      return false;
    }
  }
  
  private async executePhase3(currnetWorkDay: WorkDayInformation): Promise<boolean> { 
    try {
      const pendingDayOperations = await this.syncDayOperationRepo.listPendingDayOperationToSync();

      const dayOperationsToSync = pendingDayOperations.map((operation) => this.mapperLocalServerModel.toServerModel(operation));

      console.log(`Pending day operations to sync: ${pendingDayOperations.length}`);

      if (pendingDayOperations.length > 0) {
        if(currnetWorkDay === undefined) throw new Error("It doesn't exist a workday for replicate the information");
        await this.serverDayOperationRepo.upsertDayOperations(currnetWorkDay.id_work_day, dayOperationsToSync);
        await this.syncDayOperationRepo.markDayOperationAsSynced(pendingDayOperations.map(o => o.id_day_operation));
      }

      return true;
    } catch (error) {
      console.error("Phase 3 error: ", error);
      return false;
    }
  }

  private async executePhase4(): Promise<boolean> {
    try {
      const pendingWorkDays = await this.syncWorkdayInfoRepo.listPendingWorkdayInformationToSync();
      
      console.log(`Pending finishing work days to sync: ${pendingWorkDays.length}`);

      if (pendingWorkDays.length > 0) {
        const endWorkDays = pendingWorkDays
          .filter((workDay) => { return workDay.finish_date !== null && workDay.final_petty_cash !== null; });
        await this.serverWorkdayRepo.upsertWorkdayInformations(endWorkDays);
        await this.syncWorkdayInfoRepo.markWorkdayInformationAsSynced(endWorkDays.map(w => w.id_work_day));
      }

      return true;

    } catch (error) {
      console.error("Phase 4 error: ", error);
      return false;
      // Do not mark as synced on failure; let future session retry
    }
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