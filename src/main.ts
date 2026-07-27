import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { setupDirectives } from './permission/directive'
import { showError } from '@/utils/request'
// 命令式组件(ElMessage/ElMessageBox/ElNotification/ElLoading)的样式不会被按需引入插件自动注入,需手动引入
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-notification.css'
import 'element-plus/theme-chalk/el-loading.css'
import '@/styles/index.scss'
import '@/styles/element.scss'
import '@/styles/common.scss'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
for (const [key, comp] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, comp)
}
setupDirectives(app)

// 全局兜底:组件渲染/生命周期/侦听器中未捕获的错误也统一弹窗提示
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue Error]', err, info)
  showError(err instanceof Error ? err.message : '页面发生未知错误')
}

app.mount('#app')
