import 'reflect-metadata';
import { OracleDataSource } from 'src/common/config/data-source';
import { UpbitCandle } from 'src/candles/candle.entity';

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

async function importCSVCandles(filePath: string, timeframe: string) {
  const repo = OracleDataSource.getRepository(UpbitCandle);

  const filename = path.basename(filePath);
  const [market] = filename.split('_');

  console.log(`${filePath} -> ${market}/${timeframe}`);

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let isHeader = true; // csv 첫줄 헤더 스킵
  const batch: UpbitCandle[] = [];
  const BATCH_SIZE = 1000;

  for await (const line of rl) {
    if (isHeader) {
      console.log('HEADER =', line);
      isHeader = false;
      continue;
    }

    if (!line.trim()) continue;

    const [time, open, high, low, close, acc_volume, acc_price] =
      line.split(',');

    const entity = repo.create({
      market,
      timeframe,
      candleTime: new Date(time + 'Z'),
      open,
      high,
      low,
      close,
      accVolume: acc_volume,
      accPrice: acc_price,
    });

    batch.push(entity);

    if (batch.length >= BATCH_SIZE) {
      await repo
        .createQueryBuilder()
        .insert()
        .into(UpbitCandle)
        .values(batch)
        .orIgnore()
        .execute();
      batch.length = 0;
      console.log(`Inserted ${BATCH_SIZE} candles...`);
    }
  }

  if (batch.length > 0) {
    await repo
      .createQueryBuilder()
      .insert()
      .into(UpbitCandle)
      .values(batch)
      .orIgnore()
      .execute();
  }

  console.log(`✅ done. ${filePath}`);
}

async function bootstrap() {
  await OracleDataSource.initialize();
  console.log(`✅ Oracle DataSource initialized`);

  // =============== DB 연결 테스트 =================
  const runner = OracleDataSource.createQueryRunner();
  const dbNow = await runner.query(`SELECT SYSTIMESTAMP FROM DUAL`);
  console.log(`Database time: ${dbNow[0][0]}`);
  await runner.release();
  // ============================================

  const baseDir = path.join(__dirname, '..', 'data', 'candles');

  // =============== 단일 파일 테스트 임포트 =================
  // const targetFile = 'KRW-DOGE_1d.csv'; // 테스트 대상
  // const fullPath = path.join(dailyDir, targetFile);

  // if (!fs.existsSync(fullPath)) {
  //   console.error('❌ 파일이 없습니다:', fullPath);
  //   await OracleDataSource.destroy();
  //   return;
  // }

  // await importCSVCandles(fullPath, '1d');

  // await OracleDataSource.destroy();

  const configs = [
    { dir: 'daily', suffix: '_1d.csv', timeframe: '1d' },
    { dir: 'weekly', suffix: '_1w.csv', timeframe: '1w' },
    { dir: 'monthly', suffix: '_1M.csv', timeframe: '1M' },
    { dir: 'yearly', suffix: '_1Y.csv', timeframe: '1Y' },
  ];

  for (const cfg of configs) {
    const targetDir = path.join(baseDir, cfg.dir);

    // /candles/[daily|weekly|monthly|yearly] 폴더 체크
    if (!fs.existsSync(targetDir)) {
      console.warn(`⚠️ 폴더가 없습니다: ${targetDir}, 스킵`);
      continue;
    }

    const files = fs
      .readdirSync(targetDir)
      .filter((f) => f.endsWith(cfg.suffix));

    console.log(
      `\n📂 ${cfg.dir} (${cfg.timeframe}) - 파일 ${files.length}개 발견`,
    );

    for (const file of files) {
      const fullPath = path.join(targetDir, file);

      try {
        await importCSVCandles(fullPath, cfg.timeframe);
      } catch (error) {
        console.error(`❌ import 실패: ${fullPath}`, error);
      }
    }
  }

  await OracleDataSource.destroy();
  console.log('✅ import 작업 완료');
}

bootstrap().catch((err) => {
  console.error('❌ Error during import:', err);
  process.exit(1);
});
