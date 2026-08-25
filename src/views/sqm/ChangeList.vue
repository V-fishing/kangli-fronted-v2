<template>
  <div class="change-list">
    <div class="head-b"><AppBreadcrumb /><h1>物料变更</h1></div>
    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <el-form :inline="true">
        <el-form-item label="状态"><el-select v-model="filterStatus" clearable placeholder="全部" style="width:120px"><el-option v-for="s in ['待申请','审批中','已批准','已驳回','已关闭','已回滚']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="page = 1; fetch()">查询</el-button></el-form-item>
        <el-form-item v-if="filterSupplierId"><el-tag closable type="warning" @close="clearSupplierFilter">供应商: {{ filterSupplierName || filterSupplierId }}</el-tag></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" v-if="canCreate" @click="openCreate()">+ 新建变更</el-button></div>
      <el-table :data="list" v-loading="loading" size="small" border stripe>
        <el-table-column prop="changeNo" label="变更编号" width="160" />
        <el-table-column prop="title" label="标题" min-width="140" show-overflow-tooltip />
        <el-table-column label="供应商" min-width="130" show-overflow-tooltip>
          <template #default="{row}"><el-link v-if="row.supplierId" type="primary" underline="never" @click="openDetail(row)">{{ row.supplierName || '—' }}</el-link><span v-else>—</span></template>
        </el-table-column>
        <el-table-column prop="partNo" label="料号" width="110"><template #default="{row}">{{ row.partNo || '—' }}</template></el-table-column>
        <el-table-column label="料号对照" min-width="130"><template #default="{row}"><span v-if="row.oldPartNo || row.newPartNo">{{ row.oldPartNo || '—' }} → {{ row.newPartNo || '—' }}</span><span v-else class="muted">—</span></template></el-table-column>
        <el-table-column prop="changeType" label="变更类型" width="90"><template #default="{row}">{{ row.changeType || '—' }}</template></el-table-column>
        <el-table-column label="评估资料" width="200">
          <template #default="{row}">
            <el-tooltip v-if="row.reason" :content="row.reason" placement="top"><el-tag size="small" type="info" style="margin-right:4px">说明</el-tag></el-tooltip>
            <el-tag v-if="row.verifyReport" size="small" type="success" style="margin-right:4px;cursor:pointer" @click="downloadFile(row.verifyReport, `验证报告-${row.changeNo}`)">验证报告 ↓</el-tag>
            <el-tag v-if="row.riskFile" size="small" type="warning" style="cursor:pointer" @click="downloadFile(row.riskFile, `风险评估-${row.changeNo}`)">风险评估 ↓</el-tag>
            <span v-if="!row.reason && !row.verifyReport && !row.riskFile" class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="风险" width="60"><template #default="{row}"><span class="pill" :class="riskClass(row.riskPreMark)">{{ row.riskPreMark || '—' }}</span></template></el-table-column>
        <el-table-column label="生效/切换" width="150"><template #default="{row}"><div>{{ row.effDate || '—' }}</div><div class="muted" style="font-size:11px">切 {{ row.switchDate || '—' }}</div></template></el-table-column>
        <el-table-column prop="urgency" label="紧急度" width="70" />
        <el-table-column label="状态" width="90"><template #default="{row}"><span class="pill" :class="changeStatusClass(row.status)"><span class="d"></span>{{ row.status }}</span></template></el-table-column>
        <el-table-column prop="applicant" label="申请人" width="100"><template #default="{row}">{{ row.applicant || '—' }}</template></el-table-column>
        <el-table-column prop="applyDate" label="申请日期" width="100" />
        <el-table-column label="客户" width="130"><template #default="{row}"><span v-if="row.customerNotify" class="pill p-run" style="margin-right:4px">需通知</span><span v-if="row.customerApproved" class="pill p-done">已批准</span><span v-if="!row.customerNotify && !row.customerApproved" class="muted">—</span></template></el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{row}">
            <el-button link type="primary" size="small" @click="goDetail(row)">详情</el-button>
            <el-button v-if="row.status==='待申请' && canSubmit" link type="primary" size="small" @click="submit(row)">提交</el-button>
            <el-button v-if="row.status==='审批中' && canApprove" link type="success" size="small" @click="openApprove(row)">审批</el-button>
            <el-button v-if="row.status==='已批准' && canClose" link type="warning" size="small" @click="closeChange(row)">关闭</el-button>
            <el-button v-if="row.status==='已批准' && canRollback" link type="danger" size="small" @click="rollback(row)">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager" v-if="total > 0">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper" :total="total"
          :page-sizes="[10, 20, 50, 100]" v-model:current-page="page" v-model:page-size="size"
          @current-change="fetch" @size-change="fetch" />
      </div>
    </el-card>

    <!-- 审批弹窗(采购/研发/质量 三方会签,任意顺序) -->
    <el-dialog v-model="approveVisible" title="三方会签审批" width="520px" append-to-body>
      <el-steps :active="approveStep" align-center style="margin-bottom:18px">
        <el-step v-for="a in approvals" :key="a.id" :title="a.roleLabel || a.approvalRole"
          :status="a.status==='done' ? 'success' : a.status==='rejected' ? 'error' : 'wait'"
          :description="a.status==='done' ? `已通过 ${a.operator || ''}` : a.status==='rejected' ? `已驳回 ${a.operator || ''}` : '待审批'" />
      </el-steps>
      <el-alert title="按「审核配置」指定的审批人签署;每个节点签一次,任一驳回即终止,全部通过即批准。" type="info" :closable="false" style="margin-bottom:14px" />
      <el-alert v-if="!myEligibleApprovals.length" title="您不在当前待审批节点的指定审批人名单内,无权审批此变更。" type="warning" :closable="false" style="margin-bottom:14px" />
      <el-form v-else :model="approveForm" label-width="80px">
        <el-form-item label="签署角色" required>
          <el-select v-model="approveForm.approvalRole" style="width:100%" placeholder="选择本次签署的角色">
            <el-option v-for="a in myEligibleApprovals" :key="a.id" :label="a.roleLabel || a.approvalRole" :value="a.approvalRole" />
          </el-select>
        </el-form-item>
        <el-form-item label="决议" required>
          <el-select v-model="approveForm.approved" style="width:100%"><el-option label="通过" :value="true" /><el-option label="驳回" :value="false" /></el-select>
        </el-form-item>
        <el-form-item label="意见"><el-input v-model="approveForm.opinion" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible=false">取消</el-button>
        <el-button type="primary" :disabled="!myEligibleApprovals.length || !approveForm.approvalRole" @click="submitApprove">签字提交</el-button>
      </template>
    </el-dialog>

    <!-- 新建弹窗 -->
    <el-dialog v-model="createVisible" title="新建变更单" width="560px" append-to-body>
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="标题" required><el-input v-model="createForm.title" /></el-form-item>
        <el-form-item label="供应商" required><el-select v-model="createForm.supplierId" filterable clearable placeholder="选择供应商" style="width:100%"><el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" /></el-select></el-form-item>
        <el-form-item label="料号"><el-select v-model="createForm.partNo" filterable remote clearable :remote-method="remoteSearchPart" :loading="partLoading" placeholder="输入料号/名称模糊搜索" style="width:100%" @change="onPartPick"><el-option v-for="p in partOptions" :key="p.partNo" :label="`${p.partNo} · ${p.productName}`" :value="p.partNo || ''" /></el-select>
          <div class="hint" v-if="partSupplierHint">该料号归属供应商: {{ partSupplierHint }}</div>
        </el-form-item>
        <el-form-item label="变更类型"><el-select v-model="createForm.changeType" style="width:100%"><el-option v-for="t in ['材料','工艺','设计','供应商','其他']" :key="t" :label="t" :value="t" /></el-select></el-form-item>
        <el-form-item label="风险"><el-select v-model="createForm.riskPreMark" style="width:100%"><el-option v-for="r in ['高','中','低']" :key="r" :label="r" :value="r" /></el-select></el-form-item>
        <el-form-item label="紧急度"><el-select v-model="createForm.urgency" style="width:100%"><el-option v-for="u in ['高','中','低']" :key="u" :label="u" :value="u" /></el-select></el-form-item>
        <el-divider content-position="left">评估资料</el-divider>
        <el-form-item label="变更说明" required><el-input v-model="createForm.reason" type="textarea" :rows="3" placeholder="变更内容、原因与影响范围" /></el-form-item>
        <el-form-item label="验证报告">
          <input ref="verifyInput" type="file" style="display:none" @change="onPick('verifyReport', $event)" />
          <el-button size="small" @click="verifyInput?.click()">选择文件上传</el-button>
          <el-tag v-if="createForm.verifyReport" size="small" type="success" closable style="margin-left:8px" @close="createForm.verifyReport=''">{{ uploadNames.verifyReport || createForm.verifyReport }}</el-tag>
        </el-form-item>
        <el-form-item label="风险评估">
          <input ref="riskInput" type="file" style="display:none" @change="onPick('riskFile', $event)" />
          <el-button size="small" @click="riskInput?.click()">选择文件上传</el-button>
          <el-tag v-if="createForm.riskFile" size="small" type="warning" closable style="margin-left:8px" @close="createForm.riskFile=''">{{ uploadNames.riskFile || createForm.riskFile }}</el-tag>
        </el-form-item>
        <el-divider content-position="left">变更对照与影响</el-divider>
        <el-form-item label="旧料号"><el-input v-model="createForm.oldPartNo" placeholder="被替换料号" /></el-form-item>
        <el-form-item label="新料号"><el-input v-model="createForm.newPartNo" placeholder="新启用料号" /></el-form-item>
        <el-form-item label="计划生效日"><el-date-picker v-model="createForm.effDate" type="date" value-format="YYYY-MM-DD" placeholder="生效日期" style="width:100%" /></el-form-item>
        <el-form-item label="切换日期"><el-date-picker v-model="createForm.switchDate" type="date" value-format="YYYY-MM-DD" placeholder="产线切换日期" style="width:100%" /></el-form-item>
        <el-form-item label="影响范围"><el-input v-model="createForm.impactDesc" type="textarea" :rows="2" placeholder="影响的机型/工序/客户" /></el-form-item>
        <el-form-item label="加严检验">
          <el-radio-group v-model="createForm.strictFlag">
            <el-radio-button :value="true">需要</el-radio-button>
            <el-radio-button :value="false">不需要</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="客户通知">
          <el-radio-group v-model="createForm.customerNotify">
            <el-radio-button :value="true">需通知</el-radio-button>
            <el-radio-button :value="false">不通知</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="客户批准">
          <el-radio-group v-model="createForm.customerApproved">
            <el-radio-button :value="true">已批准</el-radio-button>
            <el-radio-button :value="false">未批准</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="createVisible=false">取消</el-button><el-button type="primary" :loading="uploading" @click="submitCreate">确定</el-button></template>
    </el-dialog>

    <!-- 详情弹窗(含供应商反查 + 会签进度) -->
    <el-dialog v-model="detailVisible" title="变更单详情" width="640px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="变更编号">{{ detail.order.changeNo }}</el-descriptions-item>
        <el-descriptions-item label="标题">{{ detail.order.title }}</el-descriptions-item>
        <el-descriptions-item label="料号">{{ detail.order.partNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="变更类型">{{ detail.order.changeType || '—' }}</el-descriptions-item>
        <el-descriptions-item label="风险">{{ detail.order.riskPreMark || '—' }}</el-descriptions-item>
        <el-descriptions-item label="紧急度">{{ detail.order.urgency || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.order.status }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detail.order.applicant || '—' }}</el-descriptions-item>
        <el-descriptions-item label="申请日期">{{ detail.order.applyDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ detail.order.source || '—' }}</el-descriptions-item>
        <el-descriptions-item label="变更说明" :span="2">{{ detail.order.reason || '—' }}</el-descriptions-item>
        <el-descriptions-item label="评估附件" :span="2">
          <el-tag v-if="detail.order.verifyReport" size="small" type="success" style="margin-right:6px;cursor:pointer" @click="downloadFile(detail.order.verifyReport!, `验证报告-${detail.order.changeNo}`)">验证报告 ↓</el-tag>
          <el-tag v-if="detail.order.riskFile" size="small" type="warning" style="cursor:pointer" @click="downloadFile(detail.order.riskFile!, `风险评估-${detail.order.changeNo}`)">风险评估 ↓</el-tag>
          <span v-if="!detail.order.verifyReport && !detail.order.riskFile" class="muted">无</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-descriptions v-if="detail" :column="2" border size="small" style="margin-top:14px">
        <el-descriptions-item label="料号对照" :span="2">
          <span v-if="detail.order.oldPartNo || detail.order.newPartNo">{{ detail.order.oldPartNo || '—' }} → {{ detail.order.newPartNo || '—' }}</span>
          <span v-else class="muted">—</span>
        </el-descriptions-item>
        <el-descriptions-item label="计划生效日">{{ detail.order.effDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="切换日期">{{ detail.order.switchDate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="影响范围" :span="2">{{ detail.order.impactDesc || '—' }}</el-descriptions-item>
        <el-descriptions-item label="加严检验">
          <el-tag v-if="detail.order.strictFlag" size="small" type="warning">需要</el-tag>
          <el-tag v-else size="small" type="info">不需要</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户通知/批准">
          <span v-if="detail.order.customerNotify" class="pill p-run" style="margin-right:4px">需通知</span>
          <span v-if="detail.order.customerApproved" class="pill p-done">已批准</span>
          <span v-if="!detail.order.customerNotify && !detail.order.customerApproved" class="muted">—</span>
        </el-descriptions-item>
      </el-descriptions>

      <template v-if="detailSupplier">
        <el-divider content-position="left">供应商信息</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="名称">{{ detailSupplier.name }}</el-descriptions-item>
          <el-descriptions-item label="编码">{{ detailSupplier.supplierCode || detailSupplier.supplierNo || '—' }}</el-descriptions-item>
          <el-descriptions-item label="等级">{{ detailSupplier.level || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detailSupplier.status || '—' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detailSupplier.contactPerson || '—' }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ detailSupplier.contactPhone || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>

      <!-- 关联首件任务(变更 → 首件 绑定闭环入口) -->
      <template v-if="detail">
        <el-divider content-position="left">关联首件任务(FIA 验证)</el-divider>
        <div class="fia-link-bar">
          <span class="muted" v-if="!relatedFia">尚未创建关联首件任务</span>
          <el-button
            v-if="detail.order.status === '已批准' && !relatedFia && canCreateFia"
            type="primary" size="small"
            @click="goCreateFia(detail.order.id)">创建首件任务</el-button>
          <el-button
            v-if="relatedFia"
            link type="primary" size="small"
            @click="goFia(relatedFia.id)">查看首件 ›</el-button>
        </div>
        <el-table v-if="relatedFia" :data="[relatedFia]" size="small" border style="margin-top:8px">
          <el-table-column prop="code" label="任务编号" width="180" />
          <el-table-column label="类型" width="120"><template #default="{row}">{{ row.source === 'SUPPLIER' ? '供应商来料首件' : (row.source || '—') }}</template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="{row}"><span class="pill" :class="fiaStatusClass(row.status)">{{ row.status }}</span></template></el-table-column>
          <el-table-column label="结果" width="100"><template #default="{row}"><span v-if="row.overallJudge" class="pill" :class="fiaJudgeClass(row.overallJudge)">{{ row.overallJudge }}</span><span v-else class="muted">—</span></template></el-table-column>
        </el-table>
      </template>

      <div v-if="detail" class="section-title">流程线路（变更全生命周期）</div>
      <el-timeline v-if="detail">
        <el-timeline-item
          v-for="node in changeTimeline"
          :key="node.key"
          :type="node.done ? 'success' : node.aborted ? 'danger' : 'info'"
          :hollow="!node.active"
        >
          <span :class="['tl-label']">
            {{ node.label }}
            <el-tag v-if="node.done" size="small" type="success">已完成</el-tag>
            <el-tag v-else-if="node.aborted" size="small" type="danger">已终止</el-tag>
            <el-tag v-else size="small" type="info">未开始</el-tag>
          </span>
          <div v-if="node.hint" class="tl-hint">{{ node.hint }}</div>
        </el-timeline-item>
      </el-timeline>

      <template v-if="detail && detail.approvals.length">
        <el-divider content-position="left">签字进度(采购/研发/质量,任意顺序)</el-divider>
        <el-table :data="sortedApprovals" size="small" border>
          <el-table-column label="顺序" width="60"><template #default="{row}">{{ row.seqOrder || '—' }}</template></el-table-column>
          <el-table-column prop="roleLabel" label="角色" width="80" />
          <el-table-column label="状态" width="90"><template #default="{row}"><el-tag size="small" :type="row.status==='done'?'success':row.status==='rejected'?'danger':'info'">{{ row.status==='done'?'已通过':row.status==='rejected'?'已驳回':'待审批' }}</el-tag></template></el-table-column>
          <el-table-column prop="operator" label="签字人" width="110"><template #default="{row}">{{ row.operator || '—' }}</template></el-table-column>
          <el-table-column prop="operateDate" label="时间" width="160"><template #default="{row}">{{ row.operateDate ? String(row.operateDate).replace('T',' ').slice(0,16) : '—' }}</template></el-table-column>
          <el-table-column prop="opinion" label="意见" show-overflow-tooltip><template #default="{row}">{{ row.opinion || '—' }}</template></el-table-column>
        </el-table>
      </template>

      <template v-if="relatedAudits.length">
        <el-divider content-position="left">关联审核计划(双向追溯)</el-divider>
        <el-table :data="relatedAudits" size="small" border>
          <el-table-column prop="planNo" label="计划编号" width="160" />
          <el-table-column prop="auditType" label="审核类型" width="120" />
          <el-table-column label="审核组" min-width="120"><template #default="{row}">{{ row.actualAuditors || row.auditorTeam || '—' }}</template></el-table-column>
          <el-table-column label="状态" width="90"><template #default="{row}"><el-tag size="small" :type="planStatusType(row.status)">{{ row.status }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="120"><template #default="{row}"><el-button link type="primary" size="small" @click="goAudit(row.id)">查看审核 ›</el-button></template></el-table-column>
        </el-table>
      </template>

      <template v-if="detail && detail.strictInspects && detail.strictInspects.length">
        <el-divider content-position="left">加严检验(变更后验证)</el-divider>
        <el-table :data="detail.strictInspects" size="small" border>
          <el-table-column label="批次" width="70"><template #default="{row}">{{ row.seq || '—' }}/{{ row.totalSeq || '—' }}</template></el-table-column>
          <el-table-column prop="strictNo" label="加严单号" min-width="140" />
          <el-table-column prop="aqlLevel" label="AQL" width="70" />
          <el-table-column label="结果" width="90"><template #default="{row}">
            <el-tag v-if="row.result==='合格'" size="small" type="success">合格</el-tag>
            <el-tag v-else-if="row.result==='不合格'" size="small" type="danger">不合格</el-tag>
            <el-tag v-else size="small" type="info">待检</el-tag>
          </template></el-table-column>
          <el-table-column label="检验日期" width="110"><template #default="{row}">{{ row.inspectDate || '—' }}</template></el-table-column>
        </el-table>
      </template>

      <template #footer><el-button @click="detailVisible=false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { usePageSize } from '@/composables/usePageSize'
import { useRoute, useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '@/stores/permission'
import { sqmChangeApi } from '@/api/modules/sqm/changes'
import { sqmAuditApi } from '@/api/modules/sqm/audits'
import { sqmSupplierApi } from '@/api/modules/sqm/suppliers'
import { fiaTaskApi } from '@/api/modules/fia/tasks'
import { fileApi } from '@/api/modules/common/files'
import type { SqmChangeOrder, SqmChangeOrderListVo, SqmChangeOrderVo, SqmChangeApproval, SqmSupplier, SqmAuditPlan, SqmChangeStrictInspect } from '@/api/types/sqm'
import type { FiaTask, ProductSearchResult } from '@/api/types/fia'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const perm = usePermissionStore()
const canCreate = computed(() => perm.has('sqm.change.create'))
const canSubmit = computed(() => perm.has('sqm.change.submit'))
const canApprove = computed(() => perm.has('sqm.change.approve'))
const canClose = computed(() => perm.has('sqm.change.close'))
const canRollback = computed(() => perm.has('sqm.change.rollback'))
const canCreateFia = computed(() => perm.has('sqm.change.createFia'))
const list = ref<SqmChangeOrderListVo[]>([])
const loading = ref(false)
const filterStatus = ref('')
const page = ref(1), size = usePageSize(), total = ref(0)
// 从供应商详情跳转而来时按供应商过滤
const filterSupplierId = ref((route.query.supplierId as string) || '')
const filterSupplierName = ref((route.query.supplierName as string) || '')

function clearSupplierFilter() { filterSupplierId.value = ''; filterSupplierName.value = ''; router.replace({ query: {} }); page.value = 1; fetch() }

async function fetch() {
  loading.value = true
  try {
    const res = await sqmChangeApi.listPage({ status: filterStatus.value || undefined, supplierId: filterSupplierId.value || undefined, page: page.value, size: size.value })
    list.value = res.records
    total.value = res.total
  } finally { loading.value = false }
}

// ── 新建(评估资料:变更说明文本 + 验证报告/风险评估附件) ──
const createVisible = ref(false)
const uploading = ref(false)
// 料号模糊搜索
const partOptions = ref<ProductSearchResult[]>([])
const partLoading = ref(false)
const partSupplierHint = ref('')
const suppliers = ref<SqmSupplier[]>([])
const verifyInput = ref<HTMLInputElement>()
const riskInput = ref<HTMLInputElement>()
const uploadNames = reactive<{ verifyReport: string; riskFile: string }>({ verifyReport: '', riskFile: '' })
const createForm = reactive({
  title: '', supplierId: '', partNo: '', changeType: '材料',
  reason: '', verifyReport: '', riskFile: '',
  riskPreMark: '中', urgency: '中', orgId: auth.user?.orgId || '',
  oldPartNo: '', newPartNo: '', effDate: null, switchDate: null, impactDesc: '',
  strictFlag: false, customerNotify: false, customerApproved: false,
})

async function openCreate() {
  Object.assign(createForm, { title: '', supplierId: filterSupplierId.value || '', partNo: '', changeType: '材料', reason: '', verifyReport: '', riskFile: '', riskPreMark: '中', urgency: '中', orgId: auth.user?.orgId || '', oldPartNo: '', newPartNo: '', effDate: null, switchDate: null, impactDesc: '', strictFlag: false, customerNotify: false, customerApproved: false })
  uploadNames.verifyReport = ''; uploadNames.riskFile = ''
  partOptions.value = []
  partSupplierHint.value = ''
  createVisible.value = true
  if (!suppliers.value.length) { try { suppliers.value = await sqmSupplierApi.list() } catch { /* 忽略 */ } }
}

// 料号模糊搜索(远程, 复用 FIA 产品检索接口)
async function remoteSearchPart(kw: string) {
  const k = (kw || '').trim()
  if (!k) { partOptions.value = []; return }
  partLoading.value = true
  try {
    partOptions.value = await fiaTaskApi.searchProduct({ orgId: auth.user?.orgId || '', keyword: k }).catch(() => [])
  } finally { partLoading.value = false }
}

// 选中料号: 轻量提示其归属供应商, 若与已选供应商不符则告警(不自动覆盖)
function onPartPick(partNo: string) {
  const hit = (partOptions.value || []).find((p: ProductSearchResult) => p.partNo === partNo)
  if (hit && hit.matchedSupplierName) {
    partSupplierHint.value = hit.matchedSupplierName
    if (createForm.supplierId && hit.matchedSupplierId && hit.matchedSupplierId !== createForm.supplierId) {
      ElMessage.warning(`该料号归属「${hit.matchedSupplierName}」,与已选供应商不一致,请核对`)
    }
  } else {
    partSupplierHint.value = ''
  }
}

async function onPick(field: 'verifyReport' | 'riskFile', e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  uploading.value = true
  try {
    const res = await fileApi.upload(file)
    createForm[field] = res.path
    uploadNames[field] = res.fileName
    ElMessage.success('上传成功')
  } finally { uploading.value = false }
}

async function submitCreate() {
  if (!createForm.title) { ElMessage.warning('请填写标题'); return }
  if (!createForm.supplierId) { ElMessage.warning('请选择供应商'); return }
  if (!createForm.reason) { ElMessage.warning('请填写变更说明(评估资料)'); return }
  const payload: Record<string, unknown> = { ...createForm }
  // 归一化:null 日期/空字符串转为 undefined,避免 LocalDate 解析失败
  for (const k of ['effDate', 'switchDate']) {
    if (payload[k] === null || payload[k] === '') payload[k] = undefined
  }
  await sqmChangeApi.create(payload as Partial<SqmChangeOrder>)
  ElMessage.success('已创建')
  createVisible.value = false
  fetch()
}

async function submit(r: any) { await sqmChangeApi.submit(r.id); ElMessage.success('已提交,已通知采购/研发/质量三方'); fetch() }

// ── 审批(采购/研发/质量 三方会签,任意顺序) ──
const approveVisible = ref(false)
const approveId = ref('')
const approvals = ref<SqmChangeApproval[]>([])
const approveForm = reactive({ approvalRole: '', approved: true, opinion: '' })

const pendingApprovals = computed(() => approvals.value.filter(a => a.status === 'pending'))
/** 当前登录用户有资格签署的待审节点:节点 approverId 为空(兼容历史)=有权限者均可签;否则须命中其一 */
const myEligibleApprovals = computed(() => {
  const myId = auth.user?.userId
  return pendingApprovals.value.filter(a => {
    if (!a.approverId || !a.approverId.trim()) return true
    return a.approverId.split(',').map(s => s.trim()).includes(myId || '')
  })
})
const approveStep = computed(() => approvals.value.filter(a => a.status !== 'pending').length)

async function openApprove(r: any) {
  approveId.value = r.id
  approveForm.approved = true; approveForm.opinion = ''; approveForm.approvalRole = ''
  const vo = await sqmChangeApi.get(r.id)
  approvals.value = [...vo.approvals].sort((a, b) => (a.seqOrder || 99) - (b.seqOrder || 99))
  approveVisible.value = true
}

async function submitApprove() {
  const role = approveForm.approvalRole
  if (!role) { ElMessage.warning('请选择本次签署的角色'); return }
  const label = (approvals.value.find(a => a.approvalRole === role)?.roleLabel) || role
  await sqmChangeApi.approve(approveId.value, { approvalRole: role, approved: approveForm.approved, opinion: approveForm.opinion })
  ElMessage.success(approveForm.approved ? `【${label}】签字通过` : `【${label}】已驳回`)
  approveVisible.value = false
  fetch()
}

async function closeChange(r: any) { await sqmChangeApi.close(r.id); ElMessage.success('已关闭'); fetch() }
async function rollback(r: any) {
  const { value } = await ElMessageBox.prompt('请输入回滚原因', '回滚变更', { confirmButtonText: '确定', cancelButtonText: '取消' }).catch(() => ({ value: '' }))
  if (!value) return
  await sqmChangeApi.rollback(r.id, value)
  ElMessage.success('已回滚')
  fetch()
}

// ── 详情(含供应商反查) ──
const detailVisible = ref(false)
const detail = ref<SqmChangeOrderVo | null>(null)
const detailSupplier = ref<SqmSupplier | null>(null)
// 关联审核计划(双向追溯: 变更单 → 审核计划)
const relatedAudits = ref<SqmAuditPlan[]>([])
// 关联首件任务(变更 → 首件 绑定追溯):按 change_id 反查
const relatedFia = ref<FiaTask | null>(null)
const sortedApprovals = computed(() => detail.value ? [...detail.value.approvals].sort((a, b) => (a.seqOrder || 99) - (b.seqOrder || 99)) : [])

function goDetail(r: any) { router.push(`/sqm/changes/${r.id}`) }

async function openDetail(r: any) {
  detail.value = null; detailSupplier.value = null; relatedAudits.value = []; relatedFia.value = null
  detailVisible.value = true
  detail.value = await sqmChangeApi.get(r.id)
  const sid = detail.value.order.supplierId
  if (sid) { try { detailSupplier.value = await sqmSupplierApi.get(sid) } catch { detailSupplier.value = null } }
  // 双向追溯: 反查该变更单联动生成的审核计划
  try {
    relatedAudits.value = await sqmAuditApi.listByChangeId(r.id)
  } catch { relatedAudits.value = [] }
  // 变更 → 首件 绑定追溯: 按 change_id 反查关联首件
  try {
    relatedFia.value = await fiaTaskApi.byChange(r.id)
  } catch { relatedFia.value = null }
}

// 双向追溯: 跳转到关联审核计划详情
function goAudit(id: string) { router.push({ path: '/sqm/audits', query: { planId: id } }) }
// 跳转到首件创建页(携带 changeId 预填供应商/料号/品类 + 自动匹配标准)
function goCreateFia(changeId: string) { router.push({ path: '/fia/tasks/create', query: { changeId } }) }
// 跳转到关联首件详情
function goFia(id: string) { router.push(`/fia/tasks/${id}`) }
// 首件状态/判定 → StatusPill 变体(遵循 AGENTS.md 铁律,复用原型 pill 类)
function fiaStatusClass(s: string): string {
  return ({ '待检': 'p-wait', '进行中': 'p-run', '待复核': 'p-sign', '待批准': 'p-sign', '已完成': 'p-done', '已作废': 'p-mute' } as Record<string, string>)[s] || 'p-mute'
}
function fiaJudgeClass(j: string): string {
  return ({ '合格': 'p-done', '警告': 'p-run', '不合格': 'p-lock' } as Record<string, string>)[j] || 'p-mute'
}
function planStatusType(s: string): 'info' | 'success' | 'warning' | 'primary' {
  if (s === '已完成') return 'success'
  if (s === '进行中') return 'warning'
  if (s === '待执行') return 'primary'
  return 'info'
}

async function downloadFile(path: string, name: string) {
  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')) : ''
  await fileApi.download(path, name + ext)
}

function riskClass(l?: string) { return ({ '高': 'p-lock', '中': 'p-wait', '低': 'p-done' } as Record<string, string>)[l || ''] || '' }
function changeStatusClass(s: string) { return ({ '待申请': 'p-wait', '审批中': 'p-run', '已批准': 'p-done', '已驳回': 'p-lock', '已关闭': 'p-done', '已回滚': 'p-lock' } as Record<string, string>)[s] || '' }

// 主流程生命周期线(参考供应商审核详情的 timeline 样式):申请→审批中→已批准→关闭/归档
// 驳回/回滚:审批中节点标红"已终止";关闭/归档节点在已关闭·已回滚时视为完成
const CHANGE_FLOW = [
  { key: 'apply', label: '申请', hint: '变更提出' },
  { key: 'approve', label: '审批中', hint: '采购/研发/质量 三方会签(任意顺序)' },
  { key: 'approved', label: '已批准', hint: '待首件/SPC 验证' },
  { key: 'close', label: '关闭/归档', hint: '首件合格 + SPC 连续稳定后归档' },
]
const changeTimeline = computed(() => {
  const s = detail.value?.order?.status
  const aborted = s === '已驳回' || s === '已回滚'
  // activeIndex: 当前已到达的最大节点下标
  let activeIndex = 0
  if (s === '待申请') activeIndex = 0
  else if (s === '审批中') activeIndex = 1
  else if (s === '已批准') activeIndex = 2
  else if (s === '已关闭' || s === '已回滚') activeIndex = 3
  else if (aborted) activeIndex = 1
  return CHANGE_FLOW.map((n, i) => ({
    ...n,
    active: i <= activeIndex,
    done: i < activeIndex || ((s === '已关闭' || s === '已回滚') && i <= activeIndex),
    aborted: aborted && i === 1,
    type: aborted && i === 1 ? 'danger' : (i <= activeIndex ? 'success' : 'info'),
  }))
})
onMounted(async () => {
  await fetch()
  // 双向追溯: 从审核详情跳转而来时, 自动打开指定变更单详情
  const cid = route.query.changeId as string
  if (cid) {
    console.log('[ChangeList] 从审核跳转, changeId=', cid, 'list长度=', list.value.length)
    // 兼容 UUID 有无连字符两种格式, 避免历史数据格式不一致导致匹配失败
    const normCid = cid.replace(/-/g, '')
    const r = list.value.find(x => x.id.replace(/-/g, '') === normCid)
    if (r) {
      console.log('[ChangeList] 找到变更单 id=', r.id, '自动打开详情')
      openDetail(r)
    } else {
      console.warn('[ChangeList] 未找到变更单, cid=', cid, 'normCid=', normCid, '前3个id:', list.value.slice(0, 3).map(x => x.id))
      ElMessage.info('未找到对应的变更单')
    }
  }
})
</script>

<style lang="scss" scoped>
.change-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.pager { display: flex; justify-content: flex-end; margin-top: 14px; }
.muted { color: $ink-faint; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-run { background: $cobalt-dim; color: $cobalt; } .p-run .d { background: $cobalt; }
.p-lock { background: $signal-red-dim; color: $signal-red; } .p-lock .d { background: $signal-red; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
.section-title { font-weight: 600; margin: 16px 0 8px; color: $ink; }
.tl-label { display: inline-flex; align-items: center; gap: 8px; }
.tl-click { cursor: pointer; color: $cobalt; font-weight: 600; }
.tl-click:hover { text-decoration: underline; }
.tl-arrow { font-size: 12px; }
.tl-hint { color: $ink-faint; font-size: 12px; margin-top: 2px; }
.hint { color: $ink-faint; font-size: 12px; margin-top: 6px; font-family: $font-mono; }
</style>
