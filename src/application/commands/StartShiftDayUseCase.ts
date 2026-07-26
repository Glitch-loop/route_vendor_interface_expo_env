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
import { RouteTransactionRepository } from "@/src/core/interfaces/RouteTransactionRepository";
import { RouteRepository } from "@/src/core/interfaces/RouteRepository";

// Object values
import { RouteDay } from "@/src/core/object-values/RouteDay";
import { InventoryOperationDescription } from "@/src/core/object-values/InventoryOperationDescription";

// Entities
import { Store } from "@/src/core/entities/Store";
import { Route } from "@/src/core/entities/Route";
import { Product } from "@/src/core/entities/Product";
import { RouteTransaction } from "@/src/core/entities/RouteTransaction";
import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";

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

// DI container
import { TOKENS } from "@/src/infrastructure/di/tokens";

// Utils
import DAY_OPERATIONS from "@/src/core/enums/DayOperations";

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
    @inject(TOKENS.ServerRouteRepository) private readonly remoteRouteRepo: RouteRepository,
    @inject(TOKENS.ServerRouteTransactionRepository) private readonly remoteRouteTransactionRepo: RouteTransactionRepository,
    
    // Services dependencies
    @inject(TOKENS.IDService) private readonly idService: IDService,
    @inject(TOKENS.DateService) private readonly dateService: DateService,
  ) { }

  private async executeUseCase(
    petty_cash: number,
    id_user: string,
    routeSelected: Route,
    productToRegister: Product[],
    inventoryOperationDescriptions: InventoryOperationDescription[],
    routeDaySelected: RouteDay
  ): Promise<void> {
    if (inventoryOperationDescriptions.length === 0) {
      throw new Error("At least one inventory operation description is required to start shift.");
    }

    const availableProductsMap = new Map<string, Product>();
    for (const product of productToRegister) {
      availableProductsMap.set(product.id_product, product);
    }

    const shiftOrganizationAggregate = new ShiftOrganizationAggregate(null);
    const inventoryOperationAggregate = new InventoryOperationAggregate(null);
    const productInventoryAggregate = new ProductInventoryAggregate([]);
    const dayOperationAggregate = new OperationDayAggregate(null);

    const { id_route, route_name, description, route_status } = routeSelected;
    const { id_day, id_route_day } = routeDaySelected;

    // 1. Domain Aggregate: Start Work Day
    shiftOrganizationAggregate.startWorkDay(
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
    const newWorkDayInformation: WorkDayInformation = shiftOrganizationAggregate.getWorkDayInformation();

    // 2. Domain Aggregate: Create Inventory Operation
    const { id_work_day } = newWorkDayInformation;
    inventoryOperationAggregate.createInventoryOperation(
      this.idService.generateID(),
      '0',
      new Date(this.dateService.getCurrentTimestamp()),
      id_user,
      0,
      DAY_OPERATIONS.start_shift_inventory,
      id_work_day
    );

    for (const descriptionItem of inventoryOperationDescriptions) {
      const { amount, id_product } = descriptionItem;
      const product = availableProductsMap.get(id_product);
            
      if (!product) {
        throw new Error("Attempted to record an inventory operation with a non-existent product.");
      }

      inventoryOperationAggregate.addInventoryOperationDescription(
        this.idService.generateID(),
        product.getPrice(),
        product.cost,
        amount,
        new Date(this.dateService.getCurrentTimestamp()),
        id_product
      );
    }

    // 3. Domain Aggregate: Product Inventory Setup
    const newInventoryOperation: InventoryOperation = inventoryOperationAggregate.getInventoryOperation();
    const inventoryDescriptions = newInventoryOperation.inventory_operation_descriptions;

    for (const product of productToRegister) { 
      const inventoryDescription = inventoryDescriptions.find(
        (desc) => desc.id_product === product.id_product
      );
      const amount = inventoryDescription ? inventoryDescription.amount : 0;

      productInventoryAggregate.insertProductToInventory(
        this.idService.generateID(),
        amount,
        product.id_product
      );
    }
    const newInventory = productInventoryAggregate.getProductInventory();

    // 🚀 REMOTE RETRIEVAL (PARALLEL): Fetch initial store and route data together
    const [allStores, routeDayStores] = await Promise.all([
      this.remoteStoreRepo.listStores(),
      this.remoteRouteRepo.listRouteDayStoresByRoute(id_route_day),
    ]);

    // Build Day Operations Aggregate
    dayOperationAggregate.registerStartShiftInventory(
      this.idService.generateID(),
      newInventoryOperation.id_inventory_operation,
      id_route_day,
      new Date(this.dateService.getCurrentTimestamp())
    );

    const orderedStores = [...routeDayStores].sort(
      (a, b) => a.position_in_route - b.position_in_route
    );

    for (const store of orderedStores) {
      dayOperationAggregate.registerAttendTodaysClient(
        this.idService.generateID(),
        store.id_store,
        id_route_day,
        new Date(this.dateService.getCurrentTimestamp())
      );
    }
    const newDayOperations = dayOperationAggregate.getDayOperations();

    // 🚀 REMOTE RETRIEVAL (PARALLEL): Fetch all store transaction histories concurrently
    const transactionPromises = orderedStores.map((store) =>
      this.remoteRouteTransactionRepo.listRouteTransactionByStore(store.id_store)
    );
    const storeTransactionsResults = await Promise.all(transactionPromises);
    const historicRouteTransactions: RouteTransaction[] = storeTransactionsResults.flat();

    // 🔒 LOCAL PERSISTENCE (SEQUENTIAL): Write to SQLite safely step-by-step
    await this.localInventoryOperationRepo.createInventoryOperation(newInventoryOperation);
    await this.localStoreRepo.insertStores(allStores);

    for (const product of productToRegister) {
      await this.localProductRepo.insertProduct(product);
    }

    await this.localProductInventoryRepo.createInventory(newInventory);
    await this.localShiftDayRepo.insertWorkDay(newWorkDayInformation);
    await this.localDayOperationRepo.insertDayOperations(newDayOperations!);

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
    const productToRegister: Product[] = productToRegisterDTO.map((dto) => mapper.toEntity(dto));
    const inventoryOperationDescriptions: InventoryOperationDescription[] = inventoryOperationDescriptionDTO.map((dto) => mapper.toEntity(dto));
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