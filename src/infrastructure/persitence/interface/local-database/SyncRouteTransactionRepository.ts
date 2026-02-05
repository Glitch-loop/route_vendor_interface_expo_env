import RouteTransactionModel from "@/src/infrastructure/persitence/model/RouteTransactionModel";
import RouteTransactionDescriptionModel from "@/src/infrastructure/persitence/model/RouteTransactionDescriptionModel";

export abstract class SyncRouteTransactionRepository {
    abstract listPendingRouteTransactionToSync(): Promise<RouteTransactionModel[]>;
    abstract listPendingRouteTransactionDescriptionToSync(): Promise<RouteTransactionDescriptionModel[]>;
    abstract markRouteTransactionsAsSynced(ids: string[]): Promise<void>;
    abstract markRouteTransactionDescriptionsAsSynced(ids: string[]): Promise<void>;
}