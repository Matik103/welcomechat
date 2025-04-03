import { createClient } from '@supabase/supabase-js';
import { AIAgent, DatabaseService, DocumentProcessingJob } from '../../types/database';
import { v4 as uuidv4 } from 'uuid';

export class SupabaseService implements DatabaseService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveAgent(agent: Omit<AIAgent, 'id'>): Promise<AIAgent> {
    const id = uuidv4();
    const { data, error } = await this.supabase
      .from('ai_agents')
      .insert({
        id,
        ...agent,
        status: agent.status || 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving agent:', error);
      throw error;
    }

    return data;
  }

  async saveDocumentProcessingJob(job: Omit<DocumentProcessingJob, 'id'>): Promise<DocumentProcessingJob> {
    const id = uuidv4();
    const { data, error } = await this.supabase
      .from('document_processing_jobs')
      .insert({
        id,
        ...job
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving document processing job:', error);
      throw error;
    }

    return data;
  }

  async getAgent(id: string): Promise<AIAgent | null> {
    const { data, error } = await this.supabase
      .from('ai_agents')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting agent:', error);
      throw error;
    }

    return data;
  }

  async getDocumentProcessingJob(id: string): Promise<DocumentProcessingJob | null> {
    const { data, error } = await this.supabase
      .from('document_processing_jobs')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting document processing job:', error);
      throw error;
    }

    return data;
  }
} 