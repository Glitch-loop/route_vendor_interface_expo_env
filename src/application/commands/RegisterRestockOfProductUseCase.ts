// Libraries
import { inject, injectable } from 'tsyringe';

// Interfaces
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';
import { InventoryOperationRepository } from '@/src/core/interfaces/InventoryOperationRepository';
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';
import { IDService } from '@/src/core/interfaces/IDService';
import { DateService } from '@/src/core/interfaces/DateService';

// Entities
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';
import { ProductInventory } from '@/src/core/entities/ProductInventory';

// Aggregates
import { OperationDayAggregate } from '@/src/core/aggregates/OperationDayAggregate';
import { ProductInventoryAggregate } from '@/src/core/aggregates/ProductInventoryAggregate';
import { InventoryOperationAggregate } from '@/src/core/aggregates/InventoryOperationAggregate';

// Object value
import { InventoryOperationDescription } from '@/src/core/object-values/InventoryOperationDescription';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';
import { DayOperation } from '@/src/core/entities/DayOperation';


@injectable()
export default class RegisterRestockOfProductUseCase {
    constructor(
    // Repositories
    @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
    @inject(TOKENS.SQLiteProductInventoryRepository) private readonly localProductInventoryRepo: ProductInventoryRepository,
    @inject(TOKENS.SQLiteInventoryOperationRepository) private readonly localInventoryOperationRepo: InventoryOperationRepository,   

    // Services
    @inject(TOKENS.IDService) private readonly idService: IDService,
    @inject(TOKENS.DateService) private readonly dateService: DateService,
    ) { }

    public async executeUseCase(
        inventoryOperationDescriptions: InventoryOperationDescription[],
        workdayInformation: WorkDayInformation
    ): Promise<void> {
        const { id_work_day } = workdayInformation;
        
        const currentInventory:ProductInventory[] = await this.localProductInventoryRepo.retrieveInventory();
        const dayOperations:DayOperation[] = await this.localDayOperationRepo.listDayOperations();

        const inventoryOperationAggregate: InventoryOperationAggregate = new InventoryOperationAggregate(null);
        const productInventoryAggregate: ProductInventoryAggregate = new ProductInventoryAggregate(currentInventory);
        const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(dayOperations, null);

        // Create inventory operation
        inventoryOperationAggregate.createInventoryOperation(
            this.idService.generateID(),
            '0', // signConfirmation
            new Date(this.dateService.getCurrentTimestamp()),
            0, // audit
            DAY_OPERATIONS.restock_inventory,
            id_work_day
        );

        for (const description of inventoryOperationDescriptions) {
            const { price_at_moment, amount, id_product } = description;
            inventoryOperationAggregate.addInventoryOperationDescription(
                this.idService.generateID(),
                price_at_moment,
                amount,
                new Date(this.dateService.getCurrentTimestamp()),
                id_product
            )
        }

        // Update product inventory
        for (const description of inventoryOperationDescriptions) {
            const { amount, id_product } = description;
            productInventoryAggregate.increaseStock(id_product, amount);
        }

        // Add day operation
        dayOperationAggregate.registerRestockInventory(
            this.idService.generateID(),
            id_work_day,
            new Date(this.dateService.getCurrentTimestamp()),
        );

        // Persist all changes
        const updatedInventory:ProductInventory[] = productInventoryAggregate.getProductInventory();
        const newInventoryOperation:InventoryOperation = inventoryOperationAggregate.getInventoryOperation();
        const newDayOperations:DayOperation[] = dayOperationAggregate.getDayOperations() || [];
        
        await this.localProductInventoryRepo.updateInventory(updatedInventory);
        await this.localDayOperationRepo.insertDayOperations(newDayOperations);
        this.localInventoryOperationRepo.createInventoryOperation(newInventoryOperation);
    }
}