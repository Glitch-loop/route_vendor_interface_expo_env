
import { inject, injectable } from "tsyringe";

import { TOKENS } from "../di/tokens";
import { SyncInventoryOperationRepository } from "../persitence/interface/local-database/SyncInventoryOperationRepository";
import { SyncRouteTransactionRepository } from "../persitence/interface/local-database/SyncRouteTransactionRepository";
import { SyncStoreRepository } from "../persitence/interface/local-database/SyncStoreRepository";
import { SyncWorkdayInformationRepository } from "../persitence/interface/local-database/SyncWorkdayInformationRepository";


@injectable()
export default class DataReplicationService {
    constructor(
        @inject(TOKENS.SyncInventoryOperationRepository) private readonly syncInventoryOpRepo: SyncInventoryOperationRepository,
        @inject(TOKENS.SyncRouteTransactionRepository) private readonly syncRouteTxRepo: SyncRouteTransactionRepository,
        @inject(TOKENS.SyncStoreRepository) private readonly syncStoreRepo: SyncStoreRepository,
        @inject(TOKENS.SyncWorkdayInformationRepository) private readonly syncWorkdayInfoRepo: SyncWorkdayInformationRepository,

    ) { }
    
    async runReplicationSession() {
        
    }
}