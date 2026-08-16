<template>
  <div class="org-switch">
    <el-select
      :model-value="auth.currentOrgId"
      @change="onChange"
      size="small"
      placeholder="组织视图"
      style="width: 108px"
    >
      <el-option label="全部" value="ALL" />
      <el-option v-for="o in orgs" :key="o.orgCode" :label="o.orgName" :value="o.orgCode" />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { orgApi } from '@/api/modules/uop/orgs'
import type { SysOrg } from '@/api/types/uop'

const auth = useAuthStore()
const orgs = ref<SysOrg[]>([])

onMounted(async () => {
  try {
    orgs.value = await orgApi.list()
  } catch {
    orgs.value = []
  }
})

function onChange(val: string) {
  auth.setCurrentOrg(val)
}
</script>

<style scoped>
.org-switch {
  display: flex;
  align-items: center;
  gap: 10px;
}
.org-switch :deep(.el-select__wrapper) {
  min-height: 28px;
  font-size: 12px;
}
</style>
