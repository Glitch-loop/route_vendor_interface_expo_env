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

@injectable()
export default class VisitClientOutOfRouteUseCase {
    constructor(
        // Repositories
        @inject(TOKENS.SQLiteDayOperationRepository) private readonly localDayOperationRepo: DayOperationRepository,

        // Services
        @inject(TOKENS.IDService) private readonly idService: IDService,
        @inject(TOKENS.DateService) private readonly dateService: DateService,
    ) { }

    async execute(id_store: string):Promise<DayOperationDTO|null> {
        console.log("Visit client out of route use case. Store id: ", id_store)
        const dayOperations: DayOperation[] = await this.localDayOperationRepo.listDayOperations();
        const dayOperationAggregate: OperationDayAggregate = new OperationDayAggregate(dayOperations);        
        const mapper: MapperDTO = new MapperDTO();

        // Add day operation
        dayOperationAggregate.registerClientAttentionOutOfRoute(
            this.idService.generateID(),
            id_store,
            new Date(this.dateService.getCurrentTimestamp())
        );

        
        // Persist all changes
        const newListdayOperations: DayOperation[] = dayOperationAggregate.getNewDayOperations() || [];

        await this.localDayOperationRepo.insertDayOperations(newListdayOperations);

        // Extract new day operation
        const newDayOperation = newListdayOperations.pop();        

        return newDayOperation ? mapper.toDTO(newDayOperation) : null;
    }
}