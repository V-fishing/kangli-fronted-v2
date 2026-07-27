import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupGuard } from './guard'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/BasicLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台' },
      },
      { path: 'fia', redirect: '/fia/tasks' },
      { path: 'fia/tasks', name: 'FiaTasks', component: () => import('@/views/fia/TaskList.vue'), meta: { title: '首件检验' } },
      { path: 'fia/tasks/create', name: 'FiaTaskCreate', component: () => import('@/views/fia/TaskCreate.vue'), meta: { title: '新建任务' } },
      { path: 'fia/tasks/:id', name: 'FiaTaskDetail', component: () => import('@/views/fia/TaskDetail.vue'), meta: { title: '任务详情' } },
      { path: 'fia/approvals', name: 'FiaApprovals', component: () => import('@/views/fia/ApprovalList.vue'), meta: { title: '审批单' } },
      { path: 'fia/stds', name: 'FiaStds', component: () => import('@/views/fia/StdList.vue'), meta: { title: '检验标准' } },
      { path: 'fia/triggers', name: 'FiaTriggers', component: () => import('@/views/fia/TriggerList.vue'), meta: { title: '触发类型' } },
      { path: 'spc', redirect: '/spc/params' },
      { path: 'spc/params', name: 'SpcParams', component: () => import('@/views/spc/ParamList.vue'), meta: { title: 'SPC参数' } },
      { path: 'spc/params/:id', name: 'SpcChart', component: () => import('@/views/spc/ChartView.vue'), meta: { title: '控制图' } },
      { path: 'spc/collect', name: 'SpcCollect', component: () => import('@/views/spc/CollectView.vue'), meta: { title: '数据采集' } },
      { path: 'spc/alarms', name: 'SpcAlarms', component: () => import('@/views/spc/AlarmList.vue'), meta: { title: 'SPC告警' } },
      { path: 'ncm', name: 'NcmIndex', component: () => import('@/views/ncm/NcmIndex.vue'), meta: { title: '不良管理' } },
      { path: 'ncm/defect-dicts', name: 'NcmDefectDicts', component: () => import('@/views/ncm/DefectDictList.vue'), meta: { title: '不良字典' } },
      { path: 'ncm/defect-records', name: 'NcmDefectRecords', component: () => import('@/views/ncm/DefectRecordList.vue'), meta: { title: '不良记录' } },
      { path: 'ncm/8d-reports', name: 'Ncm8dList', component: () => import('@/views/ncm/8dList.vue'), meta: { title: '8D报告' } },
      { path: 'ncm/8d-reports/:id', name: 'Ncm8dDetail', component: () => import('@/views/ncm/8dDetail.vue'), meta: { title: '8D详情' } },
      { path: 'ncm/8d-approval-config', name: 'Ncm8dApprovalConfig', component: () => import('@/views/ncm/8dApprovalConfig.vue'), meta: { title: '8D审核配置' } },
      { path: 'ncm/capas', name: 'NcmCapas', component: () => import('@/views/ncm/CapaList.vue'), meta: { title: 'CAPA' } },
      { path: 'ncm/capas/:id', name: 'NcmCapaDetail', component: () => import('@/views/ncm/CapaDetail.vue'), meta: { title: 'CAPA详情' } },
      { path: 'ncm/trend-reports', name: 'NcmTrendReports', component: () => import('@/views/ncm/TrendReport.vue'), meta: { title: '不良趋势报表' } },
      { path: 'sqm', name: 'SqmIndex', component: () => import('@/views/sqm/SupplierList.vue'), meta: { title: '供应商' } },
      { path: 'sqm/suppliers', name: 'SqmSuppliers', component: () => import('@/views/sqm/SupplierList.vue'), meta: { title: '供应商' } },
      { path: 'sqm/abnormals', name: 'SqmAbnormals', component: () => import('@/views/sqm/AbnormalList.vue'), meta: { title: '来料异常' } },
      { path: 'sqm/audits', name: 'SqmAudits', component: () => import('@/views/sqm/AuditList.vue'), meta: { title: '审核' } },
      { path: 'sqm/audits/record/:recordId', name: 'SqmAuditRecord', component: () => import('@/views/sqm/AuditRecordDetail.vue'), meta: { title: '审核记录' } },
      { path: 'system/audit-config', name: 'SqmAuditConfig', component: () => import('@/views/sqm/AuditApprovalConfig.vue'), meta: { title: '审核人员配置' } },
      { path: 'sqm/changes', name: 'SqmChanges', component: () => import('@/views/sqm/ChangeList.vue'), meta: { title: '变更' } },
      { path: 'sqm/trace', name: 'SqmTrace', component: () => import('@/views/sqm/TraceList.vue'), meta: { title: '物料追溯' } },
      { path: 'sqm/trace/view', name: 'SqmTraceView', component: () => import('@/views/sqm/TraceView.vue'), meta: { title: '物料追溯图谱' } },
      { path: 'sqm/trace/tree', redirect: '/sqm/trace/view' },
      { path: 'patrol', redirect: '/patrol/routes' },
      { path: 'patrol/routes', name: 'PatlRoutes', component: () => import('@/views/patrol/RouteList.vue'), meta: { title: '巡检路线' } },
      { path: 'patrol/tasks', name: 'PatlTasks', component: () => import('@/views/patrol/TaskList.vue'), meta: { title: '巡检任务' } },
      { path: 'patrol/abnormals', name: 'PatlAbnormals', component: () => import('@/views/patrol/AbnormalList.vue'), meta: { title: '巡检异常' } },
      { path: 'archive', redirect: '/archive/list' },
      { path: 'archive/list', name: 'ArchiveList', component: () => import('@/views/archive/ArchiveList.vue'), meta: { title: '归档查询' } },
      { path: 'system', redirect: '/system/users' },
      { path: 'system/users', name: 'SystemUsers', component: () => import('@/views/system/UserList.vue'), meta: { title: '用户管理' } },
      { path: 'system/roles', name: 'SystemRoles', component: () => import('@/views/system/RoleList.vue'), meta: { title: '角色管理' } },
      { path: 'system/roles/:id/perm', name: 'SystemRolePermission', component: () => import('@/views/system/RolePermission.vue'), meta: { title: '权限配置' } },
      { path: 'system/orgs', name: 'SystemOrgs', component: () => import('@/views/system/OrgView.vue'), meta: { title: '组织管理' } },
      { path: 'system/menus', name: 'SystemMenus', component: () => import('@/views/system/MenuList.vue'), meta: { title: '菜单管理' } },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: { public: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

setupGuard(router)

export default router
