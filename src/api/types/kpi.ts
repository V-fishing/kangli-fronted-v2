/** 分公司 KPI 对比(GET /v1/kpi/compare) */
export interface KpiOrg {
  orgId: string
  orgCode: string
  orgName: string
}

export interface KpiItem {
  /** 指标 key */
  key: string
  /** 指标展示名 */
  name: string
  /** count=整数数量,rate=百分比 */
  type: 'count' | 'rate'
  /** 按 orgCode 分组织的指标值 */
  values: Record<string, number | null>
}

export interface KpiCompareVo {
  orgs: KpiOrg[]
  items: KpiItem[]
}
