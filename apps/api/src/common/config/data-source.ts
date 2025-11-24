import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UpbitCandle } from '../../candles/candle.entity';

import { config } from 'dotenv';

config();

console.log('DB_USERNAME in OracleDataSource =', process.env.DB_USERNAME);
console.log('DB_CONNECTION in OracleDataSource =', process.env.DB_CONNECTION);

export const OracleDataSource = new DataSource({
  type: 'oracle',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECTION,
  entities: [UpbitCandle],
  logging: false,
  synchronize: false,
});
