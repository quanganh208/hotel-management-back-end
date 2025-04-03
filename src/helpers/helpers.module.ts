import { Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';
import { ConfigModule } from '@nestjs/config';
import supabaseConfig from '@/config/supabase.config';

@Module({
  imports: [ConfigModule.forFeature(supabaseConfig)],
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class HelpersModule {}
