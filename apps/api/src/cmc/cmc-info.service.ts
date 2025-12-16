import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CmcInfoResponse } from './cmc-info.types';
import { InjectRepository } from '@nestjs/typeorm';
import { UpbitMarket } from 'src/market/entities/upbit-market.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CmcInfoService {
  private readonly logger = new Logger(CmcInfoService.name);
  private readonly baseUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info`;
  private readonly mapUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/map`;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(UpbitMarket)
    private readonly upbitMarketRepo: Repository<UpbitMarket>,
  ) { }

  private async fetchOnce(symbols: string[]) {
    const symbolStr = symbols.join(',');

    const qs = new URLSearchParams({
      symbol: symbolStr,
      skip_invalid: 'true',
      aux: 'urls,logo,description,date_added',
    }).toString();

    const url = `${this.baseUrl}?${qs}`;

    const res = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': this.configService.get<string>('CMC_API_KEY') || '',
        Accept: 'application/json',
      },
    });

    return res;
  }

  async getUpbitMarketCodes() {
    const markets = await this.upbitMarketRepo.find({
      where: { isActive: 1, marketCurrency: 'KRW' },
    });

    const uniqueSymbols = Array.from(
      new Set([
        ...markets.map((m) => m.assetSymbol),
        ...markets.map((m) => m.assetSymbolNormalized).filter(Boolean),
      ]),
    );

    return uniqueSymbols;
  }

  async fetchMap(codes: string[]) {
    const url = new URL(this.mapUrl);

    const codeStr = codes.join(',');

    url.searchParams.set('symbol', codeStr);

    const res = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': this.configService.get<string>('CMC_API_KEY') || '',
        Accept: 'application/json',
      },
    });

    return res;
  }

  async test() {
    const codes = await this.getUpbitMarketCodes();

    const res = await this.fetchOnce(codes);

    const json = (await res.json()) as CmcInfoResponse;

    const data = json.data;

    return json.data;
  }

  /***
   * CMC의 invalid symbol 응답 파싱
   * 예: "Invalid values for 'symbol': 'AAA1','BBB2'"
   */
  private parseInvalidResponse(errorMsg: string): string[] {
    // 1) 가장 흔한 형태:
    // Invalid values for "symbol": "FCT2,GAME2,MET2"
    // Invalid values for 'symbol': 'AAA1','BBB2'
    const m =
      errorMsg.match(/Invalid values for\s+["']symbol["']\s*:\s*["']([^"']+)["']/i) ||
      errorMsg.match(/Invalid values for\s+["']symbol["']\s*:\s*(.+)$/i);

    if (!m) return [];

    // 2) 콜론 뒤쪽만 가져오기 (따옴표/대괄호 제거)
    const tail = (m[1] ?? '')
      .trim()
      .replace(/[\[\]\(\)\{\}"]/g, '') // 큰따옴표/괄호류 제거
      .replace(/'/g, ''); // 작은따옴표 제거

    if (!tail) return [];

    // 3) FCT2,GAME2,MET2  /  AAA1, BBB2  /  AAA1','BBB2 같은 케이스 처리
    const invalidSymbols = tail
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toUpperCase());

    return invalidSymbols;
  }

  /**
   * 실패하면 invalid 파싱해서 invalid 제거 후 1회 재시도
   */
  async fetchInfoBatch(symbols: string[]) {
    if (symbols.length === 0) return { data: {}, invalid: [] };

    let invalidSymbols: string[] = [];

    let res = await this.fetchOnce(symbols);

    if (!res.ok) {
      let errorMsg = `${res.status} ${res.statusText}`;
      try {
        const body = (await res.json()) as CmcInfoResponse;
        errorMsg = body?.status?.error_message ?? errorMsg;
      } catch { }

      invalidSymbols = this.parseInvalidResponse(errorMsg);

      if (invalidSymbols.length === 0) {
        this.logger.error(`❌ Failed to fetch CMC info: ${errorMsg}`);
        return { data: {}, invalid: symbols.map((s) => s.toUpperCase()) };
      }

      const filteredSymbols = symbols.filter(
        (s) => !invalidSymbols.includes(s.toUpperCase()),
      );

      if (filteredSymbols.length === 0) {
        return { data: {}, invalid: invalidSymbols };
      }

      res = await this.fetchOnce(filteredSymbols);

      // console.log(res);
      console.log(filteredSymbols);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.error(`❌ CMC retry failed: ${res.status} ${res.statusText} ${text}`);
        return { data: {}, invalid: invalidSymbols };
      }
    }

    const json = (await res.json()) as CmcInfoResponse;
    if (json.status?.error_code !== 0) {
      this.logger.error(
        `❌ CMC fetch returned error: ${json.status?.error_message || 'unknown error'}`,
      );
      return { data: {}, invalid: symbols.map((s) => s.toUpperCase()) };
    }

    // console.log(Object.values(json.data));

    return { data: json.data ?? {}, invalid: invalidSymbols };
  }
}
