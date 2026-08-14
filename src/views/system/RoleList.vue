<template>
  <div class="role-list">
    <div class="head-b"><AppBreadcrumb /><h1>角色管理</h1></div>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="openCreate()">+ 新建角色</el-button></div>
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="roleCode" label="角色编码" width="130" />
        <el-table-column prop="roleName" label="角色名称" width="130" />
        <el-table-column prop="roleType" label="类型" width="80" />
        <el-table-column prop="permDesc" label="描述" min-width="200" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{row}"><el-button link type="primary" size="small" @click="openPerm(row as SysRole)">权限配置</el-button><el-button link type="warning" size="small" @click="openEdit(row as SysRole)">编辑</el-button><el-button link type="danger" size="small" @click="handleDelete((row as SysRole).id)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑角色':'新建角色'" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="编码" required><el-input v-model="form.roleCode" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="form.roleName" /></el-form-item>
        <el-form-item label="类型"><el-input v-model="form.roleType" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.permDesc" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/api/client'
import type { SysRole } from '@/api/types/uop'

const router = useRouter()

const list = ref<SysRole[]>([])
const loading = ref(false)
const dialogVisible = ref(false), isEdit = ref(false), editId = ref('')
const form = reactive({ roleCode: '', roleName: '', roleType: '', permDesc: '' })

async function fetch() { loading.value = true; try { list.value = await request.get<SysRole[]>('/v1/uop/roles') } finally { loading.value = false } }
function openCreate() { isEdit.value = false; editId.value = ''; Object.assign(form, { roleCode: '', roleName: '', roleType: '', permDesc: '' }); dialogVisible.value = true }
function openPerm(r: SysRole) { router.push(`/system/roles/${r.id}/perm`) }
function openEdit(r: SysRole) { isEdit.value = true; editId.value = r.id; Object.assign(form, r); dialogVisible.value = true }
async function handleSubmit() {
  if (isEdit.value) { await request.put(`/v1/uop/roles/${editId.value}`, form); ElMessage.success('已更新') }
  else { await request.post('/v1/uop/roles', form); ElMessage.success('已创建') }
  dialogVisible.value = false; fetch()
}
async function handleDelete(id: string) { await ElMessageBox.confirm('确认删除?'); await request.delete(`/v1/uop/roles/${id}`); ElMessage.success('已删除'); fetch() }
onMounted(() => fetch())
</script>

<style lang="scss" scoped>
.role-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
</style>