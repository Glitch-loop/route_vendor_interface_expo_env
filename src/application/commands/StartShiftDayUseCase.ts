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
import InventoryOperationDescriptionDTO from "@/src/application/dto/InventoryOperationDescriptionDTO";
import { MapperDTO } from "@/src/application/mappers/MapperDTO"; 

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import DAY_OPERATIONS from "@/src/core/enums/DayOperations";

/**
 * StartWorkDayUseCase - Uses SQLite for local/offline operations
 * This use case demonstrates injecting a specific repository implementation
 */
@injectable()
export default class StartWorkDayUseCase {
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
    // TODO: Add synchronization with central database when online.
    private async executeUseCase(
        petty_cash: number,
        routeSelected: Route,
        productToRegister: Product[],
        inventoryOperationDescriptions: InventoryOperationDescription[],
        routeDaySelected: RouteDay): Promise<void> {

        if (inventoryOperationDescriptions.length === 0) throw new Error("At least one inventory operation description is required for start shift.");

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

        inventoryOperationAggregate.createInventoryOperation(
            this.idService.generateID(),
            '0', // signConfirmation
            new Date(this.dateService.getCurrentTimestamp()),
            0, // audit
            DAY_OPERATIONS.start_shift_inventory,
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

        // Create shift inventory
        const newInventoryOperation: InventoryOperation = inventoryOperationAggregate.getInventoryOperation();
        const inventoryDescriptions: InventoryOperationDescription[] = newInventoryOperation.inventory_operation_descriptions;

        // Insert products if there is an inventory description take the amount of the inventory description as stock, otherwise insert producto with stock 0.
        for (const product of productToRegister) { 
            let amount = 0;
            const { id_product, price } = product;
            // const { id_product, price_at_moment, amount } = description;
            const inventoryDescription:InventoryOperationDescription|undefined = inventoryDescriptions.find(description => description.id_product === id_product);

            if (inventoryDescription) {
                amount = inventoryDescription.amount;
            } else {
                amount = 0;
            }

            productInventoryAggregate.insertProductToInventory(
                this.idService.generateID(),
                price,
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
        
        console.log("Making registration of attend clients day operations for stores");
        let aux = 0

        const orderedStores = stores.sort((a, b) => a.position_in_route - b.position_in_route);
        for (const store of orderedStores) {
            const { id_store } = store;
            aux++;
            console.log("Registering attend client day operation for store: ", id_store, " - ", aux);
            dayOperationAggregate.registerAttendTodaysClient(
                this.idService.generateID(),
                id_store,
                new Date(this.dateService.getCurrentTimestamp()),
            )
        }

        const newDayOperations = dayOperationAggregate.getDayOperations();

        // Store information in local database.
        await this.localInventoryOperationRepo.createInventoryOperation(newInventoryOperation);
        await this.localStoreRepo.insertStores(allStores);
        
        for (const product of productToRegister) {
            await this.localProductRepo.insertProduct(product);
        }
        
        await this.localProductInventoryRepo.createInventory(newInventory);
        await this.localShiftDayRepo.insertWorkDay(newWorkDayInformation);
        await this.localDayOperationRepo.insertDayOperations(newDayOperations!);

    }

    async execute(
        petty_cash: number,
        routeSelectedDTO: RouteDTO,
        productToRegisterDTO: ProductDTO[],
        inventoryOperationDescriptionDTO: InventoryOperationDescriptionDTO[],
        routeDaySelectedDTO: RouteDayDTO
    ): Promise<void> {
        const mapper = new MapperDTO();

        const routeSelected: Route = mapper.toEntity(routeSelectedDTO);
        const productToRegister: Product[] = productToRegisterDTO.map(productDTO => mapper.toEntity(productDTO));
        const inventoryOperationDescriptions: InventoryOperationDescription[] = inventoryOperationDescriptionDTO
            .map((descriptionDTO) => mapper.toEntity(descriptionDTO))
        const routeDaySelected: RouteDay = mapper.toEntity(routeDaySelectedDTO);

        return await this.executeUseCase(
            petty_cash,
            routeSelected,
            productToRegister,
            inventoryOperationDescriptions,
            routeDaySelected
        );
    }
}
