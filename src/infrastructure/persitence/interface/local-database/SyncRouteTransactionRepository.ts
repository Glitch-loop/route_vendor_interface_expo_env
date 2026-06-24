import RouteTransactionLocalModel from "@/src/infrastructure/persitence/model/local-models/RouteTransactionLocalModel";
import RouteTransactionDescriptionLocalModel from "@/src/infrastructure/persitence/model/local-models/RouteTransactionDescriptionLocalModel";

export abstract class SyncRouteTransactionRepository {
    abstract listPendingRouteTransactionToSync(): Promise<RouteTransactionLocalModel[]>;
    abstract listPendingRouteTransactionDescriptionToSync(): Promise<RouteTransactionDescriptionLocalModel[]>;
    abstract markRouteTransactionsAsSynced(ids: string[]): Promise<void>;
    abstract markRouteTransactionDescriptionsAsSynced(ids: string[]): Promise<void>;
}