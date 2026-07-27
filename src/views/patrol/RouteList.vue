<template>
  <div class="route-list">
    <div class="head-b"><div class="crumb">PATROL / 巡检管理</div><h1>巡检路线</h1></div>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="openCreate()">+ 新建路线</el-button></div>
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="routeCode" label="路线编码" width="120" />
        <el-table-column prop="routeName" label="名称" />
        <el-table-column prop="procName" label="工序" width="100" />
        <el-table-column prop="freq" label="频次" width="80" />
        <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="(row as PatlRoute).status==='启用'?'success':'info'" size="small">{{ (row as PatlRoute).status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="120" fixed="right"><template #default="{row}"><el-button link type="warning" size="small" @click="openEdit(row as PatlRoute)">编辑</el-button><el-button link type="danger" size="small" @click="handleDelete((row as PatlRoute).id)">删除</el-button></template></el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑路线':'新建路线'" width="420px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="编码"><el-input v-model="form.routeCode" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="form.routeName" /></el-form-item>
        <el-form-item label="工序"><el-input v-model="form.procName" /></el-form-item>
        <el-form-item label="频次"><el-select v-model="form.freq" style="width:100%"><el-option v-for="f in ['1次/班','1次/天','1次/周']" :key="f" :label="f" :value="f" /></el-select></el-form-item>
        <el-form-item label="状态"><el-select v-model="form.status" style="width:100%"><el-option value="启用" /><el-option value="停用" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { patlRouteApi } from '@/api/modules/patrol/routes'
import type { PatlRoute } from '@/api/types/patrol'

const auth = useAuthStore()
const list = ref<PatlRoute[]>([])
const loading = ref(false)
const dialogVisible = ref(false), isEdit = ref(false), editId = ref('')
const form = reactive({ routeCode: '', routeName: '', procName: '', freq: '1次/班', status: '启用' })

async function fetch() { loading.value = true; try { list.value = await patlRouteApi.list() } finally { loading.value = false } }
function openCreate() { isEdit.value = false; editId.value = ''; Object.assign(form, { routeCode: '', routeName: '', procName: '', freq: '1次/班', status: '启用' }); dialogVisible.value = true }
function openEdit(r: PatlRoute) { isEdit.value = true; editId.value = r.id; Object.assign(form, r); dialogVisible.value = true }
async function handleSubmit() {
  if (isEdit.value) { await patlRouteApi.update(editId.value, form); ElMessage.success('已更新') }
  else { await patlRouteApi.create({ ...form, orgId: auth.user?.orgId }); ElMessage.success('已创建') }
  dialogVisible.value = false; fetch()
}
async function handleDelete(id: string) { await ElMessageBox.confirm('确认删除?'); await patlRouteApi.delete(id); ElMessage.success('已删除'); fetch() }
onMounted(() => fetch())
</script>

<style lang="scss" scoped>
.route-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
</style>