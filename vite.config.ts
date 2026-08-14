import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

// 康立 QMS 新前端 - 瑞士精密白主题;代理 /api -> localhost:8080(不剥离前缀)
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 全局注入瑞士精密白设计变量
        additionalData: `@use "@/styles/variables.scss" as *;`,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5174, // 避开现有 qms-web(5173)
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.23.232',
      '192.168.165.140',
      '.ngrok-free.dev', // ngrok 免费域名通配
      '.ngrok.io', // ngrok 旧域名通配
    ], // 允许 ngrok 等公网域名访问 dev server(防 DNS 重绑定校验)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 无 rewrite,不剥离 /api 前缀,直达后端 /api/v1/...
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 生产预览模式同样代理 /api 到后端,保持接口可用
      },
    },
  },
})
