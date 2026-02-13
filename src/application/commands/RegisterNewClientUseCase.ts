// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";

// Entites
import { DayOperation } from "@/src/core/entities/DayOperation";

// Object values
import { Coordinates } from "@/src/core/object-values/Coordinates";

// DTOs
import { MapperDTO } from "@/src/application/mappers/MapperDTO";
import UserDTO from "@/src/application/dto/UserDTO";
import DayOperationDTO from "@/src/application/dto/DayOperationDTO";

// Interfaces
import { DayOperationRepository } from "@/src/core/interfaces/DayOperationRepository";
import { LocationService } from "@/src/core/interfaces/LocationService";
import { IDService } from "@/src/core/interfaces/IDService";
import { DateService } from "@/src/core/interfaces/DateService";

// Aggregates
import { StoreClientAggregate } from "@/src/core/aggregates/StoreClientAggregate";
import { OperationDayAggregate } from "@/src/core/aggregates/OperationDayAggregate";


// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import { cleanStringToStoreInDatabase } from "@/utils/string/utils";

@injectable()
export class RegisterNewClientUseCase {
    constructor(
        @inject(TOKENS.SQLiteStoreRepository) private storeRepository: StoreRepository,
        @inject(TOKENS.SQLiteDayOperationRepository) private dayOperationRepository: DayOperationRepository,

        // Services
        @inject(TOKENS.IDService) private readonly idService: IDService,
        @inject(TOKENS.DateService) private readonly dateService: DateService,
        @inject(TOKENS.LocationService) private readonly locationService: LocationService,
        private mapperDTO: MapperDTO
    ) { }

    async execute(
        storeName: string,
        storeStreet: string,
        storeExteriorNumber: string,
        storeColony: string,
        storePostalCode: string,
        storeAddressReference: string,
        useSession: UserDTO
    ): Promise<DayOperationDTO> {
        const { id_vendor} = useSession;

        const dayOperations: DayOperation[] = await this.dayOperationRepository.listDayOperations();

        const storeAggregate = new StoreClientAggregate(null);
        const operationDayAggregate = new OperationDayAggregate(dayOperations);

        // Register new client
        console.log("Obtaining current location for new client registration...")
        const coordinates:Coordinates|null = await this.locationService.getCurrentLocation()
        console.log("Coordinates obtained:", coordinates);
        if (coordinates === null) throw new Error('Location cannot be obtained. Client registration requires location data.');

        const { latitude, longitude } = coordinates;

        storeAggregate.registerNewClient(
            this.idService.generateID(),
            cleanStringToStoreInDatabase(storeStreet),
            cleanStringToStoreInDatabase(storeExteriorNumber),
            cleanStringToStoreInDatabase(storeColony),
            cleanStringToStoreInDatabase(storePostalCode),
            cleanStringToStoreInDatabase(storeAddressReference),
            cleanStringToStoreInDatabase(storeName),
            '',
            '',
            latitude.toString(),
            longitude.toString(),
            id_vendor,
            new Date(this.dateService.getCurrentTimestamp()),
            'ruta',
        )

        const newStore = storeAggregate.getStoreClients().pop();

        if (!newStore) throw new Error("Error registering new client. Please try again.");

        const { id_store } = newStore;

        operationDayAggregate.registerCreateNewClient(
            this.idService.generateID(),
            id_store,
            new Date(this.dateService.getCurrentTimestamp())
        )

        const newDayOperations: DayOperation[]|null = operationDayAggregate.getNewDayOperations();

        if (newDayOperations === null) throw new Error("Error registering new client. Please try again.");

        const newClientDayOperation: DayOperation | undefined = newDayOperations.pop();

        if (!newClientDayOperation) throw new Error("Error registering new client. Please try again.");

        // Persist all changes
        await this.storeRepository.insertStores([ newStore ]);
        await this.dayOperationRepository.insertDayOperations([ newClientDayOperation ]);

        return this.mapperDTO.toDTO(newClientDayOperation);
    }
}