import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";
import InventoryOperationDescriptionModel from "./InventoryOperationDescriptionModel";


export default interface InventoryOperationModel extends ReplicationDataInterface {
    id_inventory_origin: string;
    id_inventory_target: string;
    created_by: string;
    inventory_operation_descriptions: InventoryOperationDescriptionModel[],
    id_inventory_operation: string,
    created_at: string,
    latitude: string
    longitude: string
}
