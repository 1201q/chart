import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { CmcInfoService } from './cmc-info.service';
import { CmcInfoSyncService } from './cmc-info-sync.service';
import { GeminiService } from './gemini.service';
import { QueueProducer } from 'src/queue/queue.producer';
import { TranslateTestDto } from './dto/translate-test.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CoinInfo } from 'src/market/entities/coin-info.entity';
import { Repository, IsNull, Not } from 'typeorm';

@ApiTags('CMC (CoinMarketCap)')
@Controller('cmc')
export class CmcController {
  constructor(
    private readonly info: CmcInfoService,
    private readonly sync: CmcInfoSyncService,
    private readonly gemini: GeminiService,
    private readonly queueProducer: QueueProducer,

    @InjectRepository(CoinInfo)
    private readonly coinInfoRepo: Repository<CoinInfo>,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'CMC 정보 동기화',
    description: '모든 코인의 CMC 정보를 동기화하고 아이콘/번역 작업을 큐에 등록합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '동기화 결과',
    schema: {
      example: {
        created: 5,
        updated: 50,
        iconSyncQueued: 10,
        translateSyncQueued: 15,
      },
    },
  })
  async syncAll() {
    const res = await this.sync.syncAll();
    return res;
  }

  @Post('translate/test')
  @ApiOperation({
    summary: 'Gemini 번역 테스트',
    description: '영문 텍스트를 한글로 번역합니다. (Gemini API 사용)',
  })
  @ApiBody({ type: TranslateTestDto })
  @ApiResponse({
    status: 200,
    description: '번역 성공',
    schema: {
      example: {
        original: 'Bitcoin is a decentralized digital currency.',
        translated: '비트코인은 탈중앙화된 디지털 화폐입니다.',
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (텍스트 누락 또는 너무 김)' })
  @ApiResponse({ status: 500, description: 'Gemini API 오류' })
  async testTranslate(@Body() body: TranslateTestDto) {
    const translated = await this.gemini.translate({
      text: body.text,
      from: 'en',
      to: 'ko',
    });

    return {
      original: body.text,
      translated,
    };
  }

  @Post('translate/queue/:cmcId')
  @ApiOperation({
    summary: '번역 작업 큐에 등록',
    description: '특정 코인의 description을 번역 큐에 등록합니다.',
  })
  @ApiParam({
    name: 'cmcId',
    description: 'CoinMarketCap ID',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: '큐 등록 성공',
    schema: {
      example: {
        message: 'Translation job queued',
        cmcId: 1,
      },
    },
  })
  async queueTranslate(@Param('cmcId') cmcId: string) {
    await this.queueProducer.enqueueTranslate(Number(cmcId));

    return {
      message: 'Translation job queued',
      cmcId: Number(cmcId),
    };
  }

  @Post('translate/batch')
  @ApiOperation({
    summary: '배치 번역 (모든 코인)',
    description:
      '번역이 필요한 모든 코인을 큐에 등록합니다. (descriptionEn 있고 descriptionKo 없는 코인)',
  })
  @ApiQuery({
    name: 'force',
    description: '강제 재번역 (이미 번역된 코인도 다시 번역)',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: '배치 등록 성공',
    schema: {
      example: {
        message: 'Batch translation queued',
        total: 250,
        estimatedTime: '8 minutes',
        cmcIds: [1, 2, 3],
      },
    },
  })
  async batchTranslate(@Query('force') force?: string) {
    const forceTranslate = force === 'true';

    // 번역이 필요한 코인 조회
    const whereCondition = forceTranslate
      ? { descriptionEn: Not(IsNull()) } // 강제: 영문만 있으면 모두
      : { descriptionEn: Not(IsNull()), descriptionKo: IsNull() }; // 일반: 한글 없는 것만

    const coins = await this.coinInfoRepo.find({
      where: whereCondition,
      select: ['id', 'cmcId'],
    });

    // 큐에 등록
    for (const coin of coins) {
      await this.queueProducer.enqueueTranslate(coin.cmcId);
    }

    const estimatedMinutes = Math.ceil(coins.length / 30); // 1분에 30개 처리

    return {
      message: 'Batch translation queued',
      total: coins.length,
      estimatedTime: `${estimatedMinutes} minutes`,
      cmcIds: coins.map((c) => c.cmcId).slice(0, 10), // 처음 10개만 보여주기
    };
  }

  @Get('translate/status')
  @ApiOperation({
    summary: '번역 상태 확인',
    description: '번역이 필요한 코인 개수와 이미 번역된 코인 개수를 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '번역 상태',
    schema: {
      example: {
        total: 250,
        translated: 200,
        pending: 50,
        progress: '80%',
      },
    },
  })
  async translateStatus() {
    // 전체 코인 (영문 설명 있는 것)
    const total = await this.coinInfoRepo.count({
      where: { descriptionEn: Not(IsNull()) },
    });

    // 이미 번역된 코인
    const translated = await this.coinInfoRepo.count({
      where: {
        descriptionEn: Not(IsNull()),
        descriptionKo: Not(IsNull()),
      },
    });

    const pending = total - translated;
    const progress = total > 0 ? Math.round((translated / total) * 100) : 0;

    return {
      total,
      translated,
      pending,
      progress: `${progress}%`,
    };
  }

  @Get('info/symbols')
  @ApiOperation({
    summary: 'CMC API 테스트 - 심볼로 조회',
    description: '코인 심볼(티커)로 CMC API를 직접 호출해서 정보를 가져옵니다.',
  })
  @ApiQuery({
    name: 'symbols',
    description: '조회할 코인 심볼 (쉘표로 구분)',
    example: 'BTC,ETH,XRP,DOGE,ADA',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'CMC API 응답 데이터',
    schema: {
      example: {
        success: true,
        status: 200,
        symbolsRequested: ['BTC', 'ETH', 'XRP'],
        data: {
          status: {
            timestamp: '2024-02-10T02:00:00.000Z',
            error_code: 0,
            credit_count: 1,
          },
          data: {
            BTC: [
              {
                id: 1,
                name: 'Bitcoin',
                symbol: 'BTC',
                slug: 'bitcoin',
                description: 'Bitcoin is a decentralized cryptocurrency...',
                logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
              },
            ],
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (심볼 누락)' })
  @ApiResponse({ status: 500, description: 'CMC API 오류' })
  async fetchBySymbolsTest(@Query('symbols') symbols: string) {
    if (!symbols || symbols.trim().length === 0) {
      return {
        error: 'symbols parameter is required',
        example: '/cmc/info/symbols?symbols=BTC,ETH,XRP',
      };
    }

    const symbolArray = symbols
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    if (symbolArray.length === 0) {
      return {
        error: 'No valid symbols provided',
      };
    }

    try {
      const res = await this.info.fetchBySymbols(symbolArray);
      const data = await res.json();

      return {
        success: res.ok,
        status: res.status,
        symbolsRequested: symbolArray,
        data,
      };
    } catch (error) {
      return {
        error: 'Failed to fetch from CMC API',
        message: error.message,
      };
    }
  }
}
