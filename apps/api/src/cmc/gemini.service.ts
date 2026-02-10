import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

interface TranslateOptions {
  text: string;
  from?: string; // default: 'en'
  to?: string; // default: 'ko'
}

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);

  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-2.5-flash';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY', '');

    if (!apiKey) {
      this.logger.warn('⚠️ GEMINI_API_KEY not configured - Gemini translation disabled');
      this.ai = null;
      return;
    }

    // 모델명의 변경 필요하면 환경변수로 오버라이드
    this.modelName = this.configService.get<string>('GEMINI_MODEL', this.modelName);

    this.ai = new GoogleGenAI({ apiKey });
    this.logger.log(`✅ Gemini service initialized (model=${this.modelName})`);
  }

  isAvailable(): boolean {
    return !!this.ai;
  }

  async translate(options: TranslateOptions): Promise<string> {
    const { text, from = 'en', to = 'ko' } = options;

    if (!this.ai) throw new Error('GEMINI_API_KEY not configured');
    if (!text || text.trim().length === 0) return '';

    const prompt = this.buildTranslationPrompt(text, from, to);

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: 0,
        },
      });

      // :contentReference[oaicite:2]{index=2}
      const translated = (response as any).text ?? '';
      return String(translated).trim();
    } catch (error: any) {
      this.logger.error(`Translation failed: ${error?.message ?? error}`, error?.stack);
      throw error;
    }
  }

  async translateBatch(
    texts: string[],
    from: string = 'en',
    to: string = 'ko',
    chunkSize: number = 10,
  ): Promise<string[]> {
    if (!this.ai) throw new Error('GEMINI_API_KEY not configured');
    if (!texts?.length) return [];

    const out: string[] = [];

    for (let i = 0; i < texts.length; i += chunkSize) {
      const chunk = texts.slice(i, i + chunkSize);

      const prompt = this.buildBatchTranslationPrompt(chunk, from, to);

      try {
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            temperature: 0,
            responseMimeType: 'application/json',
            // contentReference[oaicite:3]{index=3}
            responseSchema: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        });

        const raw = String((response as any).text ?? '').trim();
        const arr = JSON.parse(raw) as string[];

        // 길이 불일치 방어
        if (!Array.isArray(arr) || arr.length !== chunk.length) {
          this.logger.warn(
            `Batch translate size mismatch: expected=${chunk.length}, got=${Array.isArray(arr) ? arr.length : 'non-array'}`,
          );
          // 폴백: chunk별로 단건 번역
          for (const t of chunk) out.push(await this.translate({ text: t, from, to }));
        } else {
          out.push(...arr.map((s) => String(s ?? '').trim()));
        }
      } catch (e: any) {
        this.logger.error(`Batch translation failed (i=${i}): ${e?.message ?? e}`);
        // 폴백: chunk별로 단건 번역
        for (const t of chunk) {
          try {
            out.push(await this.translate({ text: t, from, to }));
          } catch {
            out.push('');
          }
        }
      }

      // 레이트리밋 완화용 소량 딜레이 ㄱ
      await new Promise((r) => setTimeout(r, 150));
    }

    return out;
  }

  private buildTranslationPrompt(text: string, from: string, to: string): string {
    const langMap: Record<string, string> = {
      en: 'English',
      ko: 'Korean',
    };

    const fromLang = langMap[from] || from;
    const toLang = langMap[to] || to;

    return [
      `You are a translation engine.`,
      `Translate from ${fromLang} to ${toLang}.`,
      `Rules:`,
      `- Output ONLY the translated text. No quotes, no explanations.`,
      `- Preserve numbers, tickers/symbols (e.g., LINK), URLs, and proper nouns.`,
      `- Keep financial/crypto terminology natural in ${toLang}.`,
      ``,
      `Text:`,
      text,
    ].join('\n');
  }

  private buildBatchTranslationPrompt(texts: string[], from: string, to: string): string {
    const langMap: Record<string, string> = {
      en: 'English',
      ko: 'Korean',
    };

    const fromLang = langMap[from] || from;
    const toLang = langMap[to] || to;

    // JSON 배열로 정확히 같은 개수 반환 강제
    return [
      `You are a translation engine.`,
      `Translate an array of ${fromLang} texts into ${toLang}.`,
      `Return ONLY a JSON array of strings.`,
      `Rules:`,
      `- The JSON array length MUST equal the input length.`,
      `- Preserve numbers, tickers/symbols (e.g., LINK), URLs, and proper nouns.`,
      `- No extra keys, no markdown, no commentary.`,
      ``,
      `Input JSON array:`,
      JSON.stringify(texts),
    ].join('\n');
  }
}
