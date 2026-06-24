import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface RouteTransactionDescriptionLocalModel extends ReplicationDataInterface {
    id_route_transaction_description: string,
    price_at_moment: number,
    cost_at_moment: number,
    amount: number,
    created_at: Date,
    id_product_inventory: string,
    id_transaction_operation_type: string,
    id_product: string,
    id_route_transaction: string
}
