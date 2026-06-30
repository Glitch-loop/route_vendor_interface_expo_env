import InventoryOperationServerModel from "@/src/infrastructure/persitence/model/server-models/InventoryOperationServerModel";
import InventoryOperationDescriptionServerModel from "@/src/infrastructure/persitence/model/server-models/InventoryOperationDescriptionServerModel";

export abstract class SyncServerInventoryOperationRepository {
    abstract upsertInventoryOperations(operations: InventoryOperationServerModel[]): Promise<void>;
    abstract upsertInventoryOperationDescriptions(descriptions: InventoryOperationDescriptionServerModel[]): Promise<void>;
}