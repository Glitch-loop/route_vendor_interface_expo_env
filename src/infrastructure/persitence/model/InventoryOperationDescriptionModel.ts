import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface InventoryOperationDescriptionModel extends ReplicationDataInterface {
    id_inventory_operation_description: string;
    price_at_moment: number;
    amount: number;
    id_inventory_operation: string;
    id_product: string;
}
