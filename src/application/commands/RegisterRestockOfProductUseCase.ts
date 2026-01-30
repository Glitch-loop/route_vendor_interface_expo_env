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
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';
import { DayOperation } from '@/src/core/entities/DayOperation';

// Aggregates
import { OperationDayAggregate } from '@/src/core/aggregates/OperationDayAggregate';
import { ProductInventoryAggregate } from '@/src/core/aggregates/ProductInventoryAggregate';
import { InventoryOperationAggregate } from '@/src/core/aggregates/InventoryOperationAggregate';

// Object value
import { InventoryOperationDescription } from '@/src/core/object-values/InventoryOperationDescription';

// DTOs and mapper
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';
import WorkDayInformationDTO from '@/src/application/dto/WorkdayInformationDTO';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';


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

    // TODO: Add synchronization with central database when online.
    private async executeUseCase(
        inventoryOperationDescriptions: InventoryOperationDescription[],
        workdayInformation: WorkDayInformation
    ): Promise<void> {
        const { id_work_day } = workdayInformation;
        
        const currentInventory:ProductInventory[] = await this.localProductInventoryRepo.retrieveInventory();
        const dayOperations:DayOperation[] = await this.localDayOperationRepo.listDayOperations();

        const inventoryOperationAggregate: InventoryOperationAggregate = new InventoryOperationAggregate(null);
        const productInventoryAggregate: ProductInventoryAggregate = new ProductInventoryAggregate(currentInventory);
        const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(dayOperations, null);

        const productToUpdate: ProductInventory[] = [];
        const productToInsert: ProductInventory[] = [];
        
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
            const { amount, id_product, price_at_moment } = description; 
            
            // Find if there is a product inventory record, if so increase stock, otherwise insert new product.
            const findProductInventory:ProductInventory | undefined = currentInventory.find((pi) => pi.get_id_product() === id_product);
            
            if (findProductInventory === undefined) {
                productInventoryAggregate.insertProductToInventory(
                    this.idService.generateID(),
                    price_at_moment,
                    amount,
                    id_product
                )
            } else {
                productInventoryAggregate.increaseStock(findProductInventory.get_id_product_inventory(), amount);
            }
        }

        // Add day operation
        dayOperationAggregate.registerRestockInventory(
            this.idService.generateID(),
            id_work_day,
            new Date(this.dateService.getCurrentTimestamp()),
        );

        // Persist all changes
        const newInventoryOperation:InventoryOperation = inventoryOperationAggregate.getInventoryOperation();
        const newDayOperations:DayOperation[] = dayOperationAggregate.getNewDayOperations() || [];
        
        console.log("NEW DAY OPERATIONS: ", newDayOperations.length);
        console.log(newDayOperations)

        // Determine which products were updated and which were inserted
        const updatedInventory:ProductInventory[] = productInventoryAggregate.getProductInventory();
        
        for (const productInventoryToUpdate of updatedInventory) {
            // Find if there is a product inventory record, if so increase stock, otherwise insert new product.
            const findProductInventory:ProductInventory | undefined = currentInventory.find((pi) => pi.get_id_product_inventory() === productInventoryToUpdate.get_id_product_inventory());
            
            console.log("Processing product inventory: ", productInventoryToUpdate.get_id_product_inventory(), " - Found existing: ", findProductInventory !== undefined);  
            if (findProductInventory === undefined) {
                productToInsert.push(productInventoryToUpdate);
            } else {
                productToUpdate.push(productInventoryToUpdate);
                
            }
        }
        
        console.log("Updated inventory records: ", updatedInventory.length);
        console.log("Product to insert: ", productToInsert.length);
        console.log("Product to update: ", productToUpdate.length);

        await this.localProductInventoryRepo.createInventory(productToInsert);
        await this.localProductInventoryRepo.updateInventory(productToUpdate);

        await this.localDayOperationRepo.insertDayOperations(newDayOperations);
        await this.localInventoryOperationRepo.createInventoryOperation(newInventoryOperation);
        console.log("##############################################")
    }

    async execute(
        inventoryOperationDescriptionDTO: InventoryOperationDescriptionDTO[],
        workdayInformationDTO: WorkDayInformationDTO
    ): Promise<void> {
        const mapper = new MapperDTO();

        const inventoryOperationDescriptions: InventoryOperationDescription[] = inventoryOperationDescriptionDTO
            .map((descriptionDTO) => mapper.toEntity(descriptionDTO))
        const workdayInformation: WorkDayInformation = mapper.toEntity(workdayInformationDTO);

        return await this.executeUseCase(
            inventoryOperationDescriptions,
            workdayInformation
        );
    }
}