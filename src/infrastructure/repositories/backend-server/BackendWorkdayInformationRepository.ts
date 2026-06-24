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

    async upsertWorkdayInformations(informations: (WorkDayInformationServerModel & UserModel)[], ): Promise<void> {
        if (!informations || informations.length === 0) return;
        try {
            for (const info of informations) {
                const request: StartWorkDayRequestInterface = this.toStartWorkDayRequest(info);
                await this.dataSource.post<WorkDayResponseInterface, StartWorkDayRequestInterface>(
                    '/business-operation-route/work-days',
                    request
                );
            }
        } catch (error: any) {
            throw new Error(`Failed to upsert workday information: ${error.message}`);
        }
    }

    private toStartWorkDayRequest(info: WorkDayInformationServerModel & UserModel): StartWorkDayRequestInterface {
        return {
            id_work_day: info.id_work_day,
            start_date: info.start_date,
            start_petty_cash: info.start_petty_cash,
            id_route_day: info.id_route_day,
            id_user: info.id_vendor,
        };
    }
}