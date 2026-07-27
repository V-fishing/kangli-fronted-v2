<template>
  <div class="org-view">
    <div class="head-b"><div class="crumb">SYSTEM / 系统管理</div><h1>组织管理</h1></div>
    <el-card shadow="never" class="card-b" style="margin-bottom:16px">
      <el-button type="primary" v-permission="'system.org.create'" @click="openCreate()">+ 新建</el-button>
    </el-card>
    <el-card shadow="never" class="card-b">
      <el-tree :data="treeData" :props="treeProps" default-expand-all v-loading="loading" highlight-current node-key="id">
        <template #default="{ data }">
          <span class="tree-node">
            <span>{{ data.orgName }}</span>
            <el-tag size="small" type="info" style="margin-left:8px">{{ data.orgType }}</el-tag>
            <span class="node-actions">
              <el-button link type="primary" size="small" v-permission="'system.org.create'" @click.stop="openCreate(data)">+</el-button>
              <el-button link type="danger" size="small" v-permission="'system.org.delete'" @click.stop="handleDelete(data)">x</el-button>
            </span>
          </span>
        </template>
      </el-tree>
    </el-card>
    <el-dialog v-model="dialogVisible" title="新建组织" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="编码" required><el-input v-model="form.orgCode" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="form.orgName" /></el-form-item>
        <el-form-item label="类型" required><el-select v-model="form.orgType" style="width:100%"><el-option v-for="t in ['公司','工厂','车间','产线','工位']" :key="t" :label="t" :value="t" /></el-select></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sortOrder" :min="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/api/client'
import type { OrgTreeNode } from '@/api/types/uop'

const treeData = ref<OrgTreeNode[]>([])
const loading = ref(false)
const dialogVisible = ref(false), parentId = ref<string | null>(null)
const form = reactive({ orgCode: '', orgName: '', orgType: '产线', parentId: null as string | null, sortOrder: 0 })

async function fetch() { loading.value = true; try { treeData.value = await request.get<OrgTreeNode[]>('/v1/uop/orgs/tree') } finally { loading.value = false } }
function openCreate(parent?: OrgTreeNode) { parentId.value = parent?.id || null; form.orgCode = ''; form.orgName = ''; form.orgType = '产线'; form.parentId = parent?.id || null; form.sortOrder = 0; dialogVisible.value = true }
async function handleSubmit() { await request.post('/v1/uop/orgs', { ...form }); ElMessage.success('已创建'); dialogVisible.value = false; fetch() }
async function handleDelete(node: OrgTreeNode) { await ElMessageBox.confirm('确认删除?'); await request.delete(`/v1/uop/orgs/${node.id}`); ElMessage.success('已删除'); fetch() }
onMounted(() => fetch())
</script>

<style lang="scss" scoped>
.org-view { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.tree-node { flex: 1; display: flex; align-items: center; font-size: 14px; }
.node-actions { margin-left: auto; display: none; }
.el-tree-node__content:hover .node-actions { display: inline; }
</style>