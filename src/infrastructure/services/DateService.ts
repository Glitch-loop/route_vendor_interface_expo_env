// Interfaces
import { DateService as IDateService } from '@/src/core/interfaces/DateService';
import { injectable } from 'tsyringe';

@injectable()
export class DateService implements IDateService {
	getCurrentTimestamp(): number|string {
		return new Date().toISOString();
	}
}
