
export interface WorkDayInformationDTO {
    id_work_day: string;
    start_date: Date,
    finish_date: Date | null,
    start_petty_cash: number,
    final_petty_cash: number | null,
    id_route: string,
    route_name: string,
    description: string,
    route_status: boolean,
    id_day: string,
    id_route_day: string,
}