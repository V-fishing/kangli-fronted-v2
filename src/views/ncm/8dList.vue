<template>
  <div class="d8-list">
    <div class="head-b">
      <div class="crumb">NCM / 不良管理</div>
      <h1>8D 报告</h1>
      <el-button size="small" @click="router.push('/ncm/8d-approval-config')">审核配置</el-button>
    </div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="来源"><el-select v-model="filter.source" clearable placeholder="全部" style="width:100px"><el-option value="NCM" /><el-option value="SQM" /><el-option value="SPC" /></el-select></el-form-item>
        <el-form-item label="状态"><el-select v-model="filter.status" clearable placeholder="全部" style="width:110px"><el-option value="进行中" /><el-option value="已闭环" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="fetch">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="dialogVisible=true">+ 创建 8D</el-button></div>
      <el-table :data="list" v-loading="loading" size="small">
        <el-table-column prop="d8No" label="8D编号" width="170" />
        <el-table-column prop="source" label="来源" width="90" />
        <el-table-column label="严重度/类型" min-width="160">
          <template #default="{row}"><span class="pill" :class="(row as Qms8dReport).severity==='高'?'p-lock':''"><span class="d"></span>{{ (row as Qms8dReport).severity||'-' }} · {{ (row as Qms8dReport).flowType }}</span></template>
        </el-table-column>
        <el-table-column prop="currentStage" label="当前阶段" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{row}"><span class="pill" :class="(row as Qms8dReport).status==='已闭环'?'p-done':'p-run'"><span class="d"></span>{{ (row as Qms8dReport).status }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{row}"><el-button link type="primary" size="small" @click="router.push(`/ncm/8d-reports/${(row as Qms8dReport).id}`)">详情</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="创建 8D" width="420px">
      <el-form :model="form" label-width="80px">
        <el-input v-model="form.orgId" type="hidden" />
        <el-form-item label="类型"><el-select v-model="form.flowType" style="width:100%"><el-option value="8D" /><el-option value="简易" /></el-select></el-form-item>
        <el-form-item label="严重度"><el-select v-model="form.severity" style="width:100%"><el-option v-for="s in ['高','中','低']" :key="s" :label="s" :value="s" /></el-select></el-form-item>
        <el-form-item label="来源"><el-select v-model="form.source" style="width:100%"><el-option value="NCM" /><el-option value="SQM" /><el-option value="SPC" /></el-select></el-form-item>
        <el-form-item label="问题描述"><el-input v-model="form.issue" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="团队"><el-input v-model="form.team" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleCreate">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { ncm8dApi } from '@/api/modules/ncm/8d-reports'
import type { Qms8dReport } from '@/api/types/ncm'

const router = useRouter()
const auth = useAuthStore()
const list = ref<Qms8dReport[]>([])
const loading = ref(false), dialogVisible = ref(false)
const filter = reactive({ source: '', status: '' })
const form = reactive({ orgId: auth.user?.orgId || '', flowType: '8D', severity: '高', source: 'NCM', issue: '', team: '' })

async function fetch() { loading.value = true; try { const all = await ncm8dApi.list(); list.value = all.filter(r => (!filter.source || r.source === filter.source) && (!filter.status || r.status === filter.status)) } finally { loading.value = false } }
async function handleCreate() { await ncm8dApi.create(form); ElMessage.success('已创建'); dialogVisible.value = false; fetch() }
onMounted(() => fetch())
</script>
