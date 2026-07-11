import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface InventoryOperationDescriptionLocalModel extends ReplicationDataInterface {
    id_inventory_operation_description: string;
    price_at_moment: number;
    cost_at_moment: number;
    amount: number;
    created_at: string;
    id_inventory_operation: string;
    id_product: string;
}
