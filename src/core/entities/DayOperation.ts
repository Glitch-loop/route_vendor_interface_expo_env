// Enums
import { DAY_OPERATIONS } from "@/src/core/enums/DayOperations";

export class DayOperation {
  constructor(
    public readonly id_day_operation: string,
    public readonly id_item: string,
    public readonly id_route_day: string,
    public readonly operation_type: DAY_OPERATIONS,
    public readonly created_at: Date,
    public readonly id_dependency: string | null,
    public readonly latitude: string | undefined,
    public readonly longitude: string | undefined,
  ) {}
}