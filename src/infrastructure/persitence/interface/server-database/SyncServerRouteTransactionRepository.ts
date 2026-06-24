import RouteTransactionModel from "@/src/infrastructure/persitence/model/server-models/RouteTransactionServerModel";
import RouteTransactionDescriptionModel from "@/src/infrastructure/persitence/model/server-models/RouteTransactionDescriptionServerModel";

export abstract class SyncServerRouteTransactionRepository {
    abstract upsertRouteTransactions(transactions: RouteTransactionModel[]): Promise<void>;
    abstract upsertRouteTransactionDescriptions(descriptions: RouteTransactionDescriptionModel[]): Promise<void>;
}