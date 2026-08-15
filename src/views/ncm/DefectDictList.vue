<template>
  <div class="dict-list">
    <div class="head-b"><AppBreadcrumb /><h1>不良字典</h1></div>
    <el-card shadow="never" class="card-b filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="编码"><el-input v-model="filter.code" clearable placeholder="搜索" style="width:140px" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="filter.name" clearable placeholder="搜索" style="width:160px" /></el-form-item>
        <el-form-item label="分类"><el-select v-model="filterCategory" clearable placeholder="全部" style="width:160px"><el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" @click="fetch">查询</el-button></el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="never" class="card-b">
      <div style="margin-bottom:12px"><el-button type="primary" @click="openCreate()">+ 新建字典</el-button></div>
      <el-table :data="list" v-loading="loading" size="small">
        <el-table-column prop="code" label="缺陷编码" width="120" />
        <el-table-column prop="name" label="缺陷名称" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="level" label="等级" width="80" />
        <el-table-column prop="status" label="状态" width="80"><template #default="{row}"><el-tag :type="(row as NcmDefectDict).status==='启用'?'success':'info'" size="small">{{ (row as NcmDefectDict).status }}</el-tag></template></el-table-column>
        <el-table-column prop="referenceCount" label="引用次数" width="90" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{row}">
            <el-button link type="warning" size="small" @click="openEdit(row as NcmDefectDict)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete((row as NcmDefectDict).id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑字典':'新建字典'" width="420px" append-to-body>
      <el-form :model="form" label-width="80px">
        <el-form-item label="编码" required><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="名称" required><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="如 尺寸/外观/装配/材料" /></el-form-item>
        <el-form-item label="等级"><el-select v-model="form.level" style="width:100%"><el-option v-for="l in ['严重','一般','轻微']" :key="l" :label="l" :value="l" /></el-select></el-form-item>
        <el-form-item label="状态"><el-select v-model="form.status" style="width:100%"><el-option value="启用" /><el-option value="停用" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" @click="handleSubmit">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck -- el-select v-model 与 Element Plus EpPropMergeType 严格类型不兼容,运行时正常
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
import { ncmDefectDictApi } from '@/api/modules/ncm/defect-dicts'
import type { NcmDefectDict } from '@/api/types/ncm'

const list = ref<NcmDefectDict[]>([])
const loading = ref(false)
const filter = reactive({ code: '', name: '' })
const filterCategory = ref<any>('')
const categoryOptions = computed(() => [...new Set(list.value.map(d => d.category).filter(Boolean))].sort())
const dialogVisible = ref(false), isEdit = ref(false), editId = ref('')
const form = reactive<Partial<NcmDefectDict>>({ code: '', name: '', category: '', level: '一般', status: '启用' })

async function fetch() { loading.value = true; try { const all = await ncmDefectDictApi.list(); list.value = all.filter(r => (!filter.code || r.code?.includes(filter.code)) && (!filter.name || r.name?.includes(filter.name)) && (!filterCategory.value || r.category?.includes(filterCategory.value))) } finally { loading.value = false } }
function openCreate() { isEdit.value = false; editId.value = ''; Object.assign(form, { code: '', name: '', category: '', level: '一般', status: '启用' }); dialogVisible.value = true }
function openEdit(r: NcmDefectDict) { isEdit.value = true; editId.value = r.id; Object.assign(form, r); dialogVisible.value = true }
async function handleSubmit() {
  if (isEdit.value) { await ncmDefectDictApi.update(editId.value, form); ElMessage.success('已更新') }
  else { await ncmDefectDictApi.create(form); ElMessage.success('已创建') }
  dialogVisible.value = false; fetch()
}
async function handleDelete(id: string) { await ElMessageBox.confirm('确认删除?'); await ncmDefectDictApi.delete(id); ElMessage.success('已删除'); fetch() }
onMounted(() => fetch())
</script>
