<template>
  <div class="abnormal-list">
    <div class="head-b"><div class="crumb">PATROL / 巡检管理</div><h1>巡检异常</h1></div>
    <el-card shadow="never" class="card-b">
      <el-table :data="list" v-loading="loading" size="small" border stripe style="width:100%">
        <el-table-column prop="checkpointName" label="异常点位" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="severity" label="严重度" width="80" />
        <el-table-column label="状态" width="90"><template #default="{row}"><span class="pill" :class="(row as PatlAbnormal).status==='已关闭'?'p-done':'p-wait'"><span class="d"></span>{{ (row as PatlAbnormal).status }}</span></template></el-table-column>
        <el-table-column label="操作" width="80" fixed="right"><template #default="{row}"><el-button v-if="(row as PatlAbnormal).status!=='已关闭'" link type="danger" size="small" @click="openClose(row as PatlAbnormal)">关闭</el-button></template></el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="closeVisible" title="关闭异常" width="380px">
      <el-form :model="closeForm" label-width="80px"><el-form-item label="处理备注" required><el-input v-model="closeForm.handleRemark" type="textarea" :rows="3" /></el-form-item></el-form>
      <template #footer><el-button @click="closeVisible=false">取消</el-button><el-button type="primary" @click="submitClose">确认</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { patlAbnormalApi } from '@/api/modules/patrol/abnormals'
import type { PatlAbnormal } from '@/api/types/patrol'

const list = ref<PatlAbnormal[]>([])
const loading = ref(false)
const closeVisible = ref(false), closeId = ref('')
const closeForm = reactive({ handleRemark: '' })

async function fetch() { loading.value = true; try { list.value = await patlAbnormalApi.list() } finally { loading.value = false } }
function openClose(r: PatlAbnormal) { closeId.value = r.id; closeForm.handleRemark = ''; closeVisible.value = true }
async function submitClose() { await patlAbnormalApi.close(closeId.value, { ...closeForm }); ElMessage.success('已关闭'); closeVisible.value = false; fetch() }
onMounted(() => fetch())
</script>

<style lang="scss" scoped>
.abnormal-list { width: 100%; }
.head-b { margin-bottom: 24px; }
.head-b .crumb { font-family: $font-mono; font-size: 11px; color: $ink-faint; letter-spacing: 1px; margin-bottom: 6px; }
.head-b h1 { font-family: $font-display; font-size: 28px; font-weight: 800; }
.card-b { background: $white; border: 1px solid $hairline; border-radius: 12px; }
.pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill .d { width: 6px; height: 6px; border-radius: 50%; }
.p-wait { background: $amber-dim; color: $amber; } .p-wait .d { background: $amber; }
.p-done { background: $green-dim; color: $green; } .p-done .d { background: $green; }
</style>