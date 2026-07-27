<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { request } from '@/utils/request'

const menus = ref<any[]>([])
const roleList = ref<any[]>([])
const selectedRole = ref<string>('')
const roleMenus = ref<string[]>([])
const allButtons = ref<any[]>([])       // 全部按钮权限码
const roleBtnIds = ref<string[]>([])    // 角色已选按钮
const checkedMenus = ref<string[]>([])
const checkedButtons = ref<string[]>([])
const saving = ref(false)

const menuNameById = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  const walk = (list: any[]) => list.forEach(m => {
    map[m.id] = m.menuName
    if (m.children && m.children.length) walk(m.children)
  })
  walk(menus.value)
  return map
})

const menuOptions = computed(() => {
  const opts: { id: string; name: string; depth: number }[] = []
  const walk = (list: any[], depth: number) => list.forEach(m => {
    opts.push({ id: m.id, name: m.menuName, depth })
    if (m.children && m.children.length) walk(m.children, depth + 1)
  })
  walk(menus.value, 0)
  return opts
})

const buttonGroups = computed(() => {
  const byMenu: Record<string, any[]> = {}
  allButtons.value.forEach(b => {
    const key = b.menuId || 'unknown'
    ;(byMenu[key] ||= []).push(b)
  })
  return Object.keys(byMenu).map(menuId => ({
    menuName: menuNameById.value[menuId] || menuId,
    items: byMenu[menuId]
  }))
})

const allMenusChecked = computed(() =>
  menuOptions.value.length > 0 && checkedMenus.value.length === menuOptions.value.length)

function fetchMenus() {
  return request.get('/v1/uop/menus/tree').then((d: any[]) => { menus.value = d || [] })
}
function fetchRoles() {
  return request.get('/v1/uop/roles').then((d: any[]) => {
    roleList.value = d || []
    if (roleList.value.length && !selectedRole.value) {
      selectedRole.value = roleList.value[0].id
      loadRole()
    }
  })
}
function fetchAllButtons() {
  return request.get('/v1/uop/roles/buttons').then((d: any[]) => { allButtons.value = d || [] })
}

async function loadRole() {
  if (!selectedRole.value) return
  const [rm, rb] = await Promise.all([
    request.get(`/v1/uop/roles/${selectedRole.value}/menus`).catch(() => [] as string[]),
    request.get(`/v1/uop/roles/${selectedRole.value}/buttons`).catch(() => [] as any[])
  ])
  roleMenus.value = (rm || [])
  checkedMenus.value = (rm || [])
  roleBtnIds.value = (rb || []).map((b: any) => b.id)
  checkedButtons.value = roleBtnIds.value.slice()
}

function toggleAllMenus() {
  checkedMenus.value = allMenusChecked.value ? [] : menuOptions.value.map(o => o.id)
}

async function onSave() {
  if (!selectedRole.value) return
  saving.value = true
  try {
    await request.post(`/v1/uop/roles/${selectedRole.value}/menus`, checkedMenus.value)
    await request.post(`/v1/uop/roles/${selectedRole.value}/buttons`, checkedButtons.value)
    await loadRole()
  } finally {
    saving.value = false
  }
}

onMounted(() => { fetchMenus(); fetchRoles(); fetchAllButtons() })
</script>

<template>
  <div class="perm-page">
    <header class="perm-head">
      <h2>角色权限配置</h2>
      <div class="role-pick">
        <label>角色</label>
        <select v-model="selectedRole" @change="loadRole">
          <option v-for="r in roleList" :key="r.id" :value="r.id">{{ r.roleName }}</option>
        </select>
        <button class="save" :disabled="saving" @click="onSave">{{ saving ? '保存中…' : '保存配置' }}</button>
      </div>
    </header>

    <section class="perm-block">
      <h3>
        菜单权限
        <a class="link" @click="toggleAllMenus">{{ allMenusChecked ? '取消全选' : '全选' }}</a>
      </h3>
      <div class="menu-grid">
        <label v-for="o in menuOptions" :key="o.id" class="menu-item" :style="{ paddingLeft: (o.depth * 16 + 8) + 'px' }">
          <input type="checkbox" :value="o.id" v-model="checkedMenus" />
          <span>{{ o.name }}</span>
        </label>
      </div>
    </section>

    <section class="perm-block">
      <h3>按钮权限（权限码）</h3>
      <p class="perm-tip">勾选分配给该角色的按钮权限码，保存后对应接口将受权限码保护。</p>
      <div v-if="buttonGroups.length === 0" class="empty">暂无按钮权限码</div>
      <div v-for="g in buttonGroups" :key="g.menuName" class="btn-group">
        <div class="btn-group-title">{{ g.menuName }}</div>
        <div class="btn-grid">
          <label v-for="item in g.items" :key="item.id" class="btn-chip">
            <input type="checkbox" :value="item.id" v-model="checkedButtons" />
            <span><b>{{ item.btnName }}</b> <code>{{ item.btnCode }}</code></span>
          </label>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.perm-page { padding: 18px 22px; max-width: 1180px; }
.perm-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.perm-head h2 { font-size: 18px; margin: 0; }
.role-pick { display: flex; align-items: center; gap: 10px; }
.role-pick label { color: #666; }
.role-pick select { padding: 6px 10px; border: 1px solid #d9d9d9; border-radius: 6px; min-width: 160px; }
.save { margin-left: 6px; padding: 6px 16px; border: none; border-radius: 6px; background: #2f54eb; color: #fff; cursor: pointer; }
.save:disabled { opacity: .6; cursor: default; }
.perm-block { background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; padding: 16px 18px; margin-bottom: 16px; }
.perm-block h3 { margin: 0 0 12px; font-size: 15px; display: flex; align-items: center; gap: 12px; }
.link { font-size: 13px; color: #2f54eb; cursor: pointer; font-weight: normal; }
.menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 4px 16px; }
.menu-item { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 4px; }
.menu-item:hover { background: #f5f7ff; }
.perm-tip { color: #999; font-size: 12px; margin: -4px 0 12px; }
.empty { color: #bbb; padding: 12px 0; }
.btn-group { margin-bottom: 14px; }
.btn-group-title { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 8px; padding-left: 2px; border-left: 3px solid #2f54eb; }
.btn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px 16px; }
.btn-chip { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border: 1px solid #eee; border-radius: 6px; }
.btn-chip code { color: #c7254e; background: #f7f2f4; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
</style>
