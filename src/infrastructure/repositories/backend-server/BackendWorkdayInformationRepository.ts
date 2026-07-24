// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource'; 

// Interfaces
import { SyncServerWorkdayInformationRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerWorkdayInformationRepository';

// Models
import WorkDayInformationServerModel from '@/src/infrastructure/persitence/model/server-models/WorkdayInformationServerModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class BackendWorkdayInformationRepository implements SyncServerWorkdayInformationRepository {
  constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) { }

  async upsertWorkdayInformations(informations: (WorkDayInformationServerModel)[], ): Promise<void> {
    if (!informations || informations.length === 0) return;
    try {
      const workdayToUpsert = informations[0];
      if(workdayToUpsert.finish_date === null && workdayToUpsert.final_petty_cash === null) {
        // console.log("Start day")
        await this.dataSource.post<WorkDayInformationServerModel, WorkDayInformationServerModel>(
          '/business-operation-route/work-days',
          workdayToUpsert
        );
      } else {
        // console.log("Finsih day")
        await this.dataSource.patch<WorkDayInformationServerModel, WorkDayInformationServerModel>(
          `/business-operation-route/work-days/${workdayToUpsert.id_work_day}`,
          workdayToUpsert
        );
      }
    } catch (error: any) {
      throw new Error(`Failed to upsert workday information: ${error.message}`);
    }
  }
}