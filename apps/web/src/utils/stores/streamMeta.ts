export type StreamPhase = 'idle' | 'connecting' | 'ready' | 'error';

export type StreamMeta = {
  phase: StreamPhase;
  snapshoted: boolean; // 스냅샷 받았나? => 스켈레톤 여부
  error: unknown | null;
};
