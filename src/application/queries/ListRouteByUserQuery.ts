// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { RouteRepository } from "@/src/core/interfaces/RouteRepository";

// Entities
import { Route } from "@/src/core/entities/Route";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";

@injectable()
export class ListRouteByUserQuery {
    constructor(@inject(TOKENS.RouteRepository) private repo: RouteRepository) { }

    async execute(userId: string): Promise<Route[]> {
        return await this.repo.listRoutesByUser(userId);
    }
}