// Object values
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';

// Entities
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';

// Utils 
import { ROUTE_TRANSACTION_STATE } from '@/src/core/enums/RouteTransactionState';
import { PAYMENT_METHODS } from '@/src/core/enums/PaymentMethod';
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';

export class RouteTransactionAggregate {
    private _routeTransaction: RouteTransaction | null;

    constructor(
        public readonly routeTransaction: RouteTransaction | null
    ) {
        this._routeTransaction = routeTransaction;
    }

    createRouteTransaction(
        id_route_transaction: string,
        creationDate: Date,
        cash_received: number,
        id_work_day: string,
        id_store: string,
        payment_method: PAYMENT_METHODS
    ): void {
        this._routeTransaction = new RouteTransaction(
            id_route_transaction,
            creationDate,
            ROUTE_TRANSACTION_STATE.ACTIVE,
            cash_received,
            id_work_day,
            id_store,
            payment_method,
            new Array<RouteTransactionDescription>()
        );
   }

    addRouteTransactionDescription(
        id_route_transaction_description: string,
        price_at_moment: number,
        amount: number,
        created_at: Date,
        id_product_inventory: string,
        id_transaction_operation_type: DAY_OPERATIONS,
        id_product: string
    ): void {
        if (!this._routeTransaction) throw new Error("First, you need to create a route transaction before adding descriptions.");

        const index:number = this._routeTransaction.transaction_description.findIndex(desc => desc.id_product_inventory === id_product_inventory && desc.id_transaction_operation_type === id_transaction_operation_type);

        if (index !== -1) throw new Error("The product you are trying to add already exists in the route transaction descriptions.");

        const route_transaction_description = new RouteTransactionDescription(
            id_route_transaction_description,
            price_at_moment,
            amount,
            created_at,
            id_product_inventory,
            id_transaction_operation_type,
            id_product,
            this._routeTransaction.id_route_transaction
        );

        this._routeTransaction.transaction_description.push(route_transaction_description);
    }

    cancelRouteTransaction(): void {
        if (!this._routeTransaction) throw new Error("No route transaction available.");

        this._routeTransaction = new RouteTransaction(
            this._routeTransaction.id_route_transaction,
            this._routeTransaction.date,
            ROUTE_TRANSACTION_STATE.CANCELLED,
            this._routeTransaction.cash_received,
            this._routeTransaction.id_work_day,
            this._routeTransaction.id_store,
            this._routeTransaction.payment_method,
            this._routeTransaction.transaction_description
        );
    }

    getRouteTransaction(): RouteTransaction {
        if (!this._routeTransaction) throw new Error("No route transaction available.");
        return this._routeTransaction;
    }
}