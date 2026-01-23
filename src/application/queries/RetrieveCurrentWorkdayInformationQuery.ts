// Library
import { inject, injectable } from 'tsyringe';

// Interfaces
import { ShiftOrganizationRepository } from '@/src/core/interfaces/ShiftOrganizationRepository';

// Entities
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';

// DTOs & Mapper
import WorkDayInformationDTO from '@/src/application/dto/WorkdayInformationDTO';
import { MapperDTO } from '@/src/application/mappers/MapperDTO';

// DI Tokens
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export default class RetrieveCurrentWorkdayInformationQuery {
	constructor(
		@inject(TOKENS.SQLiteShiftOrganizationRepository)
		private readonly shiftRepo: ShiftOrganizationRepository,
		private readonly mapperDTO: MapperDTO,
	) {}

	// Returns the current (open) work day information mapped to DTO
	async execute(): Promise<WorkDayInformationDTO | null> {
		const workDays: WorkDayInformation[] = await this.shiftRepo.listWorkDays();
		if (!workDays || workDays.length === 0) return null;

		// Define "current" as the most recent work day without a finish_date
		const openDays = workDays.filter(wd => wd.finish_date === null);
		const current = (openDays.length > 0)
			? openDays.sort((a, b) => b.start_date.getTime() - a.start_date.getTime())[0]
			: workDays.sort((a, b) => b.start_date.getTime() - a.start_date.getTime())[0];

		return this.mapperDTO.toDTO(current);
	}
}

