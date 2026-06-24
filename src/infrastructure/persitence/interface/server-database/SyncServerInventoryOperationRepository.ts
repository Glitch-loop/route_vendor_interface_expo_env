import InventoryOperationModel from "@/src/infrastructure/persitence/model/server-models/InventoryOperationServerModel";
import InventoryOperationDescriptionModel from "@/src/infrastructure/persitence/model/server-models/InventoryOperationDescriptionServerModel";

export abstract class SyncServerInventoryOperationRepository {
    abstract upsertInventoryOperations(operations: InventoryOperationModel[]): Promise<void>;
    abstract upsertInventoryOperationDescriptions(descriptions: InventoryOperationDescriptionModel[]): Promise<void>;
}