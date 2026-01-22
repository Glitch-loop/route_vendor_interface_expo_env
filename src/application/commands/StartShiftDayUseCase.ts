// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";
import { InventoryOperation } from "@/src/core/entities/InventoryOperation";
import { ShiftOrganizationRepository } from "@/src/core/interfaces/ShiftOrganizationRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";
import { ProductInventoryRepository } from "@/src/core/interfaces/ProductInventoryRepository";
import { DayOperationRepository } from "@/src/core/interfaces/DayOperationRepository";
import { ProductRepository } from "@/src/core/interfaces/ProductRepository";
import { IDService } from "@/src/core/interfaces/IDService";
import { DateService } from "@/src/core/interfaces/DateService";

// Object values
import { RouteDay } from "@/src/core/object-values/RouteDay";
import { InventoryOperationDescription } from "@/src/core/object-values/InventoryOperationDescription";

// Entities
import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";
import { Product } from "@/src/core/entities/Product";
import { Route } from "@/src/core/entities/Route";
import { Store } from "@/src/core/entities/Store";

// Aggregates
import { ShiftOrganizationAggregate } from "@/src/core/aggregates/ShiftOrganizationAggregate";
import { InventoryOperationAggregate } from "@/src/core/aggregates/InventoryOperationAggregate";
import { ProductInventoryAggregate } from "@/src/core/aggregates/ProductInventoryAggregate";
import { OperationDayAggregate } from "@/src/core/aggregates/OperationDayAggregate";

// DTOs and mapper
import ProductDTO from "@/src/application/dto/ProductDTO";
import RouteDayDTO from "@/src/application/dto/RouteDayDTO";
import RouteDTO from "@/src/application/dto/RouteDTO";
import InventoryOperationDTO from "@/src/application/dto/InventoryOperationDTO";
import { MapperDTO } from "@/src/application/mappers/MapperDTO"; 

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import DAY_OPERATIONS from "@/src/core/enums/DayOperations";

/**
 * StartWorkDayUseCase - Uses SQLite for local/offline operations
 * This use case demonstrates injecting a specific repository implementation
 */
@injectable()
export class StartWorkDayUseCase {
    constructor(
        // Local repositories dependencies
        @inject(TOKENS.SQLiteShiftOrganizationRepository) private readonly localShiftDayRepo: ShiftOrganizationRepository,
        @inject(TOKENS.SQLiteInventoryOperationRepository) private readonly localInventoryOperationRepo: InventoryOperationRepository,
        @inject(TOKENS.SQLiteStoreRepository) private readonly localStoreRepo: StoreRepository,
        @inject(TOKENS.SQLiteProductInventoryRepository) private readonly localProductInventoryRepo: ProductInventoryRepository,
        @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
        @inject(TOKENS.SQLiteProductRepository) private readonly localProductRepo: ProductRepository,
        
        // Remote repositories dependencies
        @inject(TOKENS.SupabaseStoreRepository) private readonly remoteStoreRepo: StoreRepository,
        
        // Services depdendencies
        @inject(TOKENS.IDService) private readonly idService: IDService,
        @inject(TOKENS.DateService) private readonly dateService: DateService,
    ) { }

