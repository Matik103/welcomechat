import { DatabaseService } from '../../types/database';
import { SupabaseService } from './supabaseService';

let databaseService: DatabaseService | null = null;

export function initializeDatabaseService(supabaseUrl: string, supabaseKey: string): DatabaseService {
  if (!databaseService) {
    databaseService = new SupabaseService(supabaseUrl, supabaseKey);
  }
  return databaseService;
}

export function getDatabaseService(): DatabaseService {
  if (!databaseService) {
    throw new Error('Database service not initialized. Call initializeDatabaseService first.');
  }
  return databaseService;
} 