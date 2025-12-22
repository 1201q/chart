import { ValueTransformer } from 'typeorm';

export const DecimalStringTransformer: ValueTransformer = {
  to: (v: string | number | null | undefined) => (v == null ? v : String(v)),
  from: (v: any) => (v == null ? v : String(v)),
};
