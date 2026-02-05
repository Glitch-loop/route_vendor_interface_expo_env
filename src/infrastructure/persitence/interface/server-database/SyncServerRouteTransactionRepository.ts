import RouteTransactionModel from "@/src/infrastructure/persitence/model/RouteTransactionModel";
import RouteTransactionDescriptionModel from "@/src/infrastructure/persitence/model/RouteTransactionDescriptionModel";

export abstract class SyncServerRouteTransactionRepository {
    abstract upsertRouteTransactions(transactions: RouteTransactionModel[]): Promise<void>;
    abstract upsertRouteTransactionDescriptions(descriptions: RouteTransactionDescriptionModel[]): Promise<void>;
}