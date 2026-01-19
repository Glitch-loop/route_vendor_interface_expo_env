import { RouteTransactionOperation } from '../enums/RouteTransactionOperation';

export class RouteTransactionDescription {
  constructor(
    public readonly id_route_transaction_description: string,
    public readonly price_at_moment: number,
    public readonly amount: number,
    public readonly created_at: Date,
    public readonly id_transaction_operation_type: RouteTransactionOperation,
    public readonly id_product: string,
    public readonly id_route_transaction: string
  ) {}
}