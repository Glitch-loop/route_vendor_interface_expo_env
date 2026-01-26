// Libraries
import { injectable, inject } from 'tsyringe'

// Aggregates
import { OperationDayAggregate } from '@/src/core/aggregates/OperationDayAggregate';
import { ProductInventoryAggregate } from '@/src/core/aggregates/ProductInventoryAggregate';

// Entitties
import { DayOperation } from '@/src/core/entities/DayOperation';
import { ProductInventory } from '@/src/core/entities/ProductInventory';
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';

// Interfaces
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';
import { IDService } from '@/src/core/interfaces/IDService';
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository';
import { DateService } from '@/src/core/interfaces/DateService';

// Object values
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class RegisterNewRouteTransaction {
    constructor(
        // Repositories
        @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
        @inject(TOKENS.SQLiteProductInventoryRepository) private readonly localProductInventoryRepo: ProductInventoryRepository,
        @inject(TOKENS.SQLiteRouteTransactionRepository) private readonly localRouteTransactionRepo: RouteTransactionRepository,

        // Services
        @inject(TOKENS.IDService) private readonly idService: IDService,
        @inject(TOKENS.DateService) private readonly dateService: DateService,
    ) { }

    private async executeUseCase(
       routeTransactionDescription: RouteTransactionDescription[],
       workDayInformation: WorkDayInformation 
    ) {
        const { id_work_day } = workDayInformation;
        
        const currentInventory: ProductInventory[] = await this.localProductInventoryRepo.retrieveInventory();
        const dayOperations: DayOperation[] = await this.localDayOperationRepo.listDayOperations();

        const productInventoryAggregate: ProductInventoryAggregate = new ProductInventoryAggregate(currentInventory);
        const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(dayOperations, null);
    }


}