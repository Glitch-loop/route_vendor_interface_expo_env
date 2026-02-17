// Interfaces
import { DateService as IDateService } from '@/src/core/interfaces/DateService';
import { injectable } from 'tsyringe';

@injectable()
export class DateService implements IDateService {
	getCurrentTimestamp(): number|string {
		console.log('DateService: getCurrentTimestamp called, date: ', new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
		let date = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' })
		console.log("Date: ", date);
		console.log("Get time: ", new Date(date));
		
		return new Date(date).getTime()
	}
}
