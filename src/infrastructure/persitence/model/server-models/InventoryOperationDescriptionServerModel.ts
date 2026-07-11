import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface InventoryOperationDescriptionServerModel extends ReplicationDataInterface {
    id_product_operation_description: string;
    price_at_moment: number;
    cost_at_moment: number;
    quantity: number;
    created_at: string;
    id_inventory_operation: string;
    id_product: string;
}
