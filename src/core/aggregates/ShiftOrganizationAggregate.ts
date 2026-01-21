import { WorkDayInformation } from "@/src/core/entities/WorkDayInformation";
import { INVENTORY_OPREATION_STATE } from "../enums/InventoryOperationState";


export class ShiftOrganizationAggregate {
    private _workDayInformation: WorkDayInformation|null = null;

    constructor(
         workDayInformation: WorkDayInformation|null
    ) {
        this._workDayInformation = workDayInformation;
    }

    startWorkDay(
        idWorkDay: string, 
        initialDate: Date,
        startPettyCash: number, 
        id_route: string,
        route_name: string,
        description: string,
        route_status: boolean,
        id_day: string,
        id_route_day: string,
    ): void {
        
        if (startPettyCash < 0) throw new Error("Petty cash cannot be negative.");
        if (route_status === false) throw new Error("Route must be active to start a work day.");

        const newWorkDay: WorkDayInformation = new WorkDayInformation(
            idWorkDay,
            initialDate,
            null,
            startPettyCash,
            null,
            id_route,
            route_name,
            description,
            route_status,
            id_day,
            id_route_day,
        );

        this._workDayInformation = newWorkDay;
    }

    finishWorkDay(finalPettyCash:number, finalDate: Date): void {

        if (!this._workDayInformation) throw new Error("Work day information is not set.");

        const { start_petty_cash, start_date } = this._workDayInformation;



        if (finalPettyCash < 0) throw new Error("Petty cash cannot be negative.");
        if (finalPettyCash < start_petty_cash) throw new Error("Final petty cash cannot be less than initial petty cash.");

        if (finalDate <= start_date) throw new Error("Finish date must be after start date.");

        const finishedWorkDay: WorkDayInformation = new WorkDayInformation(
            this._workDayInformation.id_work_day,
            this._workDayInformation.start_date,
            finalDate,
            this._workDayInformation.start_petty_cash,
            finalPettyCash,
            this._workDayInformation.id_route,
            this._workDayInformation.route_name,
            this._workDayInformation.description,
            this._workDayInformation.route_status,
            this._workDayInformation.id_day,
            this._workDayInformation.id_route_day,
        );

        this._workDayInformation = finishedWorkDay;
    }

    getWorkDayInformation(): WorkDayInformation {
        if (!this._workDayInformation) throw new Error("Work day information is not set.");
        return this._workDayInformation;
    }
}