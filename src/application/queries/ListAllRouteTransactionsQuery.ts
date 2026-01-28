// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository';

// Entities
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';

// DTOs & Mapper
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class ListAllRouteTransactionsQuery {
  constructor(
    @inject(TOKENS.SQLiteRouteTransactionRepository)
    private readonly routeTxRepo: RouteTransactionRepository,
    private readonly mapperDTO: MapperDTO,
  ) {}

  async execute(): Promise<RouteTransactionDTO[]> {
    const transactions: RouteTransaction[] = await this.routeTxRepo.listRouteTransactions();
    return transactions.map((t) => this.mapperDTO.toDTO(t));
  }
}
