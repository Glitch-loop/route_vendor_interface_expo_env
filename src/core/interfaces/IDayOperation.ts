import { DayOperation } from '../entities/DayOperation';

export abstract class IDayOperation {
    abstract insertDayOperations(day_operations: DayOperation[]): void;
    abstract updateDayOperation(day_operation: DayOperation): void;
    abstract listDayOperations(): DayOperation[];
    abstract deleteDayOperatons(day_operations: DayOperation[]): void;
}