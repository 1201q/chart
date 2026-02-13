import { Processor, WorkerHost } from '@nestjs/bullmq';
import { JOB, QUEUE } from '../queue.constants';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinInfo } from 'src/market/entities/coin-info.entity';
import { GeminiService } from 'src/cmc/gemini.service';

@Processor(QUEUE.CMC_TRANSLATE, {
  concurrency: 10, // ✅ 동시 10개 처리 (유료 버전)
  limiter: {
    max: 30, // 1분에 30개 (Gemini 유료: 1000 RPM)
    duration: 60000,
  },
})
export class CmcTranslateProcessor extends WorkerHost {
  private readonly logger = new Logger(CmcTranslateProcessor.name);

  constructor(
    @InjectRepository(CoinInfo)
    private readonly coinInfoRepo: Repository<CoinInfo>,

    private readonly gemini: GeminiService,
  ) {
    super();
  }

  async process(job: Job<{ cmcId: number }>) {
    if (job.name !== JOB.CMC_TRANSLATE_ONE) return;

    const { cmcId } = job.data;

    try {
      // 1. CoinInfo 조회
      const coin = await this.coinInfoRepo.findOne({
        where: { cmcId },
      });

      if (!coin) {
        this.logger.warn(`CoinInfo not found for cmcId: ${cmcId}`);
        return { status: 'skipped', reason: 'coin_not_found' };
      }

      // 2. 영문 설명이 없으면 스킵
      if (!coin.descriptionEn || coin.descriptionEn.trim().length === 0) {
        this.logger.verbose(`No English description for cmcId: ${cmcId}`);
        return { status: 'skipped', reason: 'no_description' };
      }

      // 3. 이미 번역이 있으면 스킵
      if (coin.descriptionKo && coin.descriptionKo.trim().length > 0) {
        this.logger.verbose(`Translation already exists for cmcId: ${cmcId}`);
        return { status: 'skipped', reason: 'already_translated' };
      }

      // 4. Gemini 사용 가능 확인
      if (!this.gemini.isAvailable()) {
        this.logger.warn('Gemini service not available');
        return { status: 'skipped', reason: 'gemini_unavailable' };
      }

      // 5. Gemini로 번역
      this.logger.log(`🔄 Translating description for cmcId: ${cmcId}...`);

      const translated = await this.gemini.translate({
        text: coin.descriptionEn,
        from: 'en',
        to: 'ko',
      });

      // 6. 번역 결과 저장
      coin.descriptionKo = translated;
      await this.coinInfoRepo.save(coin);

      this.logger.log(
        `✅ Translation completed for cmcId: ${cmcId} (${translated.length} chars)`,
      );

      return {
        status: 'success',
        cmcId,
        translatedLength: translated.length,
      };
    } catch (error) {
      this.logger.error(`❌ Translation failed for cmcId: ${cmcId}`, error.message);
      throw error; // BullMQ가 재시도 처리
    }
  }
}
