// Libraries
import * as Crypto from 'expo-crypto';

// Interfaces
import { IDService } from '@/src/core/interfaces/IDService';

export class UUIDv4Service implements IDService {
	generateID(): string {
		// Prefer the native crypto API when available; falls back to random numbers if missing.
        return Crypto.randomUUID();
    }
}
