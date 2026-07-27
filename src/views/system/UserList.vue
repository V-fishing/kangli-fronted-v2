<template>
  <div class="user-list">
    <div class="head-b"><div class="crumb">SYSTEM / 系统管理</div><h1>用户管理</h1></div>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="openCreate()">+ 新建用户</el-button></div>
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="status" label="状态" width="80"><template #default="{row}"><el-tag :type="(row as SysUser).status==='启用'?'success':'danger'" size="small">{{ (row as SysUser).status }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{row}">
            <el-button link type="warning" size="small" @click="openEdit(row as SysUser)">编辑</el-button>
            <el-button link type="primary" size="small" @click="openResetPwd(row as SysUser)">重置密码</el-button>
            <el-button link type="danger" size="small" @click="handleDelete((row as SysUser).id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑用户':'新建用户'" width="420px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名" required><el-input v-model="form.username" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="form.realName" /></el-form-item>
        <el-form-item v-if="!isEdit" label="密码" required><el-input v-model="form.password" type="password" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="form.status" style="width:100%"><el-option value="启用" /><el-option value="停用" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>
    <el-dialog v-model="pwdVisible" title="重置密码" width="320px">
      <el-form-item label="新密码"><el-input v-model="newPwd" type="password" /></el-form-item>
      <template #footer><el-button @click="pwdVisible=false">取消</el-button><el-button type="primary" @click="submitResetPwd">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { request } from '@/api/client'
import type { SysUser } from '@/api/types/uop'

const auth = useAuthStore()
const list = ref<SysUser[]>([])
const loading = ref(false)
const dialogVisible = ref(false), isEdit = ref(false), editId = ref('')
const form = reactive<Record<string,any>>({ username: '', realName: '', password: '', orgId: auth.user?.orgId || '', status: '启用' })
const pwdVisible = ref(false), pwdId = ref(''), newPwd = ref('')

async function fetch() { loading.value = true; try { list.value = await request.get<SysUser[]>('/v1/uop/users') } finally { loading.value = false } }
function openCreate() { isEdit.value = false; editId.value = ''; Object.assign(form, { username: '', realName: '', password: '', orgId: auth.user?.orgId || '', status: '启用' }); dialogVisible.value = true }
function openEdit(r: SysUser) { isEdit.value = true; editId.value = r.id; Object.assign(form, r); dialogVisible.value = true }
async function handleSubmit() {
  if (isEdit.value) { await request.put(`/v1/uop/users/${editId.value}`, { realName: form.realName, orgId: form.orgId, status: form.status }); ElMessage.success('已更新') }
  else { await request.post('/v1/uop/users', { username: form.username, realName: form.realName, password: form.password, orgId: form.orgId, status: form.status }); ElMessage.success('已创建') }
  dialogVisible.value = false; fetch()
}
function openResetPwd(r: SysUser) { pwdId.value = r.id; newPwd.value = ''; pwdVisible.value = true }
async function submitResetPwd() { await request.post(`/v1/uop/users/${pwdId.value}/reset-password`, { password: newPwd.value }); ElMessage.success('密码已重置'); pwdVisible.value = false }
async function handleDelete(id: string) { await ElMessageBox.confirm('确认删除?'); await request.delete(`/v1/uop/users/${id}`); ElMessage.success('已删除'); fetch() }
onMounted(() => fetch())
</script>

<style lang="scss" scoped>
.user-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
</style>