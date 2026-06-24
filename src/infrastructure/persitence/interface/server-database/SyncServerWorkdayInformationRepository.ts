import UserModel from "@/src/infrastructure/persitence/model/server-models/UserModel";
import WorkDayInformationServerModel from "@/src/infrastructure/persitence/model/server-models/WorkdayInformationServerModel";

export abstract class SyncServerWorkdayInformationRepository {
    abstract upsertWorkdayInformations(informations: (WorkDayInformationServerModel)[]): Promise<void>;
}