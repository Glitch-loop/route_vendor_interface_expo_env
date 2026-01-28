// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { RouteTransactionRepository } from '@/src/core/interfaces/RouteTransactionRepository';

// Entities
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';
import { Store } from '@/src/core/entities/Store';

// DTOs & Mapper
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import StoreDTO from '@/src/application/dto/StoreDTO';
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
    // Repository only uses id_store; fill other fields with safe defaults
    const storeEntity = new Store(
      store.id_store,
      store.street,
      store.ext_number ?? null,
      store.colony,
      store.postal_code,
      store.address_reference ?? null,
      store.store_name ?? null,
      null, // owner_name not present in DTO
      null, // cellphone not present in DTO
      store.latitude,
      store.longitude,
      '', // id_creator (not needed for this query)
      store.creation_date,
      '', // creation_context (not needed for this query)
      store.status_store,
    );

    const transactions: RouteTransaction[] = await this.routeTxRepo.listRouteTransactionByStore(storeEntity);
    return transactions.map((t) => this.mapperDTO.toDTO(t));
  }
}
