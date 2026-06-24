import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface WorkDayInformationModel extends ReplicationDataInterface {
    // Fields required for starting a work day.
    id_work_day: string;
    start_date: string,
    start_petty_cash: number,
    id_route_day: string,
    id_user: string,
    
    // Fields required for finishing a work day.
    finish_date: string | null,
    final_petty_cash: number | null,
}
