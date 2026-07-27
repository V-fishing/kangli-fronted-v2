<template>
  <div class="login-screen">
    <div class="login-left">
      <div class="brand-row">
        <div class="mark"><span>KL</span></div>
        <div class="brand-name">Konli QMS</div>
      </div>
      <div class="hero-block">
        <h1>让每一个质量决策<br /><em>有据可依</em></h1>
        <p>覆盖首件检验、SPC 过程控制、不良管理、供应商全生命周期的质量过程管理平台。为康立精密制造而生。</p>
      </div>
      <div class="metric-strip">
        <div class="m"><div class="v">94.2%</div><div class="l">本月首检通过率</div></div>
        <div class="m"><div class="v">1.41</div><div class="l">关键工序 CPK</div></div>
        <div class="m"><div class="v">23</div><div class="l">今日检验任务</div></div>
      </div>
    </div>
    <div class="login-right">
      <div class="login-form">
        <div class="greet">GOOD MORNING</div>
        <h2>登录工作台</h2>
        <form @submit.prevent="onSubmit">
          <div class="f-field">
            <label>账号</label>
            <input v-model="form.username" type="text" placeholder="工号或用户名" />
          </div>
          <div class="f-field">
            <label>密码</label>
            <input v-model="form.password" type="password" placeholder="请输入密码" />
          </div>
          <button class="login-btn" type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>
        <div class="login-note">SSO 单点登录 · JWT · v2.4.1</div>
      </div>

      <section class="login-accounts" v-if="LOGIN_GROUPS.length">
        <div class="acct-head">
          <span class="acct-title">演示账号 · 一键登录</span>
          <span class="acct-tip">点击卡片即以该身份登录（密码 123456）</span>
        </div>
        <div class="acct-group" v-for="g in LOGIN_GROUPS" :key="g.companyCode">
          <div class="acct-glabel" :style="{ color: g.accent }">
            <i class="acct-dot" :style="{ background: g.accent }"></i>{{ g.label }}
          </div>
          <div class="acct-grid">
            <button
              v-for="a in g.accounts"
              :key="a.username"
              class="acct-card"
              :style="{ '--accent': g.accent }"
              type="button"
              :disabled="loading"
              @click="quickLogin(a)"
            >
              <span class="acct-company" :style="{ background: g.accent }">{{ a.company }}</span>
              <span class="acct-name">{{ a.realName }}</span>
              <span class="acct-role">{{ a.roleName }}</span>
              <span class="acct-perm">{{ a.permDesc }}</span>
              <span class="acct-user">{{ a.username }}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { LOGIN_GROUPS } from '@/config/loginAccounts'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const form = reactive({ username: '', password: '' })
const loading = ref(false)

async function onSubmit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await auth.login(form)
    const redirect = route.query.redirect ? decodeURIComponent(route.query.redirect as string) : '/dashboard'
    router.replace(redirect)
  } catch {
    /* request.ts 已弹错误 */
  } finally {
    loading.value = false
  }
}

// 演示账号一键登录：填充账号 + 固定密码后复用真实登录链路
function quickLogin(account: { username: string }) {
  if (loading.value) return
  form.username = account.username
  form.password = '123456'
  onSubmit()
}
</script>

<style lang="scss" scoped>
.login-screen {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}
.login-left {
  background: $ink;
  color: $paper;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 56px;
  position: relative;
  overflow: hidden;
}
.login-left::after {
  content: 'QMS';
  position: absolute;
  right: -40px;
  bottom: -60px;
  font-family: $font-display;
  font-size: 280px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.04);
  letter-spacing: -10px;
  line-height: 1;
}
.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}
.brand-row .mark {
  width: 36px;
  height: 36px;
  background: $cobalt;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-row .mark span {
  color: #fff;
  font-family: $font-display;
  font-weight: 800;
  font-size: 14px;
}
.brand-name {
  font-family: $font-display;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 4px;
  text-transform: uppercase;
}
.hero-block {
  position: relative;
  z-index: 1;
}
.hero-block h1 {
  font-family: $font-display;
  font-size: 44px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.5px;
  margin-bottom: 20px;
}
.hero-block h1 em {
  font-style: normal;
  color: #6ea8ff;
}
.hero-block p {
  font-size: 14px;
  font-weight: 300;
  color: rgba(248, 247, 244, 0.6);
  line-height: 1.9;
  max-width: 380px;
}
.metric-strip {
  display: flex;
  gap: 40px;
  position: relative;
  z-index: 1;
}
.metric-strip .m .v {
  font-family: $font-mono;
  font-size: 26px;
  font-weight: 500;
}
.metric-strip .m .l {
  font-size: 11px;
  color: rgba(248, 247, 244, 0.45);
  margin-top: 4px;
  letter-spacing: 1px;
}
.login-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 56px 48px;
  overflow-y: auto;
  gap: 36px;
}
.login-accounts {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}
.acct-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.acct-title {
  font-family: $font-display;
  font-size: 15px;
  font-weight: 700;
  color: $ink;
}
.acct-tip {
  font-size: 12px;
  color: $ink-faint;
}
.acct-group {
  margin-bottom: 20px;
}
.acct-glabel {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
  font-family: $font-display;
}
.acct-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.acct-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.acct-card {
  text-align: left;
  border: 1px solid $hairline;
  background: #fff;
  border-radius: 12px;
  padding: 12px 12px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  position: relative;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  font-family: $font-body;
}
.acct-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.18s ease;
}
.acct-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(20, 20, 20, 0.1);
  border-color: var(--accent);
}
.acct-card:hover::before {
  opacity: 1;
}
.acct-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.acct-company {
  align-self: flex-start;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  font-family: $font-mono;
}
.acct-name {
  font-family: $font-display;
  font-size: 14px;
  font-weight: 700;
  color: $ink;
  margin-top: 4px;
}
.acct-role {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}
.acct-perm {
  font-size: 11px;
  color: $ink-soft;
  line-height: 1.4;
  min-height: 30px;
}
.acct-user {
  font-size: 10px;
  color: #9a9a9a;
  font-family: $font-mono;
}
.login-form {
  width: 100%;
  max-width: 380px;
  animation: rise 0.5s ease both;
}
.login-form .greet {
  font-size: 13px;
  color: $ink-faint;
  letter-spacing: 2px;
  margin-bottom: 8px;
}
.login-form h2 {
  font-family: $font-display;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 36px;
}
.f-field {
  margin-bottom: 22px;
}
.f-field label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: $ink-soft;
  margin-bottom: 8px;
}
.f-field input {
  width: 100%;
  border: none;
  border-bottom: 1.5px solid $hairline;
  background: transparent;
  padding: 10px 2px;
  font-size: 15px;
  font-family: $font-body;
  outline: none;
  transition: border-color 0.25s;
}
.f-field input:focus {
  border-bottom-color: $cobalt;
}
.login-btn {
  width: 100%;
  margin-top: 12px;
  padding: 15px;
  background: $ink;
  color: $paper;
  border: none;
  font-family: $font-display;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}
.login-btn:hover {
  background: $cobalt;
}
.login-btn:active {
  transform: scale(0.985);
}
.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.login-note {
  margin-top: 20px;
  font-size: 11px;
  color: $ink-faint;
  text-align: center;
  font-family: $font-mono;
}
@media (max-width: 1100px) {
  .login-screen {
    grid-template-columns: 1fr;
  }
  .login-left {
    display: none;
  }
}
</style>
