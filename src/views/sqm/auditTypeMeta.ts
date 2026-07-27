/**
 * 供应商审核 - 审核类型元数据（单一数据源）
 *
 * 驱动以下差异化渲染：
 *  - 列表类型筛选项（Object.keys(AUDIT_TYPE_META)）
 *  - 详情 / 记录详情的「类型特有信息」字段（fields 计划级 / recordFields 记录级）
 *  - 生命周期时间线步骤（processSteps，按审核类型不同）
 *
 * 类型取值与后端 DataInitializer 种子数据、sqm_audit_plan.audit_type 保持一致（15 种）。
 * 特有字段存于主表 ext_json（JSONB），改配置即可，无需改表结构。
 */
export type AuditTypeKey = string

export type FieldType = 'text' | 'number' | 'boolean' | 'enum'

export interface AuditFieldDef {
  key: string
  label: string
  type?: FieldType
  options?: string[]
}

export interface AuditProcessStep {
  key: string
  label: string
}

export interface AuditTypeMeta {
  label: string
  description?: string
  processSteps: AuditProcessStep[]
  fields: AuditFieldDef[] // 计划级特有字段
  recordFields: AuditFieldDef[] // 记录级特有字段
}

export const AUDIT_TYPE_META: Record<AuditTypeKey, AuditTypeMeta> = {
  '物料变更审核': {
    label: '物料变更审核',
    description: '供应商发起的物料/工艺变更评审，闭环后转入变更管理流程',
    processSteps: [
      { key: 's1', label: '变更申请' },
      { key: 's2', label: '变更评审' },
      { key: 's3', label: '试产验证' },
      { key: 's4', label: '不符合项' },
      { key: 's5', label: '转入变更管理' },
      { key: 's6', label: '闭环归档' },
    ],
    fields: [
      { key: 'changeNo', label: '变更单号' },
      { key: 'changeTitle', label: '变更主题' },
      { key: 'affectedMaterial', label: '受影响物料' },
      { key: 'pilotBatches', label: '试产批次数', type: 'number' },
    ],
    recordFields: [
      { key: 'pilotResult', label: '试产结论' },
      { key: 'verificationBatches', label: '验证批次数', type: 'number' },
      { key: 'riskLevel', label: '变更风险' },
    ],
  },
  '资质审核': {
    label: '资质审核',
    description: '营业执照/体系证书/产能资质复核，合格后纳入合格供应商名录',
    processSteps: [
      { key: 's1', label: '资料收集' },
      { key: 's2', label: '资质核验' },
      { key: 's3', label: '现场抽查' },
      { key: 's4', label: '不合格整改' },
      { key: 's5', label: '纳入合格名录' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'certTypes', label: '核查资质' },
      { key: 'validTo', label: '证书有效期至' },
      { key: 'scope', label: '复核范围' },
    ],
    recordFields: [
      { key: 'certStatus', label: '资质结论' },
      { key: 'renewalPlan', label: '换证计划' },
    ],
  },
  '年度审核': {
    label: '年度审核',
    description: '年度体系/过程/交付绩效全面审核，输出供应商等级',
    processSteps: [
      { key: 's1', label: '计划创建' },
      { key: 's2', label: '通知排期' },
      { key: 's3', label: '全面审核' },
      { key: 's4', label: '不符合项' },
      { key: 's5', label: '纠正措施' },
      { key: 's6', label: '评级归档' },
    ],
    fields: [
      { key: 'auditYear', label: '审核年度' },
      { key: 'auditScope', label: '审核范围' },
      { key: 'assessedGrade', label: '预评等级' },
    ],
    recordFields: [
      { key: 'grade', label: '评定等级' },
      { key: 'score', label: '综合得分' },
      { key: 'capaCount', label: '纠正措施数', type: 'number' },
    ],
  },
  '季度审核': {
    label: '季度审核',
    description: '季度绩效与交付体检，跟踪供应商生命周期健康度',
    processSteps: [
      { key: 's1', label: '计划创建' },
      { key: 's2', label: '排期' },
      { key: 's3', label: '绩效体检' },
      { key: 's4', label: '不符合项' },
      { key: 's5', label: '季度报告' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'quarter', label: '季度' },
      { key: 'kpiFocus', label: '重点KPI' },
      { key: 'reviewCycle', label: '周期' },
    ],
    recordFields: [],
  },
  '来料异常审核': {
    label: '来料异常审核',
    description: '针对批次不合格开展的现场审核，流入来料异常整改(CAR)',
    processSteps: [
      { key: 's1', label: '异常触发' },
      { key: 's2', label: '现场审核' },
      { key: 's3', label: '不合格判定' },
      { key: 's4', label: '整改CAR' },
      { key: 's5', label: '验证放行' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'batchNo', label: '异常批次' },
      { key: 'defectDesc', label: '缺陷描述' },
      { key: 'abnormalSource', label: '异常来源' },
    ],
    recordFields: [
      { key: 'disposition', label: '处置方式' },
      { key: 'carNo', label: '整改单号' },
      { key: 'verifiedBatches', label: '验证批次数', type: 'number' },
    ],
  },
  '临时审核': {
    label: '临时审核',
    description: '质量主管针对客诉等临时发起的专项现场审核',
    processSteps: [
      { key: 's1', label: '发起' },
      { key: 's2', label: '临时排期' },
      { key: 's3', label: '现场审核' },
      { key: 's4', label: '不符合项' },
      { key: 's5', label: '报告' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'trigger', label: '触发原因' },
      { key: 'customer', label: '关联客户' },
      { key: 'urgency', label: '紧急度' },
    ],
    recordFields: [],
  },
  '重大来料异常审核': {
    label: '重大来料异常审核',
    description: '系统自动触发，重大异常停线整改后开展现场审核',
    processSteps: [
      { key: 's1', label: '自动触发' },
      { key: 's2', label: '紧急现场' },
      { key: 's3', label: '停线整改' },
      { key: 's4', label: '8D' },
      { key: 's5', label: '验证' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'stopLine', label: '是否停线', type: 'boolean' },
      { key: 'triggerSystem', label: '触发系统' },
      { key: 'severity', label: '严重程度' },
    ],
    recordFields: [],
  },
  '供应商准入审核': {
    label: '供应商准入审核',
    description: '新供应商准入申请，预选目标等级后进入生命周期',
    processSteps: [
      { key: 's1', label: '准入申请' },
      { key: 's2', label: '预选评估' },
      { key: 's3', label: '现场审核' },
      { key: 's4', label: '不符合项' },
      { key: 's5', label: '准入批准' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'targetGrade', label: '预选等级' },
      { key: 'category', label: '物料类别' },
      { key: 'preSelect', label: '预选状态' },
    ],
    recordFields: [],
  },
  '年度复审': {
    label: '年度复审',
    description: '年度复审及上年度纠正措施有效性验证',
    processSteps: [
      { key: 's1', label: '计划创建' },
      { key: 's2', label: '通知排期' },
      { key: 's3', label: '复审实施' },
      { key: 's4', label: '整改有效性验证' },
      { key: 's5', label: '结论' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'lastAuditNo', label: '上年度审核编号' },
      { key: 'reviewFocus', label: '复审重点' },
      { key: 'scopeYear', label: '复审年度' },
    ],
    recordFields: [
      { key: 'capaEffective', label: '整改有效性' },
      { key: 'reviewGrade', label: '复审等级' },
      { key: 'score', label: '综合得分' },
    ],
  },
  '过程审核': {
    label: '过程审核',
    description: '制造过程 VDA6.3 过程能力审核',
    processSteps: [
      { key: 's1', label: '计划创建' },
      { key: 's2', label: 'VDA6.3排期' },
      { key: 's3', label: '过程审核' },
      { key: 's4', label: '过程能力评估' },
      { key: 's5', label: '不符合项' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'processName', label: '过程名称' },
      { key: 'vdaElement', label: 'VDA要素' },
      { key: 'keyProcess', label: '关键过程', type: 'boolean' },
    ],
    recordFields: [
      { key: 'cpk', label: 'Cpk' },
      { key: 'processCapability', label: '过程能力' },
      { key: 'ranking', label: '评级' },
    ],
  },
  '专项审核': {
    label: '专项审核',
    description: '针对 RoHS 等限用物质的专项合规审核',
    processSteps: [
      { key: 's1', label: '计划创建' },
      { key: 's2', label: '专项排期' },
      { key: 's3', label: '专项实施' },
      { key: 's4', label: '不符合项' },
      { key: 's5', label: '专项报告' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'specialTopic', label: '专项主题' },
      { key: 'regulation', label: '适用法规' },
      { key: 'sampleScope', label: '抽样范围' },
    ],
    recordFields: [],
  },
  '飞行检查': {
    label: '飞行检查',
    description: '不预先通知的突击现场飞行检查',
    processSteps: [
      { key: 's1', label: '不通知突击' },
      { key: 's2', label: '现场突查' },
      { key: 's3', label: '即时判定' },
      { key: 's4', label: '整改通知' },
      { key: 's5', label: '复核' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'noticeFree', label: '免通知', type: 'boolean' },
      { key: 'scope', label: '突击范围' },
      { key: 'leadTeam', label: '带队' },
    ],
    recordFields: [],
  },
  '初次审核': {
    label: '初次审核',
    description: '新供应商准入初次体系审核',
    processSteps: [
      { key: 's1', label: '申请' },
      { key: 's2', label: '文件评审' },
      { key: 's3', label: '现场审核' },
      { key: 's4', label: '不符合项' },
      { key: 's5', label: '准入结论' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'applyNo', label: '申请编号' },
      { key: 'systemStandard', label: '体系标准' },
      { key: 'category', label: '物料类别' },
    ],
    recordFields: [
      { key: 'admissionEligible', label: '准入资格' },
      { key: 'ncCount', label: '不符合项数', type: 'number' },
      { key: 'score', label: '综合得分' },
    ],
  },
  '附加审核': {
    label: '附加审核',
    description: '客户要求追加的合规附加审核（如碳足迹）',
    processSteps: [
      { key: 's1', label: '客户要求' },
      { key: 's2', label: '追加排期' },
      { key: 's3', label: '实施' },
      { key: 's4', label: '不符合项' },
      { key: 's5', label: '报告' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'customerReq', label: '客户要求' },
      { key: 'addTopic', label: '追加主题' },
      { key: 'standard', label: '标准' },
    ],
    recordFields: [],
  },
  '重新审核': {
    label: '重新审核',
    description: '重大异常整改后重新审核确认，决定是否恢复供货',
    processSteps: [
      { key: 's1', label: '整改完成' },
      { key: 's2', label: '复评排期' },
      { key: 's3', label: '重新审核' },
      { key: 's4', label: '验证' },
      { key: 's5', label: '恢复供货结论' },
      { key: 's6', label: '归档' },
    ],
    fields: [
      { key: 'prevAuditNo', label: '前次审核编号' },
      { key: 'reauditReason', label: '复评原因' },
      { key: 'scope', label: '复核范围' },
    ],
    recordFields: [
      { key: 'recoveryStatus', label: '恢复供货' },
      { key: 'reauditScore', label: '复评得分' },
      { key: 'verifiedBatches', label: '验证批次数', type: 'number' },
    ],
  },
}

const DEFAULT_STEPS: AuditProcessStep[] = [
  { key: 's1', label: '计划创建' },
  { key: 's2', label: '通知排期' },
  { key: 's3', label: '现场审核' },
  { key: 's4', label: '不符合项' },
  { key: 's5', label: '报告归档' },
]

export function auditMeta(type?: string): AuditTypeMeta | undefined {
  if (!type) return undefined
  return AUDIT_TYPE_META[type]
}

export function processStepsOf(type: string): AuditProcessStep[] {
  const meta = AUDIT_TYPE_META[type]
  return meta && meta.processSteps && meta.processSteps.length ? meta.processSteps : DEFAULT_STEPS
}

export function parseExt(json?: string): Record<string, unknown> {
  if (!json) return {}
  try {
    const o = JSON.parse(json)
    return o && typeof o === 'object' ? (o as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}
