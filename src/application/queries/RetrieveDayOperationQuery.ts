// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';

// Entities
import { DayOperation } from '@/src/core/entities/DayOperation';

// DTOs & Mapper
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class RetrieveDayOperationQuery {
	constructor(
		@inject(TOKENS.SQLiteDayOperationRepository)
		private readonly dayOpRepo: DayOperationRepository,
		private readonly mapperDTO: MapperDTO,
	) {}

	// Returns all day operations mapped to DTOs
	async execute(): Promise<DayOperationDTO[]> {
		const operations: DayOperation[] = await this.dayOpRepo.listDayOperations();
		return operations.map(op => this.mapperDTO.toDTO(op));
	}
}

