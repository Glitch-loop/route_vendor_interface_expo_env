export class WorkDayInformation {
  constructor(
    public readonly id_work_day: string,
    public readonly start_date: Date,
    public readonly finish_date: Date | null,
    public readonly start_petty_cash: number,
    public readonly final_petty_cash: number | null
  ) {}
}