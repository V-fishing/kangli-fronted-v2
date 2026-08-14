<template>
  <div class="trigger-list">
    <div class="head-b"><AppBreadcrumb /><h1>触发类型</h1></div>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="openCreate()">+ 新建</el-button></div>
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="name" label="名称" />
        <el-table-column label="启用" width="80"><template #default="{row}"><el-switch :model-value="(row as FiaTriggerType).isEnabled" @change="(v:boolean) => toggle(row as FiaTriggerType, v)" size="small" /></template></el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button link type="warning" size="small" @click="openEdit(row as FiaTriggerType)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete((row as FiaTriggerType).id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑':'新建'" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required><el-input v-model="form.name" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { fiaTriggerApi } from '@/api/modules/fia/triggers'
import type { FiaTriggerType } from '@/api/types/fia'

const list = ref<FiaTriggerType[]>([])
const loading = ref(false)
const dialogVisible = ref(false), isEdit = ref(false), editId = ref('')
const form = reactive({ name: '' })

async function fetch() { loading.value = true; try { list.value = await fiaTriggerApi.list() } finally { loading.value = false } }
function openCreate() { isEdit.value = false; editId.value = ''; form.name = ''; dialogVisible.value = true }
function openEdit(r: FiaTriggerType) { isEdit.value = true; editId.value = r.id; form.name = r.name; dialogVisible.value = true }
async function handleSubmit() {
  if (isEdit.value) { await fiaTriggerApi.update(editId.value, { name: form.name }); ElMessage.success('已更新') }
  else { await fiaTriggerApi.create({ name: form.name }); ElMessage.success('已创建') }
  dialogVisible.value = false; fetch()
}
async function handleDelete(id: string) { await ElMessageBox.confirm('确认删除?'); await fiaTriggerApi.delete(id); ElMessage.success('已删除'); fetch() }
async function toggle(r: FiaTriggerType, v: boolean) { await fiaTriggerApi.toggle(r.id, v); ElMessage.success(v ? '已启用' : '已停用'); fetch() }
onMounted(() => fetch())
</script>

<style lang="scss" scoped>
.trigger-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
</style>