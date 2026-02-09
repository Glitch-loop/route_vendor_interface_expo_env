
import { inject, injectable } from "tsyringe";

import { TOKENS } from "../di/tokens";
import { SyncInventoryOperationRepository } from "../persitence/interface/local-database/SyncInventoryOperationRepository";
import { SyncRouteTransactionRepository } from "../persitence/interface/local-database/SyncRouteTransactionRepository";
import { SyncStoreRepository } from "../persitence/interface/local-database/SyncStoreRepository";
import { SyncWorkdayInformationRepository } from "../persitence/interface/local-database/SyncWorkdayInformationRepository";
import { SyncServerStoreRepository } from "../persitence/interface/server-database/SyncServerStoreRepository";
import { SyncServerWorkdayInformationRepository } from "../persitence/interface/server-database/SyncServerWorkdayInformationRepository";
import { SyncServerRouteTransactionRepository } from "../persitence/interface/server-database/SyncServerRouteTransactionRepository";
import { SyncServerInventoryOperationRepository } from "../persitence/interface/server-database/SyncServerInventoryOperationRepository";
import UserDTO from "@/src/application/dto/UserDTO";
import WorkDayInformationModel from "../persitence/model/WorkdayInformationModel";
import UserModel from "../persitence/model/UserModel";


@injectable()
export default class DataReplicationService {
    constructor(
        // Local database dependencies
        @inject(TOKENS.SyncInventoryOperationRepository) private readonly syncInventoryOpRepo: SyncInventoryOperationRepository,
        @inject(TOKENS.SyncRouteTransactionRepository) private readonly syncRouteTxRepo: SyncRouteTransactionRepository,
        @inject(TOKENS.SyncStoreRepository) private readonly syncStoreRepo: SyncStoreRepository,
        @inject(TOKENS.SyncWorkdayInformationRepository) private readonly syncWorkdayInfoRepo: SyncWorkdayInformationRepository,

        // Server database dependencies
        @inject(TOKENS.SyncServerStoreRepository) private readonly serverStoreRepo: SyncServerStoreRepository,
        @inject(TOKENS.SyncServerWorkdayInformationRepository) private readonly serverWorkdayRepo: SyncServerWorkdayInformationRepository,
        @inject(TOKENS.SyncServerRouteTransactionRepository) private readonly serverRouteTxRepo: SyncServerRouteTransactionRepository,
        @inject(TOKENS.SyncServerInventoryOperationRepository) private readonly serverInventoryRepo: SyncServerInventoryOperationRepository,
    ) { }   
    
    async executeReplicationSession(userSession: UserDTO): Promise<void> {
        // Phase 1: Work day and stores
        try {
            const pendingWorkDays = await this.syncWorkdayInfoRepo.listPendingWorkdayInformationToSync();
            const pendingStores = await this.syncStoreRepo.listPendingStoreToSync();

            const workDaysWithUser:(WorkDayInformationModel&UserModel)[] = pendingWorkDays.map(wd => ({ ...wd, ...userSession as UserModel }));

            console.log(`Pending work days to sync: ${pendingWorkDays.length}`);
            console.log(`Pending stores to sync: ${pendingStores.length}`);

            console.log("Pending work day: ", pendingWorkDays)
            if (pendingWorkDays.length > 0) {
                await this.serverWorkdayRepo.upsertWorkdayInformations(workDaysWithUser);
                await this.syncWorkdayInfoRepo.markWorkdayInformationAsSynced(pendingWorkDays.map(w => w.id_work_day));
            }
            if (pendingStores.length > 0) {
                await this.serverStoreRepo.upsertStores(pendingStores);
                await this.syncStoreRepo.markStoreAsSynced(pendingStores.map(s => s.id_store));
            }
        } catch (error) {
            console.error("Phase 1 error: ", error);
            // Do not mark as synced on failure; let future session retry
        }

        // Phase 2: Route transactions and inventory operations
        try {
            const pendingRouteTx = await this.syncRouteTxRepo.listPendingRouteTransactionToSync();            
            const pendingInvOps = await this.syncInventoryOpRepo.listPendingInventoryOperationToSync();

            console.log(`Pending route transactions to sync: ${pendingRouteTx.length}`);
            console.log(`Pending inventory operations to sync: ${pendingInvOps.length}`);

            if (pendingRouteTx.length > 0) {
                await this.serverRouteTxRepo.upsertRouteTransactions(pendingRouteTx);
                await this.syncRouteTxRepo.markRouteTransactionsAsSynced(pendingRouteTx.map(t => t.id_route_transaction));
            }
            if (pendingInvOps.length > 0) {
                await this.serverInventoryRepo.upsertInventoryOperations(pendingInvOps);
                await this.syncInventoryOpRepo.markInventoryOperationsAsSynced(pendingInvOps.map(o => o.id_inventory_operation));
            }
        } catch (error) {
            console.error("Phase 2 error: ", error);
        }

        // Phase 3: Descriptions
        try {
            const pendingRouteTxDescs = await this.syncRouteTxRepo.listPendingRouteTransactionDescriptionToSync();
            const pendingInvOpDescs = await this.syncInventoryOpRepo.listPendingInventoryOperationDescriptionToSync();

            console.log(`Pending route transaction descriptions to sync: ${pendingRouteTxDescs.length}`);
            console.log(`Pending inventory operation descriptions to sync: ${pendingInvOpDescs.length}`);

            if (pendingRouteTxDescs.length > 0) {
                await this.serverRouteTxRepo.upsertRouteTransactionDescriptions(pendingRouteTxDescs);
                await this.syncRouteTxRepo.markRouteTransactionDescriptionsAsSynced(pendingRouteTxDescs.map(d => d.id_route_transaction_description));
            }

            if (pendingInvOpDescs.length > 0) {
                await this.serverInventoryRepo.upsertInventoryOperationDescriptions(pendingInvOpDescs);
                await this.syncInventoryOpRepo.markInventoryOperationDescriptionsAsSynced(pendingInvOpDescs.map(d => d.id_inventory_operation_description));
            }
        } catch (error) {
            console.error("Phase 3 error: ", error);
            // Do not mark as synced on failure; let future session retry
        }
    }
}