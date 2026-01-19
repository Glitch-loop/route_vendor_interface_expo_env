import { DayOperation } from '../entities/DayOperation';

export abstract class DayOperationRepository {
    abstract insertDayOperations(day_operations: DayOperation[]): void;
    abstract updateDayOperation(day_operation: DayOperation): void;
    abstract listDayOperations(): Promise<DayOperation[]>;
    abstract deleteDayOperatons(day_operations: DayOperation[]): void;
}