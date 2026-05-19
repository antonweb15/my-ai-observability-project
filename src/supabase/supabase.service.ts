import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly client: SupabaseClient,
  ) {}

  /**
   * Returns the configured Supabase client.
   */
  getClient(): SupabaseClient {
    return this.client;
  }
}
