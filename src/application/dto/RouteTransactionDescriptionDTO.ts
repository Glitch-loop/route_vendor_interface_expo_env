import DAY_OPERATIONS from "@/src/core/enums/DayOperations"

export default interface RouteTransactionDescriptionDTO {
    id_route_transaction_description: string,
    price_at_moment: number,
    amount: number,
    created_at: Date,
    id_transaction_operation_type: DAY_OPERATIONS,
    id_product: string,
    id_route_transaction: string,
    id_product_inventory: string | null,
}