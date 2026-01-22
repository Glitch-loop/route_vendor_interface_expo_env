import { PaymentMethod } from "@/src/core/object-values/PaymentMethod";
import { RouteTransactionState } from "@/src/core/enums/RouteTransactionState";
import RouteTransactionDescriptionDTO from "@/src/application/dto/RouteTransactionDescriptionDTO";

export default interface RouteTransactionDTO {
    id_route_transaction: string,
    date: string,
    state: RouteTransactionState,
    cash_received: number,
    id_work_day: string,
    id_store: string,
    payment_method: PaymentMethod,
    transaction_description: RouteTransactionDescriptionDTO[]
}