// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { RouteRepository } from "@/src/core/interfaces/RouteRepository";

// Onject values
import { Day } from "@/src/core/object-values/Day";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";

@injectable()
export class GetAllDaysQuery {
    constructor(@inject(TOKENS.RouteRepository) private repo: RouteRepository) { }

    async execute(): Promise<Day[]> {
        return await this.repo.listDays();
    }
}