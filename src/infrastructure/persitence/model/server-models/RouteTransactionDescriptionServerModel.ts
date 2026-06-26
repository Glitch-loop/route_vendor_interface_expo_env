import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface RouteTransactionDescriptionServerModel extends ReplicationDataInterface {
    id_route_transaction_description: string,
    price_at_moment: number,
    cost_at_moment: number,
    quantity: number,
    created_at: Date,
    id_transaction_operation_type: string,
    id_product: string,
}
