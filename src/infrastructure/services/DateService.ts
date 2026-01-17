// Interfaces
import { DateService as IDateService } from '@/src/core/interfaces/DateService';

export class DateService implements IDateService {
	getCurrentTimestamp(): number {
		return Date.now();
	}
}
