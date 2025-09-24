import { WorkDayInformation } from '../entities/WorkDayInformation';
import { DayOperation } from '../entities/DayOperation';

export abstract class IShiftOrganization {
  abstract insertWorkDay(workDay: WorkDayInformation): void;
  abstract deleteWorkDay(workDay: WorkDayInformation): void;
  abstract updateWorkDay(workDay: WorkDayInformation): void;
  abstract listWorkDays(): WorkDayInformation[];
  abstract insertDayOperations(day_operations: DayOperation[]): void;
  abstract updateDayOperation(day_operation: DayOperation): void;
  abstract listDayOperations(): DayOperation[];
  abstract deleteAllDayOperations(day_operations: DayOperation[]): void;
}