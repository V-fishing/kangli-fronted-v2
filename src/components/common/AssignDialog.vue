<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="560px"
    append-to-body
    @open="onOpen"
    @closed="onClosed"
  >
    <el-alert
      v-if="bizNo"
      :title="alertTitle"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom:14px"
    />
    <el-form :model="form" label-width="92px">
      <el-form-item label="指派方式" required>
        <el-radio-group v-model="mode">
          <el-radio value="user">指定责任人(单人)</el-radio>
          <el-radio v-if="!props.userOnly" value="team">责任部门/角色(团队)</el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="mode === 'user'">
        <el-form-item label="指定责任人" required>
          <el-select
            v-model="form.ownerUserId"
            filterable
            clearable
            placeholder="单选系统用户作为责任人"
            style="width:100%"
            :loading="loading"
            @change="onOwnerChange"
          >
            <el-option v-for="u in users" :key="u.id" :label="u.realName || u.username || u.id" :value="u.id" />
          </el-select>
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item label="责任部门/角色" required>
          <el-select
            v-model="form.assignRoleCodes"
            multiple
            filterable
            clearable
            placeholder="可多选角色/部门"
            style="width:100%"
            :loading="loading"
          >
            <el-option v-for="r in roles" :key="r.roleCode" :label="r.roleName || r.roleCode" :value="r.roleCode" />
          </el-select>
        </el-form-item>
      </template>

      <el-form-item label="通知方式">
        <el-checkbox-group v-model="form.notifyChannels">
          <el-checkbox v-for="c in channels" :key="c.code" :value="c.code" :disabled="!c.enabled">
            {{ c.name }}{{ c.enabled ? '' : '(未配置)' }}
          </el-checkbox>
        </el-checkbox-group>
        <div v-if="channels.some(c => !c.enabled)" class="ch-hint">未配置凭据的点对点渠道不可选,可到「系统管理→通知配置」中完成配置</div>
      </el-form-item>

      <el-form-item label="指派备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="如:请48小时内完成原因分析并回复处置方案" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="confirm">确认{{ isReassign ? '改派' : '指派' }}并通知</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ncmDefectRecordApi } from '@/api/modules/ncm/defect-records'
import type { AssignCandidate, NotifyChannelCandidate } from '@/api/modules/ncm/defect-records'
import type { DefectLaunchRequest } from '@/api/modules/ncm/defect-records'

const props = defineProps<{
  /** 弹窗标题,默认"指派责任人" */
  title?: string
  /** 业务单据编号(显示用),如 D-xxxx / 8D-xxxx */
  bizNo?: string
  /** 是否改派(影响按钮文案与提示) */
  isReassign?: boolean
  /** 指派对象类型文案(如 8D/CAPA/来料异常/审核),用于提示与通知 */
  bizType?: string
  /** 仅允许单人指派(隐藏"责任部门/角色"团队模式),如 FMEA 仅支持 ownerUserId */
  userOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', body: DefectLaunchRequest): void
}>()

const visible = defineModel<boolean>({ default: false })

const mode = ref<'user' | 'team'>('user')
const submitting = ref(false)
const loading = ref(false)
const users = ref<AssignCandidate[]>([])
const roles = ref<AssignCandidate[]>([])
const channels = ref<NotifyChannelCandidate[]>([])
const form = reactive<DefectLaunchRequest>({
  ownerUserId: '',
  assignRoleCodes: [],
  notifyChannels: ['站内弹窗'],
  remark: '',
})

const alertTitle = computed(() => {
  const t = props.bizType || '单据'
  return props.bizNo
    ? `${t} ${props.bizNo}:请指定责任${mode.value === 'user' ? '人(单选)' : '部门/角色(团队)'},确认后将推送至被指派人任务中心。`
    : `请指定责任${mode.value === 'user' ? '人(单选)' : '部门/角色(团队)'},确认后将推送至被指派人任务中心。`
})

async function loadCandidates() {
  loading.value = true
  try {
    const res = await ncmDefectRecordApi.assignCandidates()
    users.value = res.users || []
    roles.value = res.roles || []
    channels.value = res.channels && res.channels.length ? res.channels : [{ code: '站内弹窗', name: '站内弹窗', enabled: true, checked: true }]
    if (!channels.value.some(c => c.code === '站内弹窗')) channels.value.unshift({ code: '站内弹窗', name: '站内弹窗', enabled: true, checked: true })
    const checked = channels.value.filter(c => c.checked).map(c => c.code)
    form.notifyChannels = checked.length ? checked : ['站内弹窗']
  } catch {
    users.value = []
    roles.value = []
    channels.value = [{ code: '站内弹窗', name: '站内弹窗', enabled: true, checked: true }]
    form.notifyChannels = ['站内弹窗']
  } finally {
    loading.value = false
  }
}

function onOwnerChange() {
  // 切换单人时清空团队选择,避免后端收到两类参数
  if (mode.value === 'user') form.assignRoleCodes = []
}
function onOpen() {
  loadCandidates()
}
function onClosed() {
  mode.value = 'user'
  form.ownerUserId = ''
  form.assignRoleCodes = []
  form.remark = ''
  submitting.value = false
}

function confirm() {
  if (mode.value === 'user' && !form.ownerUserId) {
    ElMessage.warning('请指定责任人')
    return
  }
  if (mode.value === 'team' && (!form.assignRoleCodes || !form.assignRoleCodes.length)) {
    ElMessage.warning('请至少选择一个责任部门/角色')
    return
  }
  const body: DefectLaunchRequest = {
    ownerUserId: mode.value === 'user' ? form.ownerUserId : undefined,
    assignRoleCodes: mode.value === 'team' ? form.assignRoleCodes : undefined,
    notifyChannels: form.notifyChannels && form.notifyChannels.length ? form.notifyChannels : ['站内弹窗'],
    remark: form.remark || undefined,
  }
  submitting.value = true
  emit('submit', body)
  // 父组件处理完成后关闭,这里仅给出加载态;提交成功由父组件置 visible=false
}
</script>

<style lang="scss" scoped>
.ch-hint { margin-top: 4px; color: $ink-faint; font-size: 12px; line-height: 1.5; }
</style>
