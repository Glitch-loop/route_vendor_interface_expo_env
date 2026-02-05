


export abstract class SyncRouteTransactionRepository {
    abstract listPendingRouteTransactionToSync(): Promise<[]>;

}