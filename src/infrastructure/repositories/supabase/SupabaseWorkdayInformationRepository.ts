// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource'; 

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

import { SyncServerWorkdayInformationRepository } from '../../persitence/interface/server-database/SyncServerWorkdayInformationRepository';
import WorkDayInformationModel from '@/src/infrastructure/persitence/model/WorkdayInformationModel';


@injectable()
export class SupabaseWorkdayInformationRepository implements SyncServerWorkdayInformationRepository {
    constructor(@inject(TOKENS.SupabaseDataSource) private readonly dataSource: SupabaseDataSource) { }

    private get supabase() {
        return this.dataSource.getClient();
    }

    async upsertWorkdayInformations(informations: WorkDayInformationModel[]): Promise<void> {
        if (!informations || informations.length === 0) return;
        try {
            const records = informations.map((info) => ({
                id_work_day: info.id_work_day,
                start_date: info.start_date,
                end_date: info.finish_date,
                start_petty_cash: info.start_petty_cash,
                end_petty_cash: info.final_petty_cash,
                id_route: info.id_route,
                route_name: info.route_name,
                description: info.description,
                route_status: info.route_status,
                id_day: info.id_day,
                id_route_day: info.id_route_day,
            }));

            const { error } = await this.supabase
                .from('route_day')
                .upsert(records, { onConflict: 'id_work_day' });

            if (error) throw new Error(`Error upserting workday information: ${error.message}`);
        } catch (error: any) {
            throw new Error(`Failed to upsert workday information: ${error.message}`);
        }
    }
}