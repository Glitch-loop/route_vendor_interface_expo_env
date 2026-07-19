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
import { StoreClientAggregate } from '@/src/core/aggregates/StoreClientAggregate';
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';
import RouteTransactionDescriptionDTO from '../dto/RouteTransactionDescriptionDTO';

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

    // Mapper
      private readonly mapperDTO: MapperDTO,
  ) { }

  async executeUseCase(id_store: string, id_transaction: string, sellingRouteTransactionDescription: RouteTransactionDescription[]): Promise<boolean|null> {
    
    for (const selling of sellingRouteTransactionDescription) {
      if (selling.id_transaction_operation_type !== DAY_OPERATIONS.sales) 
        throw new Error('For confirming a prospect of client, all of the transaction descriptions must be of type sale.')
    }
    
    let latitude: string|undefined = undefined;
    let longitude: string|undefined = undefined;
    let sellingDate:Date = new Date();

    const dayOperations: DayOperation[] = await this.localDayOperationRepo.listDayOperations();
    const stores: Store[] = await this.localStoreRepo.retrieveStore([ id_store ]);
    
    const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(dayOperations);        

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

      const storeAggregate:StoreClientAggregate = new StoreClientAggregate(currentStore);

      if (typeof routeTransactionDayOperation.created_at === "string") {
        sellingDate = new Date(
          routeTransactionDayOperation.created_at
        );
      } else {
        sellingDate = routeTransactionDayOperation.created_at;
      }
      
      if (storeAggregate.confirmClientRegistration(sellingDate)) {
        if (sellingRouteTransactionDescription.length === 0) {
          return false;
        }

        // Add day operation
        dayOperationAggregate.registerCreateNewClient(
          this.idService.generateID(),
          id_store,
          sellingToClient[0].id_route_day,
          id_transaction,
          new Date(this.dateService.getCurrentTimestamp()),
          latitude,
          longitude
        );

        // Persist all changes
        console.log("Client confirmed: ", storeAggregate.getStoreClient());
        await this.localStoreRepo.updateStore(storeAggregate.getStoreClient());
        const newListdayOperations: DayOperation[] = dayOperationAggregate.getNewDayOperations() || [];
        await this.localDayOperationRepo.insertDayOperations(newListdayOperations);
        
        // Extract new day operation
        const newDayOperation = newListdayOperations.pop();        
        return true;
      }
    }

    return null;
  }

  async execute(id_store: string, id_transaction: string, sellingRouteTransactionDescription: RouteTransactionDescriptionDTO[]): Promise<boolean|null> {
    return await this.executeUseCase(id_store, id_transaction, sellingRouteTransactionDescription.map((transactionDescription) => this.mapperDTO.toEntity(transactionDescription)));
  }
}


