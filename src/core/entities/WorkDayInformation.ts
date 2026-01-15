export class WorkDayInformation {
  constructor(
    public readonly id_work_day: string,
    public readonly start_date: Date,
    public readonly finish_date: Date | null,
    public readonly start_petty_cash: number,
    public readonly final_petty_cash: number | null,
    public readonly id_route: string,
    public readonly route_name: string,
    public readonly description: string,
    public readonly route_status: string,
    public readonly id_day: string,
    public readonly id_route_day: string,
  ) {}
}