// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository';
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';

// Entities
import { DayOperation } from '@/src/core/entities/DayOperation';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';

// Aggregates
import { OperationDayAggregate } from '@/src/core/aggregates/OperationDayAggregate';

// DTOs & Mapper
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class DetermineCurrentInventoryOperation {
  constructor(
    @inject(TOKENS.SQLiteRouteTransactionRepository) private readonly routeTxRepo: RouteTransactionRepository,
    @inject(TOKENS.SQLiteDayOperationRepository) private readonly dayOpRepo: DayOperationRepository,
    private readonly mapperDTO: MapperDTO,
  ) {}

  async execute(): Promise<DayOperationDTO | null> {
    // Retrieve all day operations and route transactions for the current day
    const dayOperations: DayOperation[] = await this.dayOpRepo.listDayOperations();
    const routeTransactions: RouteTransaction[] = await this.routeTxRepo.listRouteTransactions();

    if (!dayOperations || dayOperations.length === 0) {
      return null;
    }

    // Create an aggregate to determine the current operation
    const operationAggregate = new OperationDayAggregate(dayOperations, routeTransactions);

    // Get all day operations from the aggregate
    const dayOpsFromAggregate = operationAggregate.getDayOperations();
    
    if (!dayOpsFromAggregate || dayOpsFromAggregate.length === 0) {
      return null;
    }

    // The current operation is the last one in the array
    const currentOperation = dayOpsFromAggregate[dayOpsFromAggregate.length - 1];

    return this.mapperDTO.toDTO(currentOperation);
  }
}
