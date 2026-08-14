// 8D 来源单号 → 追溯跳转目标映射
// 8D 报告由某些质量事件触发(来料异常 / SPC 告警等)，source 标记来源类型，
// sourceRefId 标记来源单号，用于在归档/阶段详情中一键追溯到触发该 8D 的源头事件。

export interface SourceTarget {
  /** 来源中文名，用于按钮文案 */
  label: string
  /** 跳转路由 */
  path: string
  /** 跳转查询参数(目标列表页据此自动定位并打开详情) */
  query: Record<string, string>
}

/**
 * 根据 8D 的 source / sourceRefId 计算追溯跳转目标。
 * 未知来源或无单号时返回 null(调用方应降级为纯文本展示)。
 */
export function getSourceTarget(source?: string | null, refId?: string | null): SourceTarget | null {
  if (!source || !refId) return null
  switch (source) {
    case 'SQM异常':
      // sourceRefId 存的是来料异常单号 abnormalNo
      return { label: '来料异常', path: '/sqm/abnormals', query: { abnormalNo: refId } }
    case 'SPC报警':
      // sourceRefId 存的是 SPC 告警编号 code
      return { label: 'SPC告警', path: '/spc/alarms', query: { alarmCode: refId } }
    case '不良记录':
      // sourceRefId 存的是缺陷记录主键 UUID,直接跳转不良记录详情
      return { label: '不良记录', path: `/ncm/defect-records/${refId}`, query: {} }
    default:
      return null
  }
}
