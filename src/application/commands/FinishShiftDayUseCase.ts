import { LocalDatabaseService } from "@/src/core/interfaces/LocalDatabaseService";
import { TOKENS } from "@/src/infrastructure/di/tokens";
import { inject, injectable } from "tsyringe";


@injectable()
export default class FinishShiftDayUseCase {
    constructor(
        @inject(TOKENS.LocalDatabaseService) private readonly  LocalDatabaseService: LocalDatabaseService
    ) { }

    async execute(): Promise<void> {
        // TODO: Verify anything is synced before cleaning the database
        // TODO: In case of imposible synchronization, provide a way to export the local database for manual synchronization
        await this.LocalDatabaseService.cleanDatabase();

    }
}