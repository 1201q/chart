import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
  AutoscaleInfo,
  Coordinate,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesPrimitive,
  Logical,
  SeriesAttachedParameter,
  Time,
} from 'lightweight-charts';
import { PluginBase } from './plugin-base';

// ─────────────────────────────────────────────────────────────
// 공개 데이터 타입
// ─────────────────────────────────────────────────────────────
export interface CloudPoint {
  time: Time;
  spanA: number;
  spanB: number;
}

// ─────────────────────────────────────────────────────────────
// 렌더러 내부 좌표 타입
// ─────────────────────────────────────────────────────────────
interface CloudRendererPoint {
  x: Coordinate | number;
  spanA: Coordinate | number;
  spanB: Coordinate | number;
}

// ─────────────────────────────────────────────────────────────
// Renderer: 양운/음운 색상 전환 지원
// ─────────────────────────────────────────────────────────────
class IchimokuCloudRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly _points: CloudRendererPoint[],
    private readonly _bullishColor: string,
    private readonly _bearishColor: string,
  ) {}

  draw() {}

  drawBackground(target: CanvasRenderingTarget2D) {
    const points = this._points;
    if (points.length < 2) return;

    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      ctx.scale(scope.horizontalPixelRatio, scope.verticalPixelRatio);

      // 교차 세그먼트 분할 후 색상 채우기
      // 각 인접 두 점 사이를 세그먼트로 처리
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const diff0 = (p0.spanA as number) - (p0.spanB as number);
        const diff1 = (p1.spanA as number) - (p1.spanB as number);

        if (diff0 * diff1 >= 0) {
          // 교차 없음 — 단일 세그먼트
          const isBullish = diff0 <= 0; // spanA coord < spanB coord → 가격 기준 A > B (y축 반전)
          drawSegment(
            ctx,
            p0.x as number,
            p0.spanA as number,
            p0.spanB as number,
            p1.x as number,
            p1.spanA as number,
            p1.spanB as number,
            isBullish ? this._bullishColor : this._bearishColor,
          );
        } else {
          // 교차 있음 — x 선형보간으로 교차점 계산
          const t = diff0 / (diff0 - diff1); // 0 < t < 1
          const xCross = (p0.x as number) + t * ((p1.x as number) - (p0.x as number));
          const yCross =
            (p0.spanA as number) + t * ((p1.spanA as number) - (p0.spanA as number));

          const isBullish0 = diff0 <= 0;
          // 전반부
          drawSegment(
            ctx,
            p0.x as number,
            p0.spanA as number,
            p0.spanB as number,
            xCross,
            yCross,
            yCross,
            isBullish0 ? this._bullishColor : this._bearishColor,
          );
          // 후반부
          drawSegment(
            ctx,
            xCross,
            yCross,
            yCross,
            p1.x as number,
            p1.spanA as number,
            p1.spanB as number,
            isBullish0 ? this._bearishColor : this._bullishColor,
          );
        }
      }
    });
  }
}

/**
 * 사다리꼴(trapezoid) 영역을 채움
 * (x0, aY0, bY0) → (x1, aY1, bY1) 로 이어지는 구름 세그먼트
 */
function drawSegment(
  ctx: CanvasRenderingContext2D,
  x0: number,
  aY0: number,
  bY0: number,
  x1: number,
  aY1: number,
  bY1: number,
  color: string,
) {
  const region = new Path2D();
  region.moveTo(x0, aY0);
  region.lineTo(x1, aY1);
  region.lineTo(x1, bY1);
  region.lineTo(x0, bY0);
  region.closePath();
  ctx.fillStyle = color;
  ctx.fill(region);
}

// ─────────────────────────────────────────────────────────────
// PaneView
// ─────────────────────────────────────────────────────────────
class IchimokuCloudPaneView implements IPrimitivePaneView {
  private _points: CloudRendererPoint[] = [];

  constructor(private readonly _source: IchimokuCloudIndicator) {}

  update() {
    const series = this._source.series;
    const timeScale = this._source.chart.timeScale();
    this._points = this._source._cloudData.map((d) => ({
      x: timeScale.timeToCoordinate(d.time) ?? -9999,
      spanA: series.priceToCoordinate(d.spanA) ?? -9999,
      spanB: series.priceToCoordinate(d.spanB) ?? -9999,
    }));
  }

  renderer() {
    return new IchimokuCloudRenderer(
      this._points,
      this._source._bullishColor,
      this._source._bearishColor,
    );
  }
}

// ─────────────────────────────────────────────────────────────
// IchimokuCloudIndicator (메인 클래스)
// ─────────────────────────────────────────────────────────────
export class IchimokuCloudIndicator extends PluginBase implements ISeriesPrimitive<Time> {
  _cloudData: CloudPoint[] = [];
  _bullishColor: string = 'rgba(239,154,154,0.3)';
  _bearishColor: string = 'rgba(38,50,56,0.4)';

  private readonly _paneViews: IchimokuCloudPaneView[];

  constructor() {
    super();
    this._paneViews = [new IchimokuCloudPaneView(this)];
  }

  // 외부에서 계산된 구름 데이터 + 색상을 주입
  updateData(data: CloudPoint[], bullishColor: string, bearishColor: string) {
    this._cloudData = data;
    this._bullishColor = bullishColor;
    this._bearishColor = bearishColor;
    this.requestUpdate();
  }

  updateAllViews() {
    this._paneViews.forEach((v) => v.update());
  }

  paneViews() {
    return this._paneViews;
  }

  attached(p: SeriesAttachedParameter<Time>): void {
    super.attached(p);
    // 데이터는 외부에서 주입하므로 dataUpdated 구독 불필요
    this.requestUpdate();
  }

  autoscaleInfo(_startTimePoint: Logical, _endTimePoint: Logical): AutoscaleInfo {
    let min = Infinity;
    let max = -Infinity;
    for (const d of this._cloudData) {
      if (d.spanA < min) min = d.spanA;
      if (d.spanB < min) min = d.spanB;
      if (d.spanA > max) max = d.spanA;
      if (d.spanB > max) max = d.spanB;
    }
    if (min === Infinity) return { priceRange: { minValue: 0, maxValue: 0 } };
    return { priceRange: { minValue: min, maxValue: max } };
  }
}
