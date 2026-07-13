
export default interface RouteTransactionDescriptionServerModel {
    id_transaction_description: string,
    price_at_moment: number,
    cost_at_moment: number,
    quantity: number,
    created_at: string,
    id_transaction_operation_type: string,
    id_product: string,
    id_transaction: string,
}
