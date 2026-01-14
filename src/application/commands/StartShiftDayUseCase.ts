// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";
import { InventoryOperation } from "@/src/core/entities/InventoryOperation";
import { ShiftOrganizationRepository } from "@/src/core/interfaces/ShiftOrganizationRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";

// Entities
import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";

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
        // @inject(TOKENS.SupabaseInventoryOperationRepository) private readonly remoteInventoryOperationRepo: InventoryOperationRepository,


    ) { }

    async execute(workDayInformation: WorkDayInformation, initialInventory: InventoryOperation[], routeDaySelected: any): Promise<void> {
        const routeDayClients = [];
        
        

        // Create new work day.
        this.localShiftDayRepo.insertWorkDay(workDayInformation);

        // Register initial inventory.

        // Save locally clients of the route day.
        
        
        console.log(`Found ${stores.length} stores in local SQLite database`);

    }
}
