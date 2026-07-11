import WorkDayInformationLocalModel from '@/src/infrastructure/persitence/model/local-models/WorkdayInformationLocalModel';

export function isWorkDayInformationLocalModel(model: unknown): model is WorkDayInformationLocalModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_work_day' in model && typeof model.id_work_day === 'string' &&
        'start_date' in model && typeof model.start_date === 'string' &&
        'finish_date' in model && (typeof model.finish_date === 'string' || model.finish_date === null) &&
        'start_petty_cash' in model && typeof model.start_petty_cash === 'number' &&
        'final_petty_cash' in model && (typeof model.final_petty_cash === 'number' || model.final_petty_cash === null) &&
        'id_route' in model && typeof model.id_route === 'string' &&
        'route_name' in model && typeof model.route_name === 'string' &&
        'description' in model && (typeof model.description === 'string' || model.description === null) &&
        'route_status' in model && typeof model.route_status === 'string' &&
        'id_day' in model && typeof model.id_day === 'string' &&
        'id_user' in model && typeof model.id_day === 'string' &&
        'id_route_day' in model && typeof model.id_route_day === 'string'
    );
}
