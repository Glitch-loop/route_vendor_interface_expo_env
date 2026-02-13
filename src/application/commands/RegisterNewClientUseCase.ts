// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";

// Entites
import { Store } from "@/src/core/entities/Store";

// Object values


// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import { StoreClientAggregate } from "@/src/core/aggregates/StoreClientAggregate";
import { DateService } from "@/src/infrastructure/services/DateService";
import { IDService } from "@/src/core/interfaces/IDService";
import { LocationService } from "@/src/core/interfaces/LocationService";

@injectable()
export class RegisterNewClientUseCase {
    constructor(
        @inject(TOKENS.StoreRepository) private repo: StoreRepository,

        // Services
        @inject(TOKENS.IDService) private readonly idService: IDService,
        @inject(TOKENS.DateService) private readonly dateService: DateService,
        @inject(TOKENS.LocationService) private readonly locationService: LocationService,

    ) { }

    async execute(
        store_name: string,
        store_street: string,
        store_exterior_number: string,
        store_colony: string,
        store_postal_code: string,
        store_address_reference: string,
    ): Promise<void> {
        const storeAggregate = new StoreClientAggregate(null);

        storeAggregate.registerNewClient(
            this.idService.generateID(),
            store_street,
        )

        await this.repo.insertStores(store)
    }
}