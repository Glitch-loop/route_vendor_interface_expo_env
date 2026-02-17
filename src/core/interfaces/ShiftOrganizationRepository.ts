import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';

export abstract class ShiftOrganizationRepository {
  abstract insertWorkDay(workDay: WorkDayInformation): void;
  abstract deleteWorkDay(workDay: WorkDayInformation): void;
  abstract updateWorkDay(workDay: WorkDayInformation): void;
  abstract listWorkDays(): Promise<WorkDayInformation[]>;
}