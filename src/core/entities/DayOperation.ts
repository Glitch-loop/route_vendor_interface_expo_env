export class DayOperation {
  constructor(
    public readonly id_day_operation: string,
    public readonly id_item: string,
    public readonly id_type_operation: string,
    public readonly operation_order: number,
    public readonly current_operation: number,
    public readonly method: string
  ) {}
}