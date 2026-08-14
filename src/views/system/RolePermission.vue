<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { request } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const menus = ref<any[]>([])
const roleList = ref<any[]>([])
const selectedRole = ref<string>((route.params.id as string) || '')
const roleMenus = ref<string[]>([])            // 角色已选菜单（后端返回，用于回显信号）
const checkedMenuIds = ref<string[]>([])       // 当前勾选的菜单 id（含祖先闭包）
const allButtons = ref<any[]>([])              // 全部按钮权限码
const roleBtnIds = ref<string[]>([])
const checkedButtons = ref<string[]>([])
const saving = ref(false)
const allChecked = ref(false)

const menuNameById = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  const walk = (list: any[]) => list.forEach(m => {
    map[m.id] = m.menuName
    if (m.children && m.children.length) walk(m.children)
  })
  walk(menus.value)
  return map
})

const allMenuIds = computed<string[]>(() => {
  const ids: string[] = []
  const walk = (list: any[]) => list.forEach(m => {
    ids.push(m.id)
    if (m.children && m.children.length) walk(m.children)
  })
  walk(menus.value)
  return ids
})

// 父映射（id→parentId）与子映射（id→children），用于级联计算
const parentMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  const walk = (list: any[], pid?: string) => list.forEach(n => {
    if (pid) m[n.id] = pid
    if (n.children && n.children.length) walk(n.children, n.id)
  })
  walk(menus.value)
  return m
})
const childrenMap = computed<Record<string, any[]>>(() => {
  const m: Record<string, any[]> = {}
  const walk = (list: any[]) => list.forEach(n => {
    if (n.children && n.children.length) { m[n.id] = n.children; walk(n.children) }
  })
  walk(menus.value)
  return m
})

function subtreeIds(node: any): string[] {
  const ids: string[] = [node.id]
  if (node.children && node.children.length) node.children.forEach((c: any) => ids.push(...subtreeIds(c)))
  return ids
}
function ancestorsOf(id: string): string[] {
  const res: string[] = []
  let p = parentMap.value[id]
  while (p) { res.push(p); p = parentMap.value[p] }
  return res
}
function removeSubtree(set: Set<string>, node: any) {
  set.delete(node.id)
  if (node.children) node.children.forEach((c: any) => removeSubtree(set, c))
}
// 移除某菜单子树时，同步清除其下所有按钮（三级约束：取消二级菜单→其按钮一并取消）
function removeButtonsOfMenu(node: any) {
  const ids = new Set<string>([node.id])
  if (node.children) node.children.forEach((c: any) => {
    const sub = new Set<string>([c.id]); removeSubtree(sub, c)
    sub.forEach(i => ids.add(i))
  })
  checkedButtons.value = checkedButtons.value.filter(bid => {
    const b = allButtons.value.find(x => x.id === bid)
    return !b || !ids.has(b.menuId)
  })
}
// 向上裁剪：某父的直接子全部未选时移除该父，递归向上
function pruneAncestors(set: Set<string>, id: string) {
  let p = parentMap.value[id]
  while (p) {
    const kids = childrenMap.value[p] || []
    if (kids.length && !kids.some(k => set.has(k.id))) {
      set.delete(p)
      p = parentMap.value[p]
    } else break
  }
}

function isMenuChecked(id: string) { return checkedMenuIds.value.includes(id) }

// 顶层模块卡片勾选态
function topState(top: any): 'checked' | 'indeterminate' | 'unchecked' {
  const ids = subtreeIds(top)
  const set = new Set(checkedMenuIds.value)
  if (ids.every(i => set.has(i))) return 'checked'
  return ids.some(i => set.has(i)) ? 'indeterminate' : 'unchecked'
}

function toggleChild(node: any) {
  const set = new Set(checkedMenuIds.value)
  if (set.has(node.id)) {
    removeSubtree(set, node)
    removeButtonsOfMenu(node)
    pruneAncestors(set, node.id)
  } else {
    set.add(node.id)
    ancestorsOf(node.id).forEach(a => set.add(a))
  }
  checkedMenuIds.value = [...set]
  updateAllChecked()
}

function toggleTop(top: any) {
  const set = new Set(checkedMenuIds.value)
  const ids = subtreeIds(top)
  if (ids.every(i => set.has(i))) ids.forEach(i => set.delete(i))
  else ids.forEach(i => set.add(i))
  checkedMenuIds.value = [...set]
  updateAllChecked()
}

function updateAllChecked() {
  allChecked.value = allMenuIds.value.length > 0 && allMenuIds.value.every(i => checkedMenuIds.value.includes(i))
}

