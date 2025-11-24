import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmConfig = async (
  config: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  return {
    type: 'oracle',
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    connectString: config.get<string>('DB_CONNECTION'),
    autoLoadEntities: true,
    synchronize: false,
    logging: false,
  };
};
