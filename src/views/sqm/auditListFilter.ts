/**
 * 供应商审核列表 - 变更联动审核剔除逻辑（纯函数，供 AuditList.vue 与单测共用）
 *
 * 「物料变更审核」只能由变更单提交联动派生(changeId 由后端回填),不应手动创建,
 * 故新建弹窗的类型下拉、以及列表页的类型筛选/列表数据均剔除它,避免与变更单详情的
 * 双向追溯(变更单 → 审核计划)造成重复观感;该类型只在变更单详情页可见。
 */
export const CHANGE_LINKED_AUDIT_TYPE = '物料变更审核'

/** 类型选项(新建/筛选):剔除变更联动类型 */
export function listableAuditTypesOf(keys: string[]): string[] {
  return keys.filter(t => t !== CHANGE_LINKED_AUDIT_TYPE)
}

/**
 * 列表数据主权:仅展示自主创建的审核,剔除变更联动审核(物料变更审核),
 * 并同步修正 total(被剔除的行数从总数中扣除,避免分页条数与实际行数不一致)。
 */
export function filterAuditPlans<T extends { auditType?: string }>(
  records: T[],
  total: number,
): { list: T[]; total: number } {
  const src = records || []
  const filtered = src.filter(p => p.auditType !== CHANGE_LINKED_AUDIT_TYPE)
  return {
    list: filtered,
    total: Math.max(0, total - (src.length - filtered.length)),
  }
}