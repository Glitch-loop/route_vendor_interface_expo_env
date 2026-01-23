// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';

// Entities
import { ProductInventory } from '@/src/core/entities/ProductInventory';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';

@injectable()
export default class RetrieveCurrentShiftInventoryQuery {
  constructor(
    @inject(TOKENS.SQLiteProductInventoryRepository)
    private readonly inventoryRepo: ProductInventoryRepository,
    private readonly mapperDTO: MapperDTO,
  ) {}

  // Returns domain entities for internal orchestration/use cases
  async execute(): Promise<ProductInventoryDTO[]> {
    const productInventory: ProductInventory[] = await this.inventoryRepo.retrieveInventory();
    return productInventory.map((pi) => this.mapperDTO.toDTO(pi));
  }
}