const buttonGroups = computed(() => {
  const byMenu: Record<string, any[]> = {}
  allButtons.value.forEach(b => {
    const key = b.menuId || 'unknown'
    ;(byMenu[key] ||= []).push(b)
  })
  return Object.keys(byMenu).map(menuId => ({
    menuId,
    // 优先取按钮自带菜单名（隐藏菜单不在树中，靠 listButtons 接口带出），再回退树映射
    menuName: byMenu[menuId][0]?.menuName || menuNameById.value[menuId] || menuId,
    items: byMenu[menuId]
  }))
})

// 左栏点击菜单 → 右栏按钮分组联动高亮
const activeMenuId = ref<string>('')
const allButtonCount = computed(() => allButtons.value.length)
function onMenuClick(node: any) {
  if (!node) return
  activeMenuId.value = node.id
  nextTick(() => {
    document.getElementById('btn-group-' + node.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function toggleAllMenus() {
  checkedMenuIds.value = allChecked.value ? [] : [...allMenuIds.value]
  updateAllChecked()
}

// 菜单与角色已选菜单就绪/切换时，同步回显到勾选集合
watch([menus, roleMenus], () => {
  checkedMenuIds.value = [...new Set(roleMenus.value.map(String))]
  updateAllChecked()
})

// 三级约束：勾选某按钮 → 自动选中其所属二级菜单(menuId) + 向上带一级目录壳
watch(checkedButtons, (now, before) => {
  const added = now.filter(b => !before.includes(b))
  if (!added.length) return
  const set = new Set(checkedMenuIds.value)
  let changed = false
  for (const bid of added) {
    const b = allButtons.value.find(x => x.id === bid)
    if (b && b.menuId && !set.has(b.menuId)) {
      set.add(b.menuId)
      ancestorsOf(b.menuId).forEach(a => set.add(a))
      changed = true
    }
  }
  if (changed) {
    checkedMenuIds.value = [...set]
    updateAllChecked()
  }
})

function fetchMenus() {
  return request.get('/v1/uop/menus/tree').then((d: any) => { menus.value = d || [] })
}
function fetchRoles() {
  return request.get('/v1/uop/roles').then((d: any) => {
    roleList.value = d || []
    if (roleList.value.length && !selectedRole.value) {
      selectedRole.value = roleList.value[0].id
    }
    loadRole()
  })
}
function fetchAllButtons() {
  return request.get('/v1/uop/roles/buttons').then((d: any) => { allButtons.value = d || [] })
}

async function loadRole() {
  if (!selectedRole.value) return
  const [rm, rb] = await Promise.all([
    request.get(`/v1/uop/roles/${selectedRole.value}/menus`).catch(() => [] as string[]),
    request.get(`/v1/uop/roles/${selectedRole.value}/buttons`).catch(() => [] as any[]),
  ])
  roleMenus.value = ((rm || []) as string[]).map(String)
  roleBtnIds.value = ((rb || []) as any[]).map((b: any) => b.id)
  checkedButtons.value = roleBtnIds.value.slice()
}

function onRoleChange() {
  if (selectedRole.value) {
    router.replace({ name: 'SystemRolePermission', params: { id: selectedRole.value } })
  }
  loadRole()
}

watch(() => route.params.id, (id) => {
  const rid = id as string
  if (rid && rid !== selectedRole.value) {
    selectedRole.value = rid
    loadRole()
  }
})

async function onSave() {
  if (!selectedRole.value) return
  saving.value = true
  try {
    // 提交完整闭包（含祖先），保证"选子必带父"
    await request.post(`/v1/uop/roles/${selectedRole.value}/menus`, checkedMenuIds.value)
    await request.post(`/v1/uop/roles/${selectedRole.value}/buttons`, checkedButtons.value)
    await loadRole()
    ElMessage.success('权限配置已保存')
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
        <select v-model="selectedRole" @change="onRoleChange">
          <option v-for="r in roleList" :key="r.id" :value="r.id">{{ r.roleName }}</option>
        </select>
        <button class="save" :disabled="saving" @click="onSave">{{ saving ? '保存中…' : '保存配置' }}</button>
      </div>
    </header>

    <div class="perm-body">
      <section class="perm-block">
        <h3>
          菜单权限
          <a class="link" @click="toggleAllMenus">{{ allChecked ? '取消全选' : '全选' }}</a>
        </h3>
        <p class="perm-tip">三级约束：勾选二级菜单会自动带上其一级目录（父模块）；勾选下方按钮会自动带上该按钮所属二级菜单。取消一级/二级菜单会一并取消其下所有子菜单与按钮。未勾选的子页签将不会在导航中显示。</p>
        <div class="menu-cards">
          <div class="menu-card" v-for="top in menus" :key="top.id">
            <div class="card-head">
              <label class="head-check">
                <input type="checkbox"
                       :checked="topState(top) === 'checked'"
                       :indeterminate="topState(top) === 'indeterminate'"
                       @change="toggleTop(top)" />
              </label>
              <span class="head-name" @click="onMenuClick(top)">{{ top.menuName }}</span>
            </div>
            <div class="card-body" v-if="top.children && top.children.length">
              <div class="child-item" v-for="child in top.children" :key="child.id">
                <label class="child-check">
                  <input type="checkbox" :checked="isMenuChecked(child.id)" @change="toggleChild(child)" />
                </label>
                <span class="child-name" @click="onMenuClick(child)">{{ child.menuName }}</span>
                <div class="child-sub" v-if="child.children && child.children.length">
                  <div class="sub-item" v-for="sub in child.children" :key="sub.id">
                    <label class="sub-check">
                      <input type="checkbox" :checked="isMenuChecked(sub.id)" @change="toggleChild(sub)" />
                    </label>
                    <span class="sub-name" @click="onMenuClick(sub)">{{ sub.menuName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="perm-block">
        <h3>
          按钮权限（权限码）
          <span class="count" v-if="buttonGroups.length">共 {{ allButtonCount }} 个</span>
        </h3>
        <p class="perm-tip">按钮按所属菜单分组，体现“菜单 → 按钮”的父子归属关系；勾选按钮会自动选中其所属二级菜单。勾选后保存，对应接口将受权限码保护。</p>
        <div v-if="buttonGroups.length === 0" class="empty">暂无按钮权限码</div>
        <div
          v-for="g in buttonGroups"
          :key="g.menuId"
          :id="'btn-group-' + g.menuId"
          class="btn-group"
          :class="{ active: g.menuId === activeMenuId }"
        >
          <div class="btn-group-title">
            {{ g.menuName }}
            <span class="g-count">{{ g.items.length }}</span>
          </div>
          <div class="btn-grid">
            <label v-for="item in g.items" :key="item.id" class="btn-chip">
              <input type="checkbox" :value="item.id" v-model="checkedButtons" />
              <span><b>{{ item.btnName }}</b> <code>{{ item.btnCode }}</code></span>
            </label>
          </div>
        </div>
      </section>
    </div>

  </div>
</template>

<style scoped>
.perm-page { padding: 18px 22px; max-width: 1280px; }
.perm-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
.perm-head h2 { font-size: 18px; margin: 0; }
.role-pick { display: flex; align-items: center; gap: 10px; }
.role-pick label { color: #666; }
.role-pick select { padding: 6px 10px; border: 1px solid #d9d9d9; border-radius: 6px; min-width: 160px; }
.save { margin-left: 6px; padding: 6px 16px; border: none; border-radius: 6px; background: #2f54eb; color: #fff; cursor: pointer; }
.save:disabled { opacity: .6; cursor: default; }
.perm-body { display: block; }
.perm-block { background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; padding: 16px 18px; margin-bottom: 16px; }
.perm-block h3 { margin: 0 0 12px; font-size: 15px; display: flex; align-items: center; gap: 12px; }
.link { font-size: 13px; color: #2f54eb; cursor: pointer; font-weight: normal; }
.count { font-size: 12px; color: #999; font-weight: normal; }
.perm-tip { color: #999; font-size: 12px; margin: -4px 0 12px; }
.empty { color: #bbb; padding: 12px 0; }
.menu-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
.menu-card { border: 1px solid #eef0f3; border-radius: 8px; padding: 10px 12px; background: #fafbfc; }
.card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px; }
.head-name { cursor: pointer; flex: 1; font-weight: 600; color: #333; }
.head-name:hover { color: #2f54eb; }
.head-check, .child-check, .sub-check { display: inline-flex; align-items: center; }
.card-body { padding-left: 2px; }
.child-item { margin-bottom: 6px; }
.child-name { cursor: pointer; margin-left: 4px; color: #555; }
.child-name:hover { color: #2f54eb; }
.child-sub { padding-left: 22px; margin-top: 4px; }
.sub-item { margin-bottom: 4px; }
.sub-name { cursor: pointer; margin-left: 4px; color: #777; font-size: 13px; }
.sub-name:hover { color: #2f54eb; }
.btn-group { margin-bottom: 14px; padding: 8px 10px; border-radius: 8px; border: 1px solid transparent; transition: background .2s, border-color .2s; }
.btn-group.active { background: #f3f7ff; border-color: #d6e2ff; }
.btn-group-title { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 8px; padding-left: 2px; border-left: 3px solid #2f54eb; display: flex; align-items: center; gap: 8px; }
.g-count { font-size: 11px; font-weight: normal; color: #fff; background: #2f54eb; border-radius: 10px; padding: 0 7px; line-height: 16px; }
.btn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px 16px; }
.btn-chip { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border: 1px solid #eee; border-radius: 6px; }
.btn-chip code { color: #c7254e; background: #f7f2f4; padding: 1px 5px; border-radius: 4px; font-size: 12px; }

</style>
