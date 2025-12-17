import { Processor, WorkerHost } from '@nestjs/bullmq';
import { JOB, QUEUE } from '../queue.constants';
import { Logger } from '@nestjs/common';

import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { UpbitMarket } from 'src/market/entities/upbit-market.entity';
import { Repository } from 'typeorm';
import { CoinInfo } from 'src/market/entities/coin-info.entity';
import { OracleBucketService } from 'src/bucket/oracle.bucket.service';

@Processor(QUEUE.ICON_UPLOAD, { concurrency: 1 })
export class IconSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(IconSyncProcessor.name);

  constructor(
    @InjectRepository(UpbitMarket)
    private readonly upbitMarketRepo: Repository<UpbitMarket>,

    @InjectRepository(CoinInfo)
    private readonly coinInfoRepo: Repository<CoinInfo>,

    private readonly bucket: OracleBucketService,
  ) {
    super();
  }

  async process(job: Job<{ cmcId: number }>) {
    if (job.name !== JOB.ICON_UPLOAD_ONE) return;

    const { cmcId } = job.data;

    const coin = await this.coinInfoRepo.findOne({
      where: { cmcId },
    });

    if (!coin) return;
    if (!coin.logoUrl) return;

    const market = await this.upbitMarketRepo.findOne({
      where: { id: coin.upbitMarketId },
      select: ['id', 'assetSymbol'],
    });

    if (!market) return;

    const symbol = market.assetSymbol.toUpperCase();
    if (!symbol) return;

    const buffer = await this.downloadImage(coin.logoUrl);

    const objectName = await this.bucket.uploadCoinIcon(buffer, { symbol, size: 64 });
    const publicUrl = this.bucket.getPublicUrl(objectName);

    coin.iconObjectKey = objectName;
    coin.iconPublicUrl = publicUrl;

    await this.coinInfoRepo.save(coin);

    this.logger.log(`Icon uploaded for ${symbol} (${cmcId}): ${publicUrl}`);
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const controller = new AbortController();

    const t = setTimeout(() => {
      controller.abort();
    }, 15_000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          Accept: 'image/*,*/*;q=0.8',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
      }

      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);

      if (buf.length < 32) {
        throw new Error(`Image size too small: ${buf.length} bytes`);
      }

      return buf;
    } finally {
      clearTimeout(t);
    }
  }
}
