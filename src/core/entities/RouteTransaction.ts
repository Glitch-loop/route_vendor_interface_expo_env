import { RouteTransactionState } from '../enums/RouteTransactionState';
import { PaymentMethod } from '../object-values/PaymentMethod';
import { RouteTransactionDescription } from '../object-values/RouteTransactionDescription';

export class RouteTransaction {
  constructor(
    public readonly id_route_transaction: string,
    public readonly date: string,
    public readonly state: RouteTransactionState,
    public readonly cash_received: number,
    public readonly id_work_day: string,
    public readonly id_store: string,
    public readonly payment_method: PaymentMethod,
    public readonly transaction_description: RouteTransactionDescription[]
  ) {}

  get_transaction_grand_total(): number {
    return this.transaction_description.reduce((total, description) => {
      return total + description.price_at_moment * description.amount;
    }, 0);
  }

  get_subtotal_of_operation_type(id_type_operation: string): number {
    return this.transaction_description
      .filter((description) => description.id_transaction_operation_type === id_type_operation)
      .reduce((subtotal, description) => {
        return subtotal + description.price_at_moment * description.amount;
      }, 0);
  }

  list_transaction_description_by_operation_type(id_type_operation: string): RouteTransactionDescription[] {
    return this.transaction_description.filter(
      (description) => description.id_transaction_operation_type === id_type_operation
    );
  }
}