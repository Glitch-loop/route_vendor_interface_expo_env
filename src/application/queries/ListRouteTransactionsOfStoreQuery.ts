// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository';

// Entities
import { Store } from '@/src/core/entities/Store';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';

// DTOs & Mapper
import StoreDTO from '@/src/application/dto/StoreDTO';
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class ListRouteTransactionsOfStoreQuery {
  constructor(
    @inject(TOKENS.SQLiteRouteTransactionRepository)
    private readonly routeTxRepo: RouteTransactionRepository,
    private readonly mapperDTO: MapperDTO,
  ) {}

  // Accepts StoreDTO to align with UI usage (storeMenuLayout)
  async execute(store: StoreDTO): Promise<RouteTransactionDTO[]> {    
    const transactions: RouteTransaction[] = await this.routeTxRepo.listRouteTransactionByStore(this.mapperDTO.toEntity(store));
    return transactions.map((t) => this.mapperDTO.toDTO(t));
  }
}
