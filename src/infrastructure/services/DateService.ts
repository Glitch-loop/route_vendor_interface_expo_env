// Interfaces
import { DateService as IDateService } from '@/src/core/interfaces/DateService';
import { injectable } from 'tsyringe';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';


dayjs.extend(utc);
dayjs.extend(timezone);

@injectable()
export class DateService implements IDateService {
	getCurrentTimestamp(): number {
		
		console.log("Get time: ", dayjs().tz('America/Mexico_City').valueOf());
		return dayjs().tz('America/Mexico_City').valueOf();
	}
}
