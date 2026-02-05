import InventoryOperationModel from "@/src/infrastructure/persitence/model/InventoryOperationModel";
import InventoryOperationDescriptionModel from "@/src/infrastructure/persitence/model/InventoryOperationDescriptionModel";

export abstract class SyncServerInventoryOperationRepository {
    abstract upsertInventoryOperations(operations: InventoryOperationModel[]): Promise<void>;
    abstract upsertInventoryOperationDescriptions(descriptions: InventoryOperationDescriptionModel[]): Promise<void>;
}