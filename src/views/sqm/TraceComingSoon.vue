<template>
  <div class="coming-soon">
    <div class="head-b"><AppBreadcrumb /><h1>供应商追溯</h1></div>
    <el-card shadow="never" class="card-b">
      <el-empty description="供应商追溯功能正在开发中">
        <el-button type="primary" @click="router.push('/sqm/suppliers')">返回供应商档案</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppBreadcrumb from '@/components/shell/AppBreadcrumb.vue'
const router = useRouter()
</script>

<style lang="scss" scoped>
.head-b { margin-bottom:24px; }
.head-b .crumb { font-family:$font-mono; font-size:11px; color:$ink-faint; letter-spacing:1px; margin-bottom:6px; }
.head-b h1 { font-family:$font-display; font-size:28px; font-weight:800; }
.card-b { background:$white; border:1px solid $hairline; border-radius:12px; }
</style>
