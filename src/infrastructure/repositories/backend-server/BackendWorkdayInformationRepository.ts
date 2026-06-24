// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource'; 

// Interfaces
import { SyncServerWorkdayInformationRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerWorkdayInformationRepository';

// Models
import UserModel from '@/src/infrastructure/persitence/model/server-models/UserModel';
import WorkDayInformationServerModel from '@/src/infrastructure/persitence/model/server-models/WorkdayInformationServerModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';


interface StartWorkDayRequestInterface {
    id_work_day?: string;
    start_date: string;
    start_petty_cash: number;
    id_route_day: string;
    id_user: string;
}

interface WorkDayResponseInterface {
    id_work_day: string;
    start_date: string;
    start_petty_cash: number;
    id_route_day: string;
    id_user: string;
    finish_date?: string | null;
    final_petty_cash?: number | null;
}


@injectable()
export class BackendWorkdayInformationRepository implements SyncServerWorkdayInformationRepository {
    constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) { }

    async upsertWorkdayInformations(informations: (WorkDayInformationServerModel)[], ): Promise<void> {
        if (!informations || informations.length === 0) return;
        try {
            console.log("Work day records: ", informations.length)
            const workdayToUpsert = informations[0]

            if(workdayToUpsert.finish_date === null && workdayToUpsert.final_petty_cash === null) {
                await this.dataSource.post<WorkDayInformationServerModel, StartWorkDayRequestInterface>(
                    '/business-operation-route/work-days',
                    workdayToUpsert
                );
            } else {
                await this.dataSource.patch<WorkDayInformationServerModel, StartWorkDayRequestInterface>(
                    `/business-operation-route/work-days/${workdayToUpsert.id_work_day}`,
                    workdayToUpsert
                );
            }
        } catch (error: any) {
            throw new Error(`Failed to upsert workday information: ${error.message}`);
        }
    }
}