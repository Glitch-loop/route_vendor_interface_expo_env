// Libraries
import { injectable, inject } from 'tsyringe'

// Aggregates
import { OperationDayAggregate } from '@/src/core/aggregates/OperationDayAggregate';
import { ProductInventoryAggregate } from '@/src/core/aggregates/ProductInventoryAggregate';
import { RouteTransactionAggregate } from '@/src/core/aggregates/RouteTransactionAggregate';

// Entitties
import { DayOperation } from '@/src/core/entities/DayOperation';
import { ProductInventory } from '@/src/core/entities/ProductInventory';
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';
import { Store } from '@/src/core/entities/Store';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';

// Interfaces
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';
import { IDService } from '@/src/core/interfaces/IDService';
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository';
import { DateService } from '@/src/core/interfaces/DateService';
import { StoreRepository } from '@/src/core/interfaces/StoreRepository';

// Object values
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';

// DTOs & Mapper
import { MapperDTO } from '@/src/application/mappers/MapperDTO';
import WorkDayInformationDTO from '@/src/application/dto/WorkdayInformationDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';
import PAYMENT_METHODS from '@/src/core/enums/PaymentMethod';

@injectable()
export default class RegisterNewRouteTransaction {
    constructor(
        // Repositories
        @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
        @inject(TOKENS.SQLiteProductInventoryRepository) private readonly localProductInventoryRepo: ProductInventoryRepository,
        @inject(TOKENS.SQLiteRouteTransactionRepository) private readonly localRouteTransactionRepo: RouteTransactionRepository,
        @inject(TOKENS.SQLiteStoreRepository) private readonly localStoreRepo: StoreRepository,

        // Services
        @inject(TOKENS.IDService) private readonly idService: IDService,
        @inject(TOKENS.DateService) private readonly dateService: DateService,
    ) { }

    private async executeUseCase(
        routeTransactionDescription: RouteTransactionDescription[],
        workDayInformation: WorkDayInformation,
        paymentMethod: PAYMENT_METHODS,
        cashReceived: number,
        id_store: string,
        id_day_operation_dependent: string,
    ):Promise<void> {
        const { id_work_day } = workDayInformation;
        
        const currentInventory: ProductInventory[] = await this.localProductInventoryRepo.retrieveInventory();
        const dayOperations: DayOperation[] = await this.localDayOperationRepo.listDayOperations();
        const storesRetrieved: Store[] = await this.localStoreRepo.retrieveStore([ id_store ]);

        if (storesRetrieved.length === 0) throw new Error("The store where the route transaction is being registered does not exist.");

        const { status_store } = storesRetrieved[0];

        if (status_store === 0) throw new Error("The store where the route transaction is being registered is inactive.");


        const routeTransactionAggregate: RouteTransactionAggregate = new RouteTransactionAggregate(null);
        const productInventoryAggregate: ProductInventoryAggregate = new ProductInventoryAggregate(currentInventory);
        const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(dayOperations);

        // Create route transaction
        routeTransactionAggregate.createRouteTransaction(
            this.idService.generateID(),
            new Date(this.dateService.getCurrentTimestamp()),
            cashReceived,
            id_work_day,
            id_store,
            paymentMethod
        );

        for (const description of routeTransactionDescription) {
            const { price_at_moment, amount, created_at, id_product_inventory, id_transaction_operation_type, id_product } = description;
            routeTransactionAggregate.addRouteTransactionDescription(
                this.idService.generateID(),
                price_at_moment,
                amount,
                created_at,
                id_product_inventory,
                id_transaction_operation_type,
                id_product
            );
        }

        // Update product inventory
        for (const description of routeTransactionDescription) {
            const { amount, id_product_inventory, id_transaction_operation_type } = description;
            if (id_transaction_operation_type === DAY_OPERATIONS.sales || id_transaction_operation_type === DAY_OPERATIONS.product_reposition) {
                productInventoryAggregate.decreaseStock(id_product_inventory, amount);
            } else {
                /* Product devolution does not affect inventory */
            }
        }

        const { id_route_transaction } = routeTransactionAggregate.getRouteTransaction()!;

        // Add day operation
        dayOperationAggregate.registerRouteTransaction(
            this.idService.generateID(),
            id_route_transaction,
            new Date(this.dateService.getCurrentTimestamp()),
            id_day_operation_dependent
        );

        
        // Persist all changes
        const routeTransaction: RouteTransaction = routeTransactionAggregate.getRouteTransaction()!;
        const updatedInventory: ProductInventory[] = productInventoryAggregate.getProductInventory();
        const newListdayOperations: DayOperation[] = dayOperationAggregate.getNewDayOperations() || [];

        await this.localProductInventoryRepo.updateInventory(updatedInventory);
        await this.localRouteTransactionRepo.insertRouteTransaction(routeTransaction);
        await this.localDayOperationRepo.insertDayOperations(newListdayOperations);
    }

    async execute(
        routeTransactionDescription: RouteTransactionDescriptionDTO[],
        workDayInformation: WorkDayInformationDTO,
        paymentMethod: PAYMENT_METHODS,
        cashReceived: number,
        id_store: string,
        id_day_operation_dependent: string) {
            const mapper = new MapperDTO();
            const routeTransactionDescriptions: RouteTransactionDescription[] = routeTransactionDescription
                .map((descriptionDTO) => mapper.toEntity(descriptionDTO));

            const workDayInformationEntity: WorkDayInformation = mapper.toEntity(workDayInformation);

            await this.executeUseCase(
                routeTransactionDescriptions,
                workDayInformationEntity,
                paymentMethod,
                cashReceived,
                id_store,
                id_day_operation_dependent
            );
        
    }
}