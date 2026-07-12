// Interfaces
import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

// Models
import InventoryOperationDescriptionServerModel from "@/src/infrastructure/persitence/model/server-models/InventoryOperationDescriptionServerModel";

export default interface InventoryOperationServerModel extends ReplicationDataInterface {
    id_inventory_operation: string,
    date: string;
    state: number;
    id_inventory_operation_type: string,
    id_work_day: string,
    id_user: string,
    inventory_operation_descriptions: InventoryOperationDescriptionServerModel[],
}
