// Libraries
import { injectable, inject } from 'tsyringe'

// Aggregates
import { OperationDayAggregate } from '@/src/core/aggregates/OperationDayAggregate';

// Entitties
import { DayOperation } from '@/src/core/entities/DayOperation';

// Interfaces
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';
import { IDService } from '@/src/core/interfaces/IDService';
import { DateService } from '@/src/core/interfaces/DateService';


// DTOs & Mapper
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import DayOperationDTO from '../dto/DayOperationDTO';
import { LocationService } from '@/src/core/interfaces/LocationService';
import { Coordinates } from '@/src/core/object-values/Coordinates';
import { Store } from '@/src/core/entities/Store';
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';
import { StoreRepository } from '@/src/core/interfaces/StoreRepository';

@injectable()
export default class ConfirmClientProspectAsClientUseCase {
    constructor(
        // Repositories
        @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,
        @inject(TOKENS.SQLiteStoreRepository) private readonly localStoreRepo: StoreRepository,

        // Services
        @inject(TOKENS.IDService) private readonly idService: IDService,
        @inject(TOKENS.DateService) private readonly dateService: DateService,
        @inject(TOKENS.LocationService) private readonly locationService: LocationService,
    ) { }

    async execute(id_store: string, id_transaction: string): Promise<DayOperationDTO|null> {
      const dayOperations: DayOperation[] = await this.localDayOperationRepo.listDayOperations();
      const stores: Store[] = await this.localStoreRepo.retrieveStore([ id_store ]);
      const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(dayOperations);        
      const mapper: MapperDTO = new MapperDTO();
      let latitude: string|undefined = undefined;
      let longitude: string|undefined = undefined;
      let sellingDate:Date = new Date();
      let storeDate:Date = new Date();

      const coordinates:Coordinates|null = await this.locationService.getCurrentLocation()
      const sellingToClient: DayOperation[] = dayOperations.filter((dayOperation) => {
        return dayOperation.id_item === id_transaction && dayOperation.operation_type === DAY_OPERATIONS.route_transaction;
      });
      const createNewClientDayOperation: DayOperation[] = dayOperations.filter((dayOperation) => {
        return dayOperation.id_item === id_store && dayOperation.operation_type === DAY_OPERATIONS.new_client_registration;
      });

      if (coordinates == null) {
        latitude = undefined;
        longitude = undefined;
      } else {
        latitude = coordinates.latitude.toString();
        longitude = coordinates.longitude.toString();
      }

      /*
        Business rule:
          - A prospect of client is confirmed as a client until the second selling.
          - This selling must be made with one day of difference respected with 
          the creation of the store.
      */

      if(sellingToClient[0] !== undefined  // Verify sellings a route transaction for the confirmation.
        && stores[0] !== undefined // Verify the store exists
        && createNewClientDayOperation.length === 0 // Avoid duplication for create new client day operation.
      ) {
        const routeTransactionDayOperation = sellingToClient[0];
        const currentStore = stores[0];

        if (typeof routeTransactionDayOperation.created_at === "string") {
          sellingDate = new Date(
            routeTransactionDayOperation.created_at
          );
        } else {
          sellingDate = routeTransactionDayOperation.created_at;
        }
        
        if (typeof currentStore.creation_date === "string") {
          storeDate = new Date(currentStore.creation_date);
        } else {
          storeDate = currentStore.creation_date;
        }

        const sellingDateUTC = Date.UTC(
          sellingDate.getUTCFullYear(),
          sellingDate.getUTCMonth(),
          sellingDate.getUTCDate()
        );

        const storeDateUTC = Date.UTC(
          storeDate.getUTCFullYear(),
          storeDate.getUTCMonth(),
          storeDate.getUTCDate()
        );

        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
        const dayDifference = (sellingDateUTC - storeDateUTC) / oneDayInMilliseconds;

        if (dayDifference >= 1) {
          // Add day operation
          dayOperationAggregate.registerCreateNewClient(
            this.idService.generateID(),
            id_store,
            sellingToClient[0].id_route_day,
            new Date(this.dateService.getCurrentTimestamp()),
            latitude,
            longitude
          );
        }
      }
      
      // Persist all changes
      const newListdayOperations: DayOperation[] = dayOperationAggregate.getNewDayOperations() || [];

      await this.localDayOperationRepo.insertDayOperations(newListdayOperations);

      // Extract new day operation
      const newDayOperation = newListdayOperations.pop();        

      return newDayOperation ? mapper.toDTO(newDayOperation) : null;
    }
}


