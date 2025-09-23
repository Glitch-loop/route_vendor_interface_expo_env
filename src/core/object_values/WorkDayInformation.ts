export class WorkDayInformation {
  constructor(
    public readonly id_work_day: string,
    public readonly start_date: number,
    public readonly finish_date: number | null,
    public readonly start_petty_cash: boolean | null,
    public readonly final_petty_cash: boolean | null
  ) {}
}