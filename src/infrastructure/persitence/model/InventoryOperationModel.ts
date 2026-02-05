import { ReplicationDataInterface } from "../data-replication/ReplicationDataInterface";
import InventoryOperationDescriptionModel from "./InventoryOperationDescriptionModel";

export default interface InventoryOperationModel extends ReplicationDataInterface {
    id_inventory_operation: string;
    sign_confirmation: string;
    date: string;
    state: number;
    audit: number;
    id_inventory_operation_type: string;
    id_work_day: string;
    inventory_operation_descriptions: InventoryOperationDescriptionModel[];
}
