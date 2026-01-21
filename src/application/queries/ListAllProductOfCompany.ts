// Library
import {inject, injectable} from "tsyringe";

// Interfaces
import { ProductRepository } from "@/src/core/interfaces/ProductRepository";

// Entities
import { Product } from "@/src/core/entities/Product";

// Mapper DTO
import ProductDTO from "@/src/application/dto/ProductDTO";
import { MapperDTO } from "@/src/application/mappers/MapperDTO";

// utils
import { TOKENS } from "@/src/infrastructure/di/tokens";

@injectable()
export default class ListAllProductOfCompany {
    constructor (
        @inject(TOKENS.SupabaseProductRepository) private productRepository: ProductRepository,
        private mapperDTO: MapperDTO
    ) {}

    async execute(): Promise<ProductDTO[]> {
        const availableProducts: Product[] = await this.productRepository.retrieveAllProducts();
        return availableProducts.map((product) => this.mapperDTO.toDTO(product))
    }
}