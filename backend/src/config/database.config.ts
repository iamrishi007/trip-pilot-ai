import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',

  // Neon PostgreSQL connection string
  url: configService.get<string>('DATABASE_URL'),

  // Neon requires SSL connection
  ssl: {
    rejectUnauthorized: false,
  },

  // TypeORM will automatically find our entities
  autoLoadEntities: true,

  // We will create/manage tables ourselves
  synchronize:
    configService.get<string>('DB_SYNCHRONIZE') === 'true',

  logging:
    configService.get<string>('DB_LOGGING') === 'true',
});