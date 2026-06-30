import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";
import RouteTransactionDescriptionLocalModel from "@/src/infrastructure/persitence/model/local-models/InventoryOperationDescriptionLocalModel";


export default interface InventoryOperationLocalModel extends ReplicationDataInterface {
    id_inventory_operation: string,
    sign_confirmation: string,
    date: string,
    state: number,
    audit: number,
    id_inventory_operation_type: string,
    id_work_day: string,
    inventory_operation_descriptions: RouteTransactionDescriptionLocalModel[]
}