    private async executeUseCase(
        petty_cash: number,
        routeSelected: Route,
        productToRegister: Product[],
        inventoryOperation: InventoryOperation,
        routeDaySelected: RouteDay): Promise<void> {

        const shiftORganizationAggregate: ShiftOrganizationAggregate = new ShiftOrganizationAggregate(null);
        const inventoryOperationAggregate: InventoryOperationAggregate = new InventoryOperationAggregate(null);
        const productInventoryAggregate: ProductInventoryAggregate = new ProductInventoryAggregate([]);
        const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(null, null);

        const { id_route, route_name, description, route_status } = routeSelected;
        const { id_day, id_route_day} = routeDaySelected;
        
        // Create new work day.
        shiftORganizationAggregate.startWorkDay(
            this.idService.generateID(),
            new Date(this.dateService.getCurrentTimestamp()),
            petty_cash,
            id_route,
            route_name,
            description,
            route_status,
            id_day,
            id_route_day
        );
        
        const newWorkDayInformation: WorkDayInformation = shiftORganizationAggregate.getWorkDayInformation();

        // Create inventory operation for starting work day.
        const { id_work_day } = newWorkDayInformation;
        const { inventory_operation_descriptions } = inventoryOperation;

        inventoryOperationAggregate.createInventoryOperation(
            this.idService.generateID(),
            '0', // signConfirmation
            new Date(this.dateService.getCurrentTimestamp()),
            0, // audit
            DAY_OPERATIONS.start_shift_inventory,
            id_work_day
        );

        for (const description of inventory_operation_descriptions) {
            const { price_at_moment, amount, id_product } = description;
            inventoryOperationAggregate.addInventoryOperationDescription(
                this.idService.generateID(),
                price_at_moment,
                amount,
                new Date(this.dateService.getCurrentTimestamp()),
                id_product
            )
        }

        // Create shift inventory
        const newInventoryOperation: InventoryOperation = inventoryOperationAggregate.getInventoryOperation();
        const inventoryDescriptions: InventoryOperationDescription[] = newInventoryOperation.inventory_operation_descriptions;

        for (const description of inventoryDescriptions) { 
            const { id_product, price_at_moment, amount } = description;
            productInventoryAggregate.insertProductToInventory(
                this.idService.generateID(),
                price_at_moment,
                amount,
                id_product
            )
        }

        const newInventory = productInventoryAggregate.getProductInventory();

        // Get stores for the route day.
        const allStores:Store[] = await this.remoteStoreRepo.listStores();

        // Create day operations.
        /*
            The first operation of the day always will be the start shift inventory, 
            then other operations.
        */
        const { id_inventory_operation } = newInventoryOperation;
        const { stores } = routeDaySelected;

        // Insert start shift inventory operation.
        dayOperationAggregate.registerStartShiftInventory(
            this.idService.generateID(),
            id_inventory_operation,
            new Date(this.dateService.getCurrentTimestamp())
        );

        // Insert clients to attend as day operations.
        for (const store of stores) {
            const { id_store } = store;
            dayOperationAggregate.registerAttendTodaysClient(
                this.idService.generateID(),
                id_store,
                new Date(this.dateService.getCurrentTimestamp()),
            )
        }

        const newDayOperations = dayOperationAggregate.getDayOperations();

        // Store information in local database.
        this.localShiftDayRepo.insertWorkDay(newWorkDayInformation);
        this.localInventoryOperationRepo.createInventoryOperation(newInventoryOperation);
        this.localProductInventoryRepo.createInventory(newInventory);
        this.localStoreRepo.insertStores(allStores);
        for (const product of productToRegister) {
            this.localProductRepo.insertProduct(product);
        }
        
        await this.localDayOperationRepo.insertDayOperations(newDayOperations!);

    }

    async execute(
        petty_cash: number,
        routeSelectedDTO: RouteDTO,
        productToRegisterDTO: ProductDTO[],
        inventoryOperationDTO: InventoryOperationDTO,
        routeDaySelectedDTO: RouteDayDTO
    ): Promise<void> {
        const mapper = new MapperDTO();

        const routeSelected: Route = mapper.toEntity(routeSelectedDTO);
        const productToRegister: Product[] = productToRegisterDTO.map(productDTO => mapper.toEntity(productDTO));
        const inventoryOperation: InventoryOperation = mapper.toEntity(inventoryOperationDTO);
        const routeDaySelected: RouteDay = mapper.toEntity(routeDaySelectedDTO);

        return this.executeUseCase(
            petty_cash,
            routeSelected,
            productToRegister,
            inventoryOperation,
            routeDaySelected
        );
    }
}
