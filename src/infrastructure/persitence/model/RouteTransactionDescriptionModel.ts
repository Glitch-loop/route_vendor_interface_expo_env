import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";
import DAY_OPERATIONS from "@/src/core/enums/DayOperations";

export default interface RouteTransactionDescriptionModel extends ReplicationDataInterface {
    id_route_transaction_description: string,
    price_at_moment: number,
    cost_at_moment: number,
    amount: number,
    created_at: Date,
    id_transaction_operation_type: DAY_OPERATIONS,
    id_product: string,
}
