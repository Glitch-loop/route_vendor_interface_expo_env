import DAY_OPERATIONS from '@/src/core/enums/DayOperations';

export class RouteTransactionDescription {
  constructor(
    public readonly id_route_transaction_description: string,
    public readonly price_at_moment: number,
    public readonly amount: number,
    public readonly created_at: Date,
    public readonly id_product_inventory: string,
    public readonly id_transaction_operation_type: DAY_OPERATIONS,
    public readonly id_product: string,
    public readonly id_route_transaction: string
  ) {}
}