// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource'; 

// Interfaces
import { SyncServerWorkdayInformationRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerWorkdayInformationRepository';

// Models
import WorkDayInformationModel from '@/src/infrastructure/persitence/model/WorkdayInformationModel';
import UserModel from '@/src/infrastructure/persitence/model/UserModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { SERVER_DATABASE_ENUM } from '@/src/infrastructure/persitence/enums/serverTablesEnum';


@injectable()
export class SupabaseWorkdayInformationRepository implements SyncServerWorkdayInformationRepository {
    constructor(@inject(TOKENS.SupabaseDataSource) private readonly dataSource: SupabaseDataSource) { }

    private get supabase() {
        return this.dataSource.getClient();
    }

    async upsertWorkdayInformations(informations: (WorkDayInformationModel & UserModel)[], ): Promise<void> {
        if (!informations || informations.length === 0) return;
        try {
            console.log("Information to upsert: ", informations)
            const records = informations.map((info) => ({
                id_work_day: info.id_work_day,
                start_date: info.start_date,
                finish_date: info.finish_date,
                start_petty_cash: info.start_petty_cash,
                final_petty_cash: info.final_petty_cash,
                id_route: info.id_route,
                id_route_day: info.id_route_day,
                id_vendor: info.id_vendor,
                id_commission: null, // Business rule: This field is assigned by the manager's system
                comment: null
            }));
            console.log("Upserting workday information to server: ", records);
            const { error } = await this.supabase
                .from(SERVER_DATABASE_ENUM.WORK_DAYS)
                .upsert(records, { onConflict: 'id_work_day' });

            if (error) throw new Error(`Error upserting workday information: ${error.message}`);
        } catch (error: any) {
            throw new Error(`Failed to upsert workday information: ${error.message}`);
        }
    }
}