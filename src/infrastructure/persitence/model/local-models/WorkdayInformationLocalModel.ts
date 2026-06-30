import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface WorkDayInformationLocalModel extends ReplicationDataInterface {
    // Fields required for starting a work day.
    id_work_day: string,
    start_date: string,
    finish_date: string,
    start_petty_cash: number,
    final_petty_cash: number | null,
    id_route: string,
    route_name: string,
    description: string | null,
    route_status: string,
    id_day: string,
    id_user: string,
    id_route_day: string,
}
