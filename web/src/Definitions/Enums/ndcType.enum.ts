// Mirrors backend libs/shared/src/enum/ndc.type.enum.ts.
export enum NdcType {
  SINGLE_YEAR = 'SingleYear',
  MULTI_YEAR = 'MultiYear',
}

export const NDC_TYPE_LABELS: Record<string, string> = {
  [NdcType.SINGLE_YEAR]: 'Single-Year Target',
  [NdcType.MULTI_YEAR]: 'Multi-Year Target',
};
