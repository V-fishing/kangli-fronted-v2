<template>
  <div class="menu-list">
    <div class="head-b"><AppBreadcrumb /><h1>菜单管理</h1></div>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" v-permission="'system.menu.create'" @click="openCreate()">+ 新建菜单</el-button></div>
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="menuCode" label="菜单编码" width="140" />
        <el-table-column prop="menuName" label="名称" width="120" />
        <el-table-column prop="path" label="路径" width="140" />
        <el-table-column prop="component" label="组件" width="160" />
        <el-table-column prop="sort" label="排序" width="60" />
        <el-table-column label="操作" width="80" fixed="right"><template #default="{row}"><el-button link type="danger" size="small" v-permission="'system.menu.delete'" @click="handleDelete((row as SysMenu).id)">删除</el-button></template></el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="新建菜单" width="420px" append-to-body>
      <el-form :model="form" label-width="80px">
        <el-form-item label="编码" required><el-input v-model="form.menuCode" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="form.menuName" /></el-form-item>
        <el-form-item label="路径"><el-input v-model="form.path" /></el-form-item>
        <el-form-item label="组件"><el-input v-model="form.component" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
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
import { request } from '@/api/client'
import type { SysMenu } from '@/api/types/uop'

const list = ref<SysMenu[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const form = reactive({ menuCode: '', menuName: '', path: '', component: '', sort: 0 })

async function fetch() { loading.value = true; try { list.value = await request.get<SysMenu[]>('/v1/uop/menus') } finally { loading.value = false } }
function openCreate() { Object.assign(form, { menuCode: '', menuName: '', path: '', component: '', sort: 0 }); dialogVisible.value = true }
async function handleSubmit() { await request.post('/v1/uop/menus', form); ElMessage.success('已创建'); dialogVisible.value = false; fetch() }
async function handleDelete(id: string) { await ElMessageBox.confirm('确认删除?'); await request.delete(`/v1/uop/menus/${id}`); ElMessage.success('已删除'); fetch() }
onMounted(() => fetch())
</script>

<style lang="scss" scoped>
.menu-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
</style>