// Enums
import { DAY_OPERATIONS } from "@/src/core/enums/DayOperations";

export class DayOperation {
  constructor(
    public readonly id_day_operation: string,
    public readonly id_item: string,
    public readonly operation_type: DAY_OPERATIONS,
    public readonly created_at: Date
  ) {}
}