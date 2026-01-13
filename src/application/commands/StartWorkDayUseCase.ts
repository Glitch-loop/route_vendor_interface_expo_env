// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";

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
        @inject(TOKENS.SQLiteStoreRepository) 
        private storeRepo: StoreRepository
    ) { }

    async execute(): Promise<void> {
        // This will use SQLite implementation
        const stores = await this.storeRepo.listStores();
        console.log(`Found ${stores.length} stores in local SQLite database`);
        
        // Your work day logic here...
    }
}
