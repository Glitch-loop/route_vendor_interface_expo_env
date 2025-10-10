// Entities
import { RouteTransaction } from '../entities/RouteTransaction';
import { Store } from '../entities/Store';

// Object values
import { PaymentMethod } from '../object_values/PaymentMethod';
import { RouteTransactionDescription } from '../object_values/RouteTransactionDescription';

export abstract class IRouteTransaction {
  abstract insertRouteTransaction(route_transaction: RouteTransaction): Promise<void>;
  abstract updateRouteTransaction(route_transaction: RouteTransaction): Promise<void>;
  abstract deleteRouteTransactions(route_transactions: RouteTransaction[]): Promise<void>;
  abstract listRouteTransactions(): Promise<RouteTransaction[]>;
  abstract listRouteTransactionByStore(store: Store): Promise<RouteTransaction[]>;
  abstract retrieveRouteTransactionById(id_route_transactions: string[]): Promise<RouteTransaction[]>;
  abstract listPaymentMethods(): Promise<PaymentMethod[]>;
  abstract listRouteTransactionDescriptions(): Promise<RouteTransactionDescription[]>;
}