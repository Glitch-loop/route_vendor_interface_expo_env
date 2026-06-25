// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { StoreRepository } from '@/src/core/interfaces/StoreRepository';

// Entities
import { Store } from '@/src/core/entities/Store';

// DTOs & Mapper
import StoreDTO from '@/src/application/dto/StoreDTO';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class ListAllRegisterdStoresQuery {
	constructor(
		@inject(TOKENS.SQLiteStoreRepository) private readonly storeRepository: StoreRepository,
		private readonly mapperDTO: MapperDTO
	) {}

	async execute(): Promise<StoreDTO[]> {
		const stores: Store[] = await this.storeRepository.listStores();
		return stores.map((s) => this.mapperDTO.toDTO(s));
	}
}

