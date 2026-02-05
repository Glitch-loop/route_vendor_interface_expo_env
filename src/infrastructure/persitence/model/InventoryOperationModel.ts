import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";


export default interface InventoryOperationModel extends ReplicationDataInterface {
    id_inventory_operation: string;
    sign_confirmation: string;
    date: string;
    state: number;
    audit: number;
    id_inventory_operation_type: string;
    id_work_day: string;
}
