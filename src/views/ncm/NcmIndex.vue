<template>
  <div class="ncm-index">
    <div class="head-b"><div class="crumb">NCM / 不良管理</div><h1>不良管理</h1></div>
    <div class="card-grid">
      <div class="entrance-card" @click="router.push('/ncm/defect-dicts')">
        <div class="ic ic-amber">D</div>
        <div class="t">不良字典</div>
        <div class="s">缺陷分类与编码维护</div>
      </div>
      <div class="entrance-card" @click="router.push('/ncm/defect-records')">
        <div class="ic ic-cobalt">R</div>
        <div class="t">不良记录</div>
        <div class="s">不良录入 / 多维分析 / 趋势</div>
      </div>
      <div class="entrance-card" @click="router.push('/ncm/8d-reports')">
        <div class="ic ic-red">8D</div>
        <div class="t">8D 报告</div>
        <div class="s">D1-D8 八阶段整改</div>
      </div>
      <div class="entrance-card" @click="router.push('/ncm/capas')">
        <div class="ic ic-purple">C</div>
        <div class="t">CAPA</div>
        <div class="s">纠正与预防措施</div>
      </div>
      <div class="entrance-card" @click="router.push('/ncm/trend-reports')">
        <div class="ic ic-cobalt">T</div>
        <div class="t">趋势报表</div>
        <div class="s">日/周/月不良趋势与恶化告警</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style lang="scss" scoped>
.card-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.entrance-card {
  background: $white; border: 1px solid $hairline; border-radius: 12px;
  padding: 28px 24px; cursor: pointer; transition: all 0.15s;
  box-shadow: $shadow-sm;
}
.entrance-card:hover { box-shadow: $shadow-md; transform: translateY(-2px); border-color: $cobalt; }
.entrance-card.disabled { opacity: 0.5; pointer-events: none; }
.entrance-card .ic { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: $font-display; font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.ic-amber { background: $amber-dim; color: $amber; }
.ic-cobalt { background: $cobalt-dim; color: $cobalt; }
.ic-red { background: $signal-red-dim; color: $signal-red; }
.ic-purple { background: $purple-dim; color: $purple; }
.entrance-card .t { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
.entrance-card .s { font-size: 12px; color: $ink-faint; }
</style>
