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
import { RouteTransactionRepository } from "@/src/core/interfaces/RouteTransactionRepository";
import { RouteTransaction } from "@/src/core/entities/RouteTransaction";
import RouteTransactionDTO from "../dto/RouteTransactionDTO";

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
    @inject(TOKENS.SQLiteRouteTransactionRepository) private readonly localRouteTransactionRepo: RouteTransactionRepository,
    @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
    @inject(TOKENS.SQLiteProductRepository) private readonly localProductRepo: ProductRepository,
    
    // Remote repositories dependencies
    @inject(TOKENS.ServerStoreRepository) private readonly remoteStoreRepo: StoreRepository,
    @inject(TOKENS.ServerRouteTransactionRepository) private readonly remoteRouteTransactionRepo: RouteTransactionRepository,
    
    // Services depdendencies
    @inject(TOKENS.IDService) private readonly idService: IDService,
    @inject(TOKENS.DateService) private readonly dateService: DateService,
  ) { }
  // TODO: Add synchronization with central database when online.
  private async executeUseCase(
    petty_cash: number,
    id_user: string,
    routeSelected: Route,
    productToRegister: Product[],
    inventoryOperationDescriptions: InventoryOperationDescription[],
    routeDaySelected: RouteDay): Promise<void> {
    const availableProductsMap: Map<string, Product> = new Map<string, Product>();
    let historicRouteTransactions: RouteTransaction[] = []; 

    if (inventoryOperationDescriptions.length === 0) throw new Error("At least one inventory operation description is required for start shift.");
    
    const shiftORganizationAggregate: ShiftOrganizationAggregate = new ShiftOrganizationAggregate(null);
    const inventoryOperationAggregate: InventoryOperationAggregate = new InventoryOperationAggregate(null);
    const productInventoryAggregate: ProductInventoryAggregate = new ProductInventoryAggregate([]);
    const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(null);

    const { id_route, route_name, description, route_status } = routeSelected;
    const { id_day, id_route_day} = routeDaySelected;

    // Setting auxiliar variables.
    for (const product of productToRegister) {
      const { id_product } = product;
      availableProductsMap.set(id_product, product)
    }

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
        id_user,
        id_route_day
    );
    
    const newWorkDayInformation: WorkDayInformation = shiftORganizationAggregate.getWorkDayInformation();

    // Create inventory operation for starting work day.
    const { id_work_day } = newWorkDayInformation;

    inventoryOperationAggregate.createInventoryOperation(
        this.idService.generateID(),
        '0', // signConfirmation
        new Date(this.dateService.getCurrentTimestamp()),
        id_user,
        0, // audit
        DAY_OPERATIONS.start_shift_inventory,
        id_work_day
    );

    for (const description of inventoryOperationDescriptions) {
      const { amount, id_product } = description;
            
      if(availableProductsMap.has(id_product)) {
        inventoryOperationAggregate.addInventoryOperationDescription(
            this.idService.generateID(),
            availableProductsMap.get(id_product)!.getPrice(), // For inventory operations, use by default base price.
            availableProductsMap.get(id_product)!.cost,
            amount,
            new Date(this.dateService.getCurrentTimestamp()),
            id_product
        )
      } else {
        throw new Error("At moment of starting shift day. It is intended to record an inventory operation using a product that does not exist.")
      }
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
        id_route_day,
        new Date(this.dateService.getCurrentTimestamp())
    );


    // Insert clients to attend as day operations.
    const orderedStores = stores.sort((a, b) => a.position_in_route - b.position_in_route);

    for (const store of orderedStores) {
        const { id_store } = store;
        dayOperationAggregate.registerAttendTodaysClient(
            this.idService.generateID(),
            id_store,
            id_route_day,
            new Date(this.dateService.getCurrentTimestamp()),
        )
    }

    const newDayOperations = dayOperationAggregate.getDayOperations();

    // Retrieve past route transactions of the stores that belongs to the current route.
    // This information is going to be used for insights.
    for (const store of orderedStores) {
        const { id_store } = store;
        const historicRouteTransactionsOfCurrentStore:RouteTransaction[] = await this.remoteRouteTransactionRepo.listRouteTransactionByStore(id_store);
        historicRouteTransactions = historicRouteTransactions.concat(historicRouteTransactionsOfCurrentStore);
    }

    // Store information in local database.
    console.log("Inserting inventory operation")
    console.log("Inventory")
    await this.localInventoryOperationRepo.createInventoryOperation(newInventoryOperation);
    console.log("Inserting stores")
    await this.localStoreRepo.insertStores(allStores);
    
    console.log("Inserting products")
    for (const product of productToRegister) {
        await this.localProductRepo.insertProduct(product);
    }
    
    console.log("Inserting inventories")
    await this.localProductInventoryRepo.createInventory(newInventory);
    console.log("Inserting work days")
    await this.localShiftDayRepo.insertWorkDay(newWorkDayInformation);
    console.log("Inserting day operations")
    await this.localDayOperationRepo.insertDayOperations(newDayOperations!);
    
    console.log("Inserting historic route transactions")
    for (const routeTransaction of historicRouteTransactions) {
        await this.localRouteTransactionRepo.insertRouteTransaction(routeTransaction, true);
    }
  }

  async execute(
      petty_cash: number,
      id_user: string,
      routeSelectedDTO: RouteDTO,
      productToRegisterDTO: ProductDTO[],
      inventoryOperationDescriptionDTO: InventoryOperationDescriptionDTO[],
      routeDaySelectedDTO: RouteDayDTO
  ): Promise<void> {
      const mapper = new MapperDTO();

      const routeSelected: Route = mapper.toEntity(routeSelectedDTO);
      const productToRegister: Product[] = productToRegisterDTO.map(ProductDTO => mapper.toEntity(ProductDTO));
      const inventoryOperationDescriptions: InventoryOperationDescription[] = inventoryOperationDescriptionDTO
          .map((descriptionDTO) => mapper.toEntity(descriptionDTO))
      const routeDaySelected: RouteDay = mapper.toEntity(routeDaySelectedDTO);

      return await this.executeUseCase(
          petty_cash,
          id_user,
          routeSelected,
          productToRegister,
          inventoryOperationDescriptions,
          routeDaySelected
      );
  }
}
