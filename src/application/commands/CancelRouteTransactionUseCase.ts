// Libraries
import { OperationDayAggregate } from '@/src/core/aggregates/OperationDayAggregate';
import { ProductInventoryAggregate } from '@/src/core/aggregates/ProductInventoryAggregate';
import { RouteTransactionAggregate } from '@/src/core/aggregates/RouteTransactionAggregate';
import { DayOperation } from '@/src/core/entities/DayOperation';
import { ProductInventory } from '@/src/core/entities/ProductInventory';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';
import { ROUTE_TRANSACTION_STATE } from '@/src/core/enums/RouteTransactionState';
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';
import { IDService } from '@/src/core/interfaces/IDService';
import { InventoryOperationRepository } from '@/src/core/interfaces/InventoryOperationRepository';
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { DateService } from '@/src/infrastructure/services/DateService';
import { inject, injectable } from 'tsyringe';

// Interfaces


@injectable()
export default class CancelRouteTransaction {
    constructor(
        // Repositories
        @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationsRepository: DayOperationRepository,
        @inject(TOKENS.SQLiteRouteTransactionRepository) private readonly localRouteTransactionRepository: RouteTransactionRepository,
        @inject(TOKENS.SQLiteProductInventoryRepository) private readonly localProductInventoryRepository: ProductInventoryRepository,
        
        // Services
        @inject(TOKENS.IDService) private readonly idService: IDService,
        @inject(TOKENS.DateService) private readonly dateService: DateService,
    ) { }

    // TODO: Add synchronization with central database when online.
    async execute(id_route_transaction: string): Promise<void> {
        const currentInventory: ProductInventory[] = await this.localProductInventoryRepository.retrieveInventory();
        const dayOperations: DayOperation[] = await this.localDayOperationsRepository.listDayOperations();
        const routeTransactions: RouteTransaction[] = await this.localRouteTransactionRepository.retrieveRouteTransactionById([ id_route_transaction ]);

        if (routeTransactions.length === 0) throw new Error("The route transaction to cancel does not exist.");

        const routeTransaction:RouteTransaction = routeTransactions[0];

        const { state } = routeTransaction;

        if (state === ROUTE_TRANSACTION_STATE.CANCELLED) throw new Error("The route transaction is already cancelled.");

        const routeTransactionAggregate: RouteTransactionAggregate = new RouteTransactionAggregate(routeTransaction)
        const productInventoryAggregate: ProductInventoryAggregate = new ProductInventoryAggregate(currentInventory);
        const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(dayOperations);

        // Cancelling route transaction.
        routeTransactionAggregate.cancelRouteTransaction();

        const updatedRouteTransaction: RouteTransaction = routeTransactionAggregate.getRouteTransaction();

        const { transaction_description } = updatedRouteTransaction;

        // Reverting inventory changes.
        for (const description of transaction_description) {
            const { id_product_inventory, amount, id_transaction_operation_type } = description;

            // Product devolution has not effect on inventory.
            if (id_transaction_operation_type === DAY_OPERATIONS.sales || id_transaction_operation_type === DAY_OPERATIONS.product_reposition) {
                productInventoryAggregate.increaseStock(id_product_inventory, amount);
            }
        }

        dayOperationAggregate.registerCancelRouteTransaction(
            this.idService.generateID(),
            id_route_transaction,
            new Date(this.dateService.getCurrentTimestamp())
        );

        // Persisting changes.
        const updatedInventory: ProductInventory[] = productInventoryAggregate.getProductInventory();
        const newDayOperations: DayOperation[] | null = dayOperationAggregate.getNewDayOperations();

        await this.localRouteTransactionRepository.updateRouteTransaction(updatedRouteTransaction);
        await this.localProductInventoryRepository.updateInventory(updatedInventory);
        if (newDayOperations !== null) await this.localDayOperationsRepository.insertDayOperations(newDayOperations);
    }
}