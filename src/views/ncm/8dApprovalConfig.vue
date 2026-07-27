<template>
  <div class="d8-cfg-view">
    <div class="head-b">
      <div class="left">
        <div class="crumb">NCM / 不良管理 / 配置</div>
        <h1>8D 审核配置</h1>
      </div>
      <el-button @click="goBack">返回</el-button>
    </div>

    <div class="tip">
      配置 8D 各阶段是否需要<strong>审核人签名</strong>才能进入下一阶段，以及指定的签批人（留空表示任意审核人即可）。
      配置保存后，新发起或推进的 8D 报告按此规则执行。
    </div>

    <div class="card-b">
      <div class="card-head">
        <h2>阶段签批设置</h2>
        <el-button type="primary" size="small" :loading="saving" @click="save">保存配置</el-button>
      </div>
      <el-table :data="rows" size="small" border>
        <el-table-column label="阶段" width="160">
          <template #default="{ row }">{{ row.stageCode }} · {{ stageNames[row.stageCode] }}</template>
        </el-table-column>
        <el-table-column label="需要审核人签名" width="160" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.needApproval" />
          </template>
        </el-table-column>
        <el-table-column label="指定签批人" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.signer" placeholder="留空 = 任意审核人" :disabled="!row.needApproval" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ncm8dApi } from '@/api/modules/ncm/8d-reports'
import type { D8Stage, EightDApprovalConfig } from '@/api/types/ncm'

const router = useRouter()

const ALL: D8Stage[] = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8']
const stageNames: Record<D8Stage, string> = {
  D1: '建立小组', D2: '问题描述', D3: '临时对策', D4: '根因分析',
  D5: '永久对策', D6: '对策验证', D7: '预防再发', D8: '结案',
}

const rows = ref<EightDApprovalConfig[]>([])
const saving = ref(false)

async function load() {
  try {
    const list = await ncm8dApi.getApprovalConfig()
    rows.value = (list || []).map(c => ({
      stageCode: c.stageCode,
      needApproval: !!c.needApproval,
      signer: c.signer || null,
      sortOrder: c.sortOrder,
    }))
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载配置失败')
  }
  ensureAll()
}

function ensureAll() {
  const have = new Set(rows.value.map(r => r.stageCode))
  for (const s of ALL) {
    if (!have.has(s)) rows.value.push({ stageCode: s, needApproval: false, signer: null })
  }
  rows.value.sort((a, b) => ALL.indexOf(a.stageCode) - ALL.indexOf(b.stageCode))
}

async function save() {
  saving.value = true
  try {
    await ncm8dApi.saveApprovalConfig(rows.value)
    ElMessage.success('已保存')
    await load()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(load)
</script>

<style scoped>
.d8-cfg-view { padding: 18px 24px; }
.tip { color: #6b7280; font-size: 13px; margin: 8px 0 16px; line-height: 1.6; }
.tip strong { color: #b45309; }
</style>
