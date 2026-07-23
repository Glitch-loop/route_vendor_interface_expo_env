// Libraries
import { injectable, inject } from 'tsyringe'

// Aggregates
import { OperationDayAggregate } from '@/src/core/aggregates/OperationDayAggregate';

// Entitties
import { DayOperation } from '@/src/core/entities/DayOperation';

// Interfaces
import { IDService } from '@/src/core/interfaces/IDService';
import { DateService } from '@/src/core/interfaces/DateService';
import { LocationService } from '@/src/core/interfaces/LocationService';
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';

// Object values
import { Coordinates } from '@/src/core/object-values/Coordinates';

// DTOs & Mapper
import { MapperDTO } from '@/src/application/mappers/MapperDTO';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class VisitClientOutOfRouteUseCase {
  constructor(
      // Repositories
      @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,

      // Services
      @inject(TOKENS.IDService) private readonly idService: IDService,
      @inject(TOKENS.DateService) private readonly dateService: DateService,
      @inject(TOKENS.LocationService) private readonly locationService: LocationService,
  ) { }

  async execute(id_store: string, id_route_day: string, coords: Coordinates|null): Promise<DayOperationDTO|null> {
    const dayOperations: DayOperation[] = await this.localDayOperationRepo.listDayOperations();
    const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(dayOperations);        
    const mapper: MapperDTO = new MapperDTO();

    let latitude: string|undefined = undefined;
    let longitude: string|undefined = undefined;

    // Retrieving cords
    if (coords === null) {
      const coordinates:Coordinates|null = await this.locationService.getCurrentLocation();
      if (coordinates == null) {
        latitude = undefined;
        longitude = undefined;
      } else {
        latitude = coordinates.latitude.toString();
        longitude = coordinates.longitude.toString();
      }
    } else {
      latitude = coords.latitude.toString();
      longitude = coords.longitude.toString();
    }

    // Add day operation
    dayOperationAggregate.registerClientAttentionOutOfRoute(
        this.idService.generateID(),
        id_store,
        id_route_day,
        new Date(this.dateService.getCurrentTimestamp()),
        latitude,
        longitude
    );

    // Persist all changes
    const newListdayOperations: DayOperation[] = dayOperationAggregate.getNewDayOperations() || [];

    await this.localDayOperationRepo.insertDayOperations(newListdayOperations);

    // Extract new day operation
    const newDayOperation = newListdayOperations.pop();        

    return newDayOperation ? mapper.toDTO(newDayOperation) : null;
  }
}