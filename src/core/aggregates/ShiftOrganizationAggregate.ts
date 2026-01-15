import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";

export class ShiftOrganizationAggregate {
    private _workDayInformation: WorkDayInformation;

    constructor(
        public readonly workDayInformation: WorkDayInformation
    ) {
        this._workDayInformation = workDayInformation;
    }

    startWorkDay(idWorkDay: string, startPettyCash: number, initialDate: Date): void {

        if (startPettyCash < 0) throw new Error("Petty cash cannot be negative.");

        const newWorkDay: WorkDayInformation = new WorkDayInformation(
            idWorkDay,
            initialDate,
            null,
            startPettyCash,
            null
        );

        this._workDayInformation = newWorkDay;
    }

    finishWorkDay(finalPettyCash:number, finalDate: Date): void {
        const { start_petty_cash, start_date } = this._workDayInformation;



        if (finalPettyCash < 0) throw new Error("Petty cash cannot be negative.");
        if (finalPettyCash < start_petty_cash) throw new Error("Final petty cash cannot be less than initial petty cash.");

        if (finalDate <= start_date) throw new Error("Finish date must be after start date.");

        const finishedWorkDay: WorkDayInformation = new WorkDayInformation(
            this._workDayInformation.id_work_day,
            this._workDayInformation.start_date,
            finalDate,
            this._workDayInformation.start_petty_cash,
            finalPettyCash
        );

        this._workDayInformation = finishedWorkDay;
    }

    getWorkDayInformation(): WorkDayInformation {
        return this._workDayInformation;
    }
}