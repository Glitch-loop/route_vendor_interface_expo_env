import { ReplicationDataInterface } from "../data-replication/ReplicationDataInterface";
import { ROUTE_TRANSACTION_STATE } from "@/src/core/enums/RouteTransactionState";
import PAYMENT_METHODS from "@/src/core/enums/PaymentMethod";

export default interface RouteTransactionModel extends ReplicationDataInterface {
    id_route_transaction: string,
    date: string,
    state: ROUTE_TRANSACTION_STATE,
    cash_received: number,
    id_work_day: string,
    id_store: string,
    payment_method: PAYMENT_METHODS,
}
