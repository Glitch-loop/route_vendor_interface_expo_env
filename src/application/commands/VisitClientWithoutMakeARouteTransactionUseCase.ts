// Libraries
import { inject, injectable } from "tsyringe";

// Entites
import { DayOperation } from "@/src/core/entities/DayOperation";

// Object values
import { Coordinates } from "@/src/core/object-values/Coordinates";

// DTOs
import { MapperDTO } from "@/src/application/mappers/MapperDTO";
import DayOperationDTO from "@/src/application/dto/DayOperationDTO";

// Interfaces
import { DayOperationRepository } from "@/src/core/interfaces/DayOperationRepository";
import { LocationService } from "@/src/core/interfaces/LocationService";
import { IDService } from "@/src/core/interfaces/IDService";
import { DateService } from "@/src/core/interfaces/DateService";

// Aggregates
import { OperationDayAggregate } from "@/src/core/aggregates/OperationDayAggregate";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";

@injectable()
export default class VisitClientWithoutMakeARouteTransactionUseCase {
  constructor(
    @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,

    // Services
    @inject(TOKENS.IDService) private readonly idService: IDService,
    @inject(TOKENS.DateService) private readonly dateService: DateService,
    @inject(TOKENS.LocationService) private readonly locationService: LocationService,
  ) { }

  async execute(
    id_store: string,
    id_day_operation_dependent: string,
    id_route_day: string,
  ): Promise<DayOperationDTO|null> {
    const dayOperations: DayOperation[] = await this.localDayOperationRepo.listDayOperations();
    const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(dayOperations);
    const mapper: MapperDTO = new MapperDTO();
    let latitude: string | undefined = undefined;
    let longitude: string | undefined = undefined;

    const coordinates: Coordinates | null = await this.locationService.getCurrentLocation();

    if(coordinates !== null) {
      latitude = coordinates.latitude.toString();
      longitude = coordinates.longitude.toString();
    }

    /*
      Note (06-22-26):
      
      The reason why there is not a protection to avoid register many times a visit to client
      is because in a day, it is possible to visit a client twice:

      A practical example could be when a user go to a client to attend then the client
      asks an order and when the vendor finishes the route he pass again to deliver the
      order.
    */

    // Add day operation
    dayOperationAggregate.registerVisitToClient(
        this.idService.generateID(),
        id_store,
        id_route_day,
        new Date(this.dateService.getCurrentTimestamp()),
        id_day_operation_dependent,
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