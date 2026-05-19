import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Module({
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('app.supabase.url') || '';
        const key =
          configService.get<string>('app.supabase.serviceRoleKey') || '';
        return createClient(url, key);
      },
      inject: [ConfigService],
    },
    SupabaseService,
  ],
  exports: ['SUPABASE_CLIENT', SupabaseService],
})
export class SupabaseModule {}
