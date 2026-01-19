import { WorkDayInformation } from '../entities/WorkDayInformation';
import { DayOperation } from '../entities/DayOperation';

export abstract class ShiftOrganizationRepository {
  abstract insertWorkDay(workDay: WorkDayInformation): void;
  abstract deleteWorkDay(workDay: WorkDayInformation): void;
  abstract updateWorkDay(workDay: WorkDayInformation): void;
  abstract listWorkDays(): Promise<WorkDayInformation[]>;
}