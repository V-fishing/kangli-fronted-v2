<template>
  <div class="spc-rules" v-loading="loading">
    <!-- ====== 页面头部 ====== -->
    <div class="head-b">
      <div class="pagenav">
        <span class="s1">S</span><span class="s1">P</span><span class="s1">C</span>
        <span class="sep">/</span>
        <span class="s2">判异规则</span>
      </div>
      <h1>判异规则配置</h1>
    </div>

    <!-- ====== WECO 8 规则卡片网格 ====== -->
    <div class="card-b" :style="{ animationDelay: '0s' }">
      <div class="card-head">
        <h2 class="card-title">WECO 规则</h2>
        <span class="hint">Western Electric Company Rules，控制用控制图的判异准则</span>
      </div>
      <div class="rule-grid">
        <div
          v-for="(rule, i) in rules"
          :key="rule.id"
          class="rule-card"
          :class="{ 'rule-card--off': !rule.isEnabled }"
          :style="{ animationDelay: (0.05 + i * 0.04) + 's' }"
        >
          <div class="rule-index mono">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="rule-body">
            <div class="rule-name">{{ rule.ruleName }}</div>
            <div class="rule-desc">{{ rule.description || (rule.ruleCode + ' · ' + rule.level) }}</div>
          </div>
          <el-switch
            :model-value="rule.isEnabled"
            :loading="togglingRuleId === rule.id"
            @change="(val: boolean) => handleToggleRule(rule, val)"
            size="default"
          />
        </div>
      </div>
    </div>

    <!-- ====== 规则触发次数统计 ====== -->
    <div class="card-b card-b--flush" :style="{ animationDelay: '0.1s' }">
      <div class="card-head">
        <h2 class="card-title">规则触发统计</h2>
        <span class="hint">最近 30 天各规则触发次数</span>
      </div>
      <div ref="triggerChartRef" class="chart-box"></div>
    </div>

    <!-- ====== 通知渠道配置 ====== -->
    <div class="card-b" :style="{ animationDelay: '0.15s' }">
      <div class="card-head">
        <h2 class="card-title">通知渠道</h2>
        <span class="hint">配置判异预警通知渠道与抑制策略</span>
      </div>
      <div class="channel-grid">
        <div
          v-for="(ch, i) in channels"
          :key="ch.id"
          class="channel-card"
          :class="{ 'channel-card--off': !ch.isEnabled }"
          :style="{ animationDelay: (0.18 + i * 0.04) + 's' }"
        >
          <div class="channel-top">
            <span class="channel-name">{{ channelLabel(ch) }}</span>
            <el-switch
              :model-value="ch.isEnabled"
              :loading="togglingChannelId === ch.id"
              @change="(val: boolean) => handleToggleChannel(ch, val)"
              size="small"
            />
          </div>
          <div class="channel-meta">
            <span class="meta-item">
              <span class="meta-key">预警级别</span>
              <span :class="levelPill(ch.alertLevel)">{{ alertLevelLabel(ch.alertLevel) }}</span>
            </span>
            <span class="meta-item" v-if="ch.supressMinutes">
              <span class="meta-key">抑制</span>
              <span class="mono">{{ ch.supressMinutes }} min</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { spcRuleApi, type SpcRuleTriggerVo } from '@/api/modules/spc/rules'
import { spcNotifyChannelApi } from '@/api/modules/spc/notify-channels'
import type { SpcRule, SpcNotifyChannel } from '@/api/types/spc'
import { ElMessage } from 'element-plus'

// ====== 状态 ======
const loading = ref(false)
const rules = ref<SpcRule[]>([])
const channels = ref<SpcNotifyChannel[]>([])
const togglingRuleId = ref<string | null>(null)
const togglingChannelId = ref<string | null>(null)

const triggerChartRef = ref<HTMLDivElement>()
let triggerChartInstance: echarts.ECharts | null = null

// ====== 工具函数 ======
const channelLabel = (ch: SpcNotifyChannel): string => {
  return ch.channel || '-'
}

const levelPill = (lvl?: string): string => {
  const map: Record<string, string> = { CRITICAL: 'pill p-lock', WARN: 'pill p-wait', INFO: 'pill p-run' }
  return map[lvl || ''] || 'pill p-mute'
}

const alertLevelLabel = (lvl?: string): string => {
  const map: Record<string, string> = { CRITICAL: '紧急', WARN: '预警', INFO: '通知' }
  return map[lvl || ''] || lvl || '-'
}

// ====== 数据加载 ======
const loadRules = async () => {
  loading.value = true
  try {
    const res = await spcRuleApi.list()
    rules.value = res || []
  } finally {
    loading.value = false
  }
}

