// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";
import { InventoryOperation } from "@/src/core/entities/InventoryOperation";
import { ShiftOrganizationRepository } from "@/src/core/interfaces/ShiftOrganizationRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";

import { IDService } from "@/src/core/interfaces/IDService";
import { DateService } from "@/src/core/interfaces/DateService";

// Entities
import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import { RouteDay } from "@/src/core/object-values/RouteDay";
import { Product } from "@/src/core/entities/Product";

// DTOs and mapper
import ProductDTO from "../dto/ProductDTO";
import RouteDayDTO from "../dto/RouteDayDTO";
import RouteDTO from "../dto/RouteDTO";
import InventoryOperationDTO from "../dto/InventoryOperationDTO";
import { MapperDTO } from "@/src/application/mappers/MapperDTO"; 


/**
 * StartWorkDayUseCase - Uses SQLite for local/offline operations
 * This use case demonstrates injecting a specific repository implementation
 */
@injectable()
export class StartWorkDayUseCase {
    constructor(
        // Inject the SQLite implementation specifically
        @inject(TOKENS.SQLiteShiftOrganizationRepository) private readonly localShiftDayRepo: ShiftOrganizationRepository,
        // @inject(TOKENS.SupabaseShiftOrganizationRepository) private readonly remoteShiftDayRepo: ShiftOrganizationRepository,
        @inject(TOKENS.SQLiteStoreRepository) private readonly localStoreRepo: StoreRepository,
        @inject(TOKENS.SupabaseStoreRepository) private readonly remoteStoreRepo: StoreRepository,
        @inject(TOKENS.SupabaseInventoryRepository) private readonly remoteInventoryRepo: InventoryOperationRepository,
        @inject(TOKENS.SQLiteInventoryOperationRepository) private readonly localInventoryOperationRepo: InventoryOperationRepository,

        // Services
        @inject(TOKENS.IDService) private readonly idService: IDService,
        @inject(TOKENS.DateService) private readonly dateService: DateService,
        // @inject(TOKENS.SupabaseInventoryOperationRepository) private readonly remoteInventoryOperationRepo: InventoryOperationRepository,


    ) { }

    async execute(
        petty_cash: number,
        
        productToRegister: Product[],
        inventoryOperation: InventoryOperation[],
        routeDaySelected: RouteDay): Promise<void> {
        const routeDayClients = [];
        
        this.idService.generateID();
        

        // Create new work day.
        this.localShiftDayRepo.insertWorkDay(workDayInformation);

        // Create route inventory.
        // Register initial inventory operation.
        // Register route inventory.

        // Save locally clients of the route day.

        // Register operations of the day
        // Start shift inventory.

        // Register routes to attend.

    }

    async execute(
        petty_cash: number,
        routeSelected: RouteDTO,
        productToRegister: ProductDTO[],
        inventoryOperation: InventoryOperationDTO,
        routeDaySelected: RouteDayDTO
    ): Promise<void> {
        
    }
}
