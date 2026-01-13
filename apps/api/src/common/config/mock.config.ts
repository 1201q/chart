export function getMockConfig() {
  return {
    scenario: 'baseline-v1',
    baseTs: Number(1700000000000),
    stepMs: Number(200),
    tradesSnapshotCount: Number(50),
  };
}