const loadChannels = async () => {
  try {
    const res = await spcNotifyChannelApi.list()
    channels.value = res || []
  } catch {
    // 通知渠道可能还未配置，容错
  }
}

const loadTriggers = async () => {
  try {
    const res = await spcRuleApi.triggers()
    if (res) {
      await nextTick()
      renderTriggerChart(res)
    }
  } catch {
    // 无触发数据时容错
  }
}

// ====== 规则启用/停用 ======
const handleToggleRule = async (rule: SpcRule, enabled: boolean) => {
  togglingRuleId.value = rule.id
  try {
    await spcRuleApi.toggle(rule.id, enabled)
    rule.isEnabled = enabled
    ElMessage.success(`${enabled ? '已启用' : '已停用'}：${rule.ruleName}`)
  } catch {
    ElMessage.error('操作失败，请重试')
  } finally {
    togglingRuleId.value = null
  }
}

// ====== 通知渠道启用/停用 ======
const handleToggleChannel = async (ch: SpcNotifyChannel, enabled: boolean) => {
  togglingChannelId.value = ch.id
  try {
    await spcNotifyChannelApi.toggle(ch.id, enabled)
    ch.isEnabled = enabled
    ElMessage.success(`${enabled ? '已启用' : '已停用'}`)
  } catch {
    ElMessage.error('操作失败，请重试')
  } finally {
    togglingChannelId.value = null
  }
}

// ====== 触发统计图表 ======
const renderTriggerChart = (triggerData: SpcRuleTriggerVo[]) => {
  if (!triggerChartRef.value || !triggerData.length) return
  if (!triggerChartInstance) triggerChartInstance = echarts.init(triggerChartRef.value)

  const names = triggerData.map(t => t.name)
  const counts = triggerData.map(t => t.cnt)

  triggerChartInstance.setOption({
    backgroundColor: 'transparent',
    grid: { left: 140, right: 40, top: 16, bottom: 24 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#9e9e9e', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" },
      splitLine: { lineStyle: { color: '#f2f1ee' } },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: '#5c5c5c', fontSize: 12 },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [{
      type: 'bar',
      data: counts.map((v, i) => ({
        value: v,
        itemStyle: {
          color: v > 0 ? '#0047ab' : '#e4e2dd',
          borderRadius: [0, 2, 2, 0],
        },
      })),
      barWidth: 16,
      label: {
        show: true,
        position: 'right',
        fontSize: 11,
        fontFamily: "'IBM Plex Mono', monospace",
        color: '#5c5c5c',
        formatter: (p: any) => p.value > 0 ? p.value : '',
      },
    }],
  }, true)
}

// ====== Resize ======
const handleResize = () => {
  triggerChartInstance?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  loadRules()
  loadChannels()
  loadTriggers()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  triggerChartInstance?.dispose()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.spc-rules {
  animation: rise 0.4s ease both;
}

.hint {
  font-size: 12px;
  color: $ink-faint;
  margin-left: 8px;
}

// ====== 规则卡片网格 ======
.rule-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.rule-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 1px solid $hairline;
  border-radius: $radius-md;
  background: $white;
  transition: border-color 0.15s ease, opacity 0.15s ease;
  animation: rise 0.4s ease both;

  &:hover {
    border-color: $cobalt;
  }
}

.rule-card--off {
  opacity: 0.55;
  border-color: $hairline-soft;
}

.rule-index {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $cobalt-dim;
  color: $cobalt;
  border-radius: $radius-sm;
  font-size: 14px;
  font-weight: 600;
}

.rule-card--off .rule-index {
  background: $hairline-soft;
  color: $ink-faint;
}

.rule-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rule-name {
  font-size: 13px;
  font-weight: 600;
  color: $ink;
  line-height: 1.35;
}

.rule-desc {
  font-size: 11px;
  color: $ink-faint;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

// ====== 图表 ======
.chart-box {
  width: 100%;
  height: 280px;
}

// ====== 通知渠道卡片 ======
.channel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.channel-card {
  padding: 16px;
  border: 1px solid $hairline;
  border-radius: $radius-md;
  background: $white;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.15s ease, opacity 0.15s ease;
  animation: rise 0.4s ease both;

  &:hover {
    border-color: $cobalt;
  }
}

.channel-card--off {
  opacity: 0.55;
  border-color: $hairline-soft;
}

.channel-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.channel-name {
  font-size: 13px;
  font-weight: 600;
  color: $ink;
}

.channel-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-key {
  font-size: 11px;
  color: $ink-faint;
  min-width: 52px;
}

.meta-item .mono {
  font-size: 12px;
  color: $ink-soft;
}

// ====== 通用 ======
.mono {
  font-family: $font-mono;
  font-feature-settings: 'tnum';
}
</style>
