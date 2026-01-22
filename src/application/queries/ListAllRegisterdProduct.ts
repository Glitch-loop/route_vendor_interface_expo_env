// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { ProductRepository } from '@/src/core/interfaces/ProductRepository';

// Entities
import { Product } from '@/src/core/entities/Product';

// DTOs & Mapper
import ProductDTO from '@/src/application/dto/ProductDTO';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class ListAllRegisterdProduct {
  constructor(
    @inject(TOKENS.SQLiteProductRepository) private readonly productRepository: ProductRepository,
    private readonly mapperDTO: MapperDTO
  ) {}

  async execute(): Promise<ProductDTO[]> {
    const products: Product[] = await this.productRepository.retrieveAllProducts();
    return products.map((p) => this.mapperDTO.toDTO(p));
  }
}
