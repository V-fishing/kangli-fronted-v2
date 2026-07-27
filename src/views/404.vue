<template>
  <div class="nf">
    <div class="nf-brand">
      <div class="mark"><span>KL</span></div>
      <div class="name">KONLI QMS</div>
    </div>

    <div class="nf-core">
      <div class="nf-code font-display">4<span class="zero">0</span>4</div>
      <div class="nf-rule"></div>
      <div class="nf-msg">
        <span class="en">PAGE NOT FOUND</span>
        <span class="zh">页面不存在，或该模块正在建设中</span>
      </div>
      <button class="btn-fill" @click="$router.push('/dashboard')">返回工作台</button>
    </div>

    <div class="nf-foot mono">ERROR 404 · KONLI QUALITY MANAGEMENT SYSTEM</div>
  </div>
</template>

<style lang="scss" scoped>
.nf {
  min-height: 100vh;
  background: $paper;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 48px 40px;
}
.nf-brand { display: flex; align-items: center; gap: 10px; }
.nf-brand .mark { width: 28px; height: 28px; background: $cobalt; display: flex; align-items: center; justify-content: center; }
.nf-brand .mark span { color: #fff; font-family: $font-display; font-weight: 800; font-size: 11px; }
.nf-brand .name { font-family: $font-display; font-size: 13px; font-weight: 700; letter-spacing: 3px; }

.nf-core { display: flex; flex-direction: column; align-items: center; animation: rise 0.5s ease both; }
.nf-code {
  font-size: 160px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -6px;
  color: $ink;
}
.nf-code .zero { color: $cobalt; }
.nf-rule { width: 64px; height: 3px; background: $ink; margin: 28px 0 24px; }
.nf-msg { text-align: center; margin-bottom: 32px; }
.nf-msg .en { display: block; font-family: $font-mono; font-size: 12px; letter-spacing: 4px; color: $ink-faint; margin-bottom: 8px; }
.nf-msg .zh { display: block; font-size: 14px; color: $ink-soft; }
.nf-foot { font-size: 10px; letter-spacing: 2px; color: $ink-faint; }
</style>
