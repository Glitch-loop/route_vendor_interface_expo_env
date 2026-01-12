// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";

// Object values
import { Store } from "@/src/core/entities/Store";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";

@injectable()
export class RegisterNewClientUseCase {
    constructor(@inject(TOKENS.StoreRepository) private repo: StoreRepository) { }

    async execute(store: Store[]): Promise<void> {
        await this.repo.insertStores(store)
    }
}