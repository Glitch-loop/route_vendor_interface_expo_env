// Enums
import { ROUTE_TRANSACTION_STATE } from '@/src/core/enums/RouteTransactionState';
import { PAYMENT_METHODS } from '@/src/core/enums/PaymentMethod';

// Object values
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';

export class RouteTransaction {
  constructor(
    public readonly id_route_transaction: string,
    public readonly date: Date,
    public readonly state: ROUTE_TRANSACTION_STATE,
    public readonly cash_received: number,
    public readonly id_work_day: string,
    public readonly id_store: string,
    public readonly payment_method: PAYMENT_METHODS,
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