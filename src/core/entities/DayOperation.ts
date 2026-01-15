// Enums
import { ShiftDayOperations } from "@/src/core/enums/ShiftDayOperations";

export class DayOperation {
  constructor(
    public readonly id_day_operation: string,
    public readonly id_item: string,
    public readonly operation_type: ShiftDayOperations,
    public readonly created_at: Date
  ) {}
}