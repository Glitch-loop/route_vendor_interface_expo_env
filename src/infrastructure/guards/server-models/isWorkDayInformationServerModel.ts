import WorkDayInformationServerModel from '@/src/infrastructure/persitence/model/server-models/WorkdayInformationServerModel';

export function isWorkDayInformationServerModel(model: unknown): model is WorkDayInformationServerModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_work_day' in model && typeof model.id_work_day === 'string' &&
        'start_date' in model && typeof model.start_date === 'string' &&
        'start_petty_cash' in model && typeof model.start_petty_cash === 'number' &&
        'id_route_day' in model && typeof model.id_route_day === 'string' &&
        'id_user' in model && typeof model.id_user === 'string' &&
        'finish_date' in model && (typeof model.finish_date === 'string' || model.finish_date === null) &&
        'final_petty_cash' in model && (typeof model.final_petty_cash === 'number' || model.final_petty_cash === null)
    );
}
