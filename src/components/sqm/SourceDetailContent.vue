<template>
  <div v-loading="loading" class="sdd-body">
    <el-empty v-if="!loading && Object.keys(detail).length === 0" description="未查询到源表明细" />

    <template v-for="grp in groups" :key="grp.title">
      <el-card class="sdd-group" shadow="never">
        <template #header><span class="sdd-group-title">{{ grp.title }}</span></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item
            v-for="f in grp.fields"
            :key="f.key"
            :label="f.label"
            :span="f.span || 1"
          >
            {{ format(detail[f.key]) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { sqmTraceApi } from '@/api/modules/sqm/trace'

/** 字段分组: 每个分组含 title + fields[{key(源表snake_case列名), label(中文), span?}] */
interface FieldDef { key: string; label: string; span?: number }
interface GroupDef { title: string; fields: FieldDef[] }

const SOURCE_LABEL: Record<string, string> = {
  material: '来料检验明细',
  finished: '成品检验明细',
  semi: '半成品检验明细',
  critical: '关键件绑定明细',
}

// ---- 物料表: qms.material_inspection ----
const MATERIAL_GROUPS: GroupDef[] = [
  {
    title: '基本信息',
    fields: [
      { key: 'record_no', label: '记录编号' },
      { key: 'material_category', label: '物料类别' },
      { key: 'material_code', label: '物料编码' },
      { key: 'material_name', label: '物料名称' },
      { key: 'spec_model', label: '规格型号' },
      { key: 'material_batch_no', label: '物料批次' },
      { key: 'material_barcode', label: '物料条码' },
      { key: 'supplier_code', label: '供应商编码' },
      { key: 'supplier_name', label: '供应商名称' },
      { key: 'unit', label: '单位' },
      { key: 'shelf_life_days', label: '保质期(天)' },
      { key: 'memo', label: '备注', span: 2 },
    ],
  },
  {
    title: '单据与流程',
    fields: [
      { key: 'process_no', label: '流程编号' },
      { key: 'form_version', label: '表单版本' },
      { key: 'purchase_order', label: '采购订单' },
      { key: 'po_line_no', label: '订单行号' },
      { key: 'inbound_no', label: '入库单号' },
      { key: 'receiving_no', label: '收货单号' },
      { key: 'receiving_line_no', label: '收货行号' },
      { key: 'inspection_request_no', label: '检验申请号' },
      { key: 'mes_inspection_no', label: 'MES检验号' },
      { key: 'arrival_date', label: '到货日期' },
      { key: 'is_customer_supplied', label: '客户供料' },
      { key: 'is_urgent', label: '加急' },
      { key: 'data_record_flag', label: '数据记录标识' },
    ],
  },
  {
    title: '检验与判定',
    fields: [
      { key: 'inspection_date', label: '检验日期' },
      { key: 'judgement_date', label: '判定日期' },
      { key: 'inspection_end_date', label: '检验结束日期' },
      { key: 'inspector', label: '检验员' },
      { key: 'inspection_result', label: '检验结果' },
      { key: 'judge', label: '判定' },
      { key: 'inspection_category', label: '检验类别' },
      { key: 'defect_desc', label: '缺陷描述', span: 2 },
      { key: 'handling_method', label: '处理方式' },
      { key: 'unqualified_final_status', label: '不合格终态' },
      { key: 'unqualified_review', label: '不合格复核' },
      { key: 'unqualified_review_no', label: '不合格复核单' },
      { key: 'reinspect_remark', label: '复检备注', span: 2 },
    ],
  },
  {
    title: '数量信息',
    fields: [
      { key: 'submitted_qty', label: '送检数' },
      { key: 'qualified_qty', label: '合格数' },
      { key: 'unqualified_qty', label: '不合格数' },
      { key: 'loss_qty', label: '损耗数' },
    ],
  },
  {
    title: '审核与签核',
    fields: [
      { key: 'review_status', label: '审核状态' },
      { key: 'reviewer', label: '审核人' },
      { key: 'review_date', label: '审核日期' },
      { key: 'submitter', label: '提交人' },
      { key: 'submit_date', label: '提交日期' },
      { key: 'signature_status', label: '签核状态' },
      { key: 'signature_user', label: '签核人' },
      { key: 'signature_time', label: '签核时间' },
      { key: 'signature_reason', label: '签核原因', span: 2 },
    ],
  },
  {
    title: '组织与系统',
    fields: [
      { key: 'plant_code', label: '工厂编码' },
      { key: 'plant_name', label: '工厂名称' },
      { key: 'is_valid', label: '是否有效' },
      { key: 'is_invalid', label: '是否失效' },
      { key: 'report_generated', label: '报告已生成' },
      { key: 'ext_id', label: '外部ID' },
      { key: 'last_modified_by', label: '最后修改人' },
      { key: 'remark', label: '备注', span: 2 },
    ],
  },
]

// ---- 成品表 / 半成品表: qms.finished_goods_inspection ----
const FINISHED_GROUPS: GroupDef[] = [
  {
    title: '基本信息',
    fields: [
      { key: 'report_no', label: '报告编号' },
      { key: 'production_order_no', label: '生产订单号' },
      { key: 'material_code', label: '物料编码' },
      { key: 'product_name', label: '产品名称' },
      { key: 'model_spec', label: '型号规格' },
      { key: 'prod_batch_or_sn', label: '生产批次/序列号' },
      { key: 'category', label: '类别' },
      { key: 'drug_reg_no', label: '药品注册号' },
    ],
  },
  {
    title: '检验与判定',
    fields: [
      { key: 'inspection_request_no', label: '检验申请号' },
      { key: 'inspection_result', label: '检验结果' },
      { key: 'is_urgent', label: '加急' },
      { key: 'production_date', label: '生产日期' },
      { key: 'expiry_date', label: '有效期至' },
      { key: 'inspector_name', label: '检验员' },
      { key: 'perf_test_method', label: '性能测试方法' },
      { key: 'perf_sample_batch_no', label: '性能样本批号' },
      { key: 'is_entrusted', label: '是否委托' },
    ],
  },
  {
    title: '数量信息',
    fields: [
      { key: 'submitted_qty', label: '送检数' },
      { key: 'inspected_qty', label: '检验数' },
      { key: 'qualified_qty', label: '合格数' },
      { key: 'unqualified_qty', label: '不合格数' },
      { key: 'unit', label: '单位' },
    ],
  },
  {
    title: '审核与签核',
    fields: [
      { key: 'qc_review', label: '质控审核' },
      { key: 'qc_reviewer', label: '质控审核人' },
      { key: 'qc_review_time', label: '质控审核时间' },
      { key: 'mgr_approval', label: '经理审批' },
      { key: 'mgr_representative', label: '经理代表' },
      { key: 'mgr_approval_time', label: '经理审批时间' },
      { key: 'signature_user', label: '签核人' },
      { key: 'signature_time', label: '签核时间' },
      { key: 'signature_reason', label: '签核原因', span: 2 },
    ],
  },
  {
    title: '组织与系统',
    fields: [
      { key: 'plant_code', label: '工厂编码' },
      { key: 'plant_name', label: '工厂名称' },
      { key: 'is_valid', label: '是否有效' },
      { key: 'remark', label: '备注', span: 2 },
    ],
  },
]

// ---- 半成品/关键件绑定表: qms.critical_material_binding ----
const CRITICAL_GROUPS: GroupDef[] = [
  {
    title: '产品信息',
    fields: [
      { key: 'product_barcode', label: '产品条码' },
      { key: 'product_material_no', label: '产品物料号' },
      { key: 'product_name', label: '产品名称' },
      { key: 'work_order_no', label: '工单号' },
      { key: 'work_order_qty', label: '工单数量' },
      { key: 'category', label: '类别' },
    ],
  },
  {
    title: '关键物料信息',
    fields: [
      { key: 'material_barcode', label: '物料条码' },
      { key: 'material_code', label: '物料编码' },
      { key: 'material_name', label: '物料名称' },
      { key: 'spec_model', label: '规格型号' },
    ],
  },
  {
    title: '扫描与工序',
    fields: [
      { key: 'scanner', label: '扫描人' },
      { key: 'scan_time', label: '扫描时间' },
      { key: 'process_code', label: '工序编码' },
      { key: 'process_name', label: '工序名称' },
    ],
  },
  {
    title: '状态与系统',
    fields: [
      { key: 'is_active', label: '是否启用' },
      { key: 'deactivate_operator', label: '停用操作人' },
      { key: 'deactivate_time', label: '停用时间' },
      { key: 'plant_code', label: '工厂编码' },
      { key: 'plant_name', label: '工厂名称' },
      { key: 'remark', label: '备注', span: 2 },
    ],
  },
]

const GROUP_MAP: Record<string, GroupDef[]> = {
  material: MATERIAL_GROUPS,
  finished: FINISHED_GROUPS,
  semi: FINISHED_GROUPS,
  critical: CRITICAL_GROUPS,
}

const props = defineProps<{
  sourceType: string
  bizKey: string
}>()

const loading = ref(false)
const detail = ref<Record<string, any>>({})

const groups = computed(() => GROUP_MAP[props.sourceType] || [])

function format(v: any) {
  if (v === null || v === undefined || v === '') return '-'
  return v
}

async function loadDetail() {
  const st = props.sourceType
  const key = props.bizKey
  if (!st || !key) return
  loading.value = true
  detail.value = {}
  try {
    const res = await sqmTraceApi.getSourceDetail(st, key)
    detail.value = res && typeof res === 'object' ? res : {}
  } catch (e: any) {
    detail.value = {}
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)
</script>

<style scoped>
.sdd-body { max-height: 78vh; overflow-y: auto; padding-right: 4px; }
.sdd-group { margin-bottom: 12px; }
.sdd-group-title { font-size: 13px; font-weight: 600; color: #1f2937; }
</style>
