<template>
  <div class="tr-root">
    <!-- ====== HEAD ====== -->
    <div class="head-b">
      <div>
        <div class="crumb">追溯查询 / 追溯路径 / 物料追溯 · TRACEABILITY</div>
        <h1>物料追溯</h1>
      </div>
      <div class="head-actions">
        <button class="btn-line">导出追溯报告</button>
        <button class="btn-fill" @click="goBack">返回批次列表</button>
      </div>
    </div>

    <!-- ====== 四表页签 + 方向 ====== -->
    <div class="tr-tabs">
      <button data-tab="master" :class="{on:tab==='master'}" @click="tab='master'">总表<span class="en">BATCH LEDGER</span></button>
      <button data-tab="mat"    :class="{on:tab==='mat'}"    @click="tab='mat'">物料表<span class="en">MATERIAL</span></button>
      <button data-tab="semi"   :class="{on:tab==='semi'}"   @click="tab='semi'">半成品表<span class="en">SEMI-FINISHED</span></button>
      <button data-tab="fg"     :class="{on:tab==='fg'}"     @click="tab='fg'">成品表<span class="en">FINISHED</span></button>
      <div class="tr-seg">
        <button @click="setMode('both')" :class="{on:mode==='both'}">双向</button>
        <button @click="setMode('up')"   :class="{on:mode==='up'}">上游来源</button>
        <button @click="setMode('down')" :class="{on:mode==='down'}">下游去向</button>
      </div>
    </div>

    <!-- ====== 查询栏 ====== -->
    <div class="tr-bar">
      <div class="tr-qwrap">
        <span class="tr-qlabel">SEARCH</span>
        <input class="tr-input" v-model="searchKeyword" placeholder="输入批次号、物料编码、产品名称 回车搜索…" @keyup.enter="doSearch" />
        <button class="btn-fill" style="padding:7px 16px;font-size:12px" @click="doSearch">查询</button>
      </div>
      <div v-if="errorMsg" class="tr-err">{{ errorMsg }}</div>
    </div>

    <!-- ====== 图谱 + 面板 ====== -->
    <div class="tr-layout">
      <div class="card-b">
        <div class="card-head">
          <h2>批次 × 物料行 追溯图谱</h2>
          <span class="sub">BIPARTITE GENEALOGY · {{ graphStats }}</span>
        </div>
        <div class="tr-graph" ref="graphWrap">
          <svg v-if="batches.length" class="tr-svg" :viewBox="'0 0 '+svgW+' '+svgH" ref="svgEl">
            <!-- column dividers -->
            <line v-for="d in dividers" :key="'d'+d.x" :x1="d.x" :y1="0" :x2="d.x" :y2="svgH" class="tr-div" />
            <!-- edges -->
            <g v-for="(e,ei) in edgeList" :key="'e'+ei" :class="edgeCls(e)" class="teg">
              <path :d="e.path" class="te" />
              <text v-if="e.label" :x="e.lx" :y="e.ly" class="teq">{{ e.label }}</text>
            </g>
            <!-- batch nodes -->
            <g v-for="b in batches" :key="b.id" :class="bCls(b)" class="tn" @click="focusNode(b)">
              <rect :x="b.x" :y="b.y" :width="BW" :height="BH" rx="10" class="tn-box" />
              <text :x="b.x+12" :y="b.y+22" class="tn-id">{{ b.batchNo||'—' }}</text>
              <text :x="b.x+12" :y="b.y+38" class="tn-nm">{{ b.nodeName||'—' }}</text>
              <text :x="b.x+12" :y="b.y+52" class="tn-qt">{{ b.qty!=null?b.qty+(b.unit||''):'' }}</text>
              <circle v-if="b.status" :cx="b.x+BW-12" :cy="b.y+12" r="5" :fill="sC(b.status)" />
            </g>
            <!-- row nodes -->
            <g v-for="r in rows" :key="'r'+r.id" :class="rCls(r)" class="tn tn-r" @click="focusRow(r)">
              <rect :x="r.x" :y="r.y" :width="RW" :height="RH" rx="8" class="tn-rbox" />
              <text :x="r.x+10" :y="r.y+20" class="tn-rnm">{{ r.name||'—' }}</text>
              <text :x="r.x+10" :y="r.y+34" class="tn-rqt">{{ r.qty!=null?r.qty+(r.unit||''):'' }}</text>
              <circle v-if="r.status" :cx="r.x+RW-10" :cy="r.y+10" r="4.5" :fill="sC(r.status)" />
            </g>
            <!-- column headers -->
            <text v-for="(h,hi) in colHeaders" :key="'h'+hi" :x="CX[hi]" :y="18" text-anchor="middle" class="tr-colh">{{ h }}</text>
          </svg>
          <div v-else class="tr-empty">
            <div style="text-align:center">
              <p>暂无追溯数据，可查询 物料 / 半成品 / 成品 批次开始追溯</p>
            </div>
          </div>
        </div>
        <!-- legend -->
        <div class="tr-legend">
          <span class="tr-lg"><i class="sq" style="background:var(--white);border:1px solid var(--hairline)"></i>批次节点</span>
          <span class="tr-lg"><i class="sq" style="background:var(--paper);border:1px solid var(--hairline)"></i>物料行</span>
          <span class="tr-lg-sep"></span>
          <span class="tr-lg"><i style="background:var(--green)"></i>合格</span>
          <span class="tr-lg"><i style="background:var(--amber)"></i>待检</span>
          <span class="tr-lg"><i style="background:var(--signal-red)"></i>锁定</span>
          <span class="tr-lg-sep"></span>
          <span class="tr-lg"><i class="ln" style="background:var(--cobalt)"></i>追溯路径</span>
          <span class="tr-lg"><i class="ln" style="background:var(--hairline)"></i>无关节点</span>
          <span class="tr-lg-sep"></span>
          <span class="tr-lg-note">左→右为物流方向</span>
        </div>
      </div>
      <!-- 右侧详情面板 -->
      <div class="tr-panel" v-if="activePanel">
        <div class="tr-p-head">
          <span class="tr-p-id">{{ activePanel.idSub }}</span>
          <span class="pill" style="font-size:10px" :class="activePanel.isLock?'p-lock':activePanel.isOk?'p-done':'p-wait'">
            <span class="d"></span>{{ activePanel.statusLabel }}
          </span>
        </div>
        <div class="tr-p-name">{{ activePanel.name }}</div>
        <div class="tr-p-stats">
          <div><span class="v">{{ activePanel.qty||'-' }}</span><span class="l">数量 {{ activePanel.unit||'' }}</span></div>
          <div><span class="v">{{ activePanel.linkCount }}</span><span class="l">关联节点</span></div>
        </div>
        <div class="tr-f"><span class="l">批号</span><span class="v">{{ activePanel.batchNo||'-' }}</span></div>
        <div class="tr-f"><span class="l">类型</span><span class="v">{{ activePanel.typeLabel }}</span></div>
        <div class="tr-f"><span class="l">日期</span><span class="v">{{ activePanel.date||'-' }}</span></div>
        <div class="tr-f"><span class="l">供应商</span><span class="v">{{ activePanel.supplier||'-' }}</span></div>
        <template v-if="activePanel.links.length">
          <div class="tr-mini-h">关联节点</div>
          <div v-for="(lk,i) in activePanel.links" :key="i" class="tr-mini" @click="gotoLink(lk)">{{ lk.idSub }} · {{ lk.name }} · {{ lk.type }} · {{ lk.qty }}</div>
        </template>
        <!-- 节点操作按钮 -->
        <div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn-xs btn-act" @click.stop="openDetail(focusId!)">详情</button>
          <button class="btn-xs btn-add" @click.stop="openAddChild(focusId!)">+子级</button>
          <button class="btn-xs btn-add" @click.stop="openAddSibling(focusId!)">+同级</button>
          <button class="btn-xs btn-add" @click.stop="openAddParent(focusId!)">+父级</button>
        </div>
        <div class="tr-p-tip">点击节点可切换详情</div>
      </div>
    </div>

    <!-- ====== 子集关系明细 ====== -->
    <div class="card-b" style="margin-top:22px">
      <div class="card-head"><h2>子集关系明细</h2><span class="sub">{{ relTitle }}</span></div>
      <table>
        <thead><tr><th>方向</th><th>节点类型</th><th>批号·条码</th><th>名称/物料</th><th>数量</th><th>来源·供应商</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="(r,ri) in filteredRels" :key="ri" @click="relClick(r)">
            <td><span class="tr-dir" :class="r.dir" :style="r.dir==='both'?{color:'var(--cobalt)',background:'var(--cobalt-dim)'}:{}">{{ r.dirLabel }}</span></td>
            <td><span class="tag-b">{{ r.typeLabel }}</span></td>
            <td><span class="tr-st"><i :style="{background:sC(r.status)}"></i>{{ r.code }}</span></td>
            <td>{{ r.materialName }}</td>
            <td>{{ r.qty }}</td>
            <td>{{ r.source }}</td>
            <td><span class="tr-st"><i :style="{background:sC(r.status)}"></i>{{ r.statusL }}</span></td>
            <td><button class="btn-xs" @click.stop="openDetail(r.nodeId)">详情</button></td>
          </tr>
          <tr v-if="!filteredRels.length"><td colspan="8" style="text-align:center;color:var(--ink-faint);padding:32px">暂无数据</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ====== 详情弹窗 ====== -->
    <div v-if="detailModal.show" class="tr-overlay" @click.self="detailModal.show=false"><div class="tr-dlg" style="max-width:720px;max-height:80vh;overflow-y:auto">
      <div class="card-head" style="margin-bottom:16px"><h2>节点详情</h2><button class="btn-ghost" @click="detailModal.show=false">&times;</button></div>
      <div v-if="detailModal.loading" style="text-align:center;padding:40px">加载中…</div>
      <template v-else-if="detailModal.data">
        <div class="tr-dg"><strong>基本信息</strong></div>
        <table class="tr-ft"><tbody>
          <tr><td>节点名称</td><td>{{ detailModal.data.node?.nodeName||'—' }}</td></tr>
          <tr><td>节点类型</td><td>{{ typeLabelMap[detailModal.data.node?.nodeType]||detailModal.data.node?.nodeType||'—' }}</td></tr>
          <tr><td>批号/条码</td><td>{{ detailModal.data.node?.batchNo||'—' }}</td></tr>
          <tr><td>物料编码</td><td>{{ detailModal.data.node?.materialCode||'—' }}</td></tr>
          <tr><td>物料名称</td><td>{{ detailModal.data.detail?.productName||'—' }}</td></tr>
          <tr><td>数量</td><td>{{ detailModal.data.node?.qty||0 }} {{ detailModal.data.node?.unit||'' }}</td></tr>
          <tr><td>日期</td><td>{{ detailModal.data.node?.nodeDate||'—' }}</td></tr>
          <tr><td>层级</td><td>{{ detailModal.data.node?.treeLevel??'—' }}</td></tr>
          <tr><td>有效性</td><td>{{ detailModal.data.node?.isValid||'—' }}</td></tr>
          <tr><td>资质类型</td><td>{{ detailModal.data.node?.qualificationType||'—' }}</td></tr>
          <tr><td>供应商</td><td>{{ detailModal.data.node?.nodeType==='semi'||detailModal.data.node?.nodeType==='ship'?'工厂自制':detailModal.data.supplierName||'—' }}</td></tr>
          <tr><td>备注</td><td>{{ detailModal.data.node?.remark||'—' }}</td></tr>
        </tbody></table>
        <div class="tr-dg">明细信息</div>
        <table v-if="detailModal.data.detail && Object.keys(detailModal.data.detail).length" class="tr-ft"><tbody>
          <template v-for="(v,k) in detailModal.data.detail" :key="k"><tr v-if="!['orgId','nodeId','id'].includes(k)"><td>{{ k }}</td><td>{{ fmtVal(v) }}</td></tr></template>
        </tbody></table>
        <div v-else class="tr-p-tip" style="padding:8px 0">无明细数据</div>
        <div class="tr-dg">关联节点</div>
        <div v-if="detailModal.data.parents?.length">
          <span class="tr-chip-l" style="font-size:12px">父节点：</span>
          <span v-for="p in detailModal.data.parents" :key="p.id" class="tr-chip" @click="openDetail(p.id)">{{ p.batchNo||p.nodeName||p.id }}</span>
        </div>
        <div v-if="detailModal.data.children?.length" style="margin-top:4px">
          <span class="tr-chip-l" style="font-size:12px">子节点：</span>
          <span v-for="c in detailModal.data.children" :key="c.id" class="tr-chip" @click="openDetail(c.id)">{{ c.batchNo||c.nodeName||c.id }}</span>
        </div>
        <div v-if="!detailModal.data.parents?.length&&!detailModal.data.children?.length" class="tr-p-tip" style="padding:8px 0">无关联节点</div>
      </template>
    </div></div>

    <!-- ====== 添加子级弹窗 ====== -->
    <div v-if="addChildModal.show" class="tr-overlay" @click.self="addChildModal.show=false"><div class="tr-dlg" style="max-width:540px">
      <div class="card-head" style="margin-bottom:8px"><h2>{{ addChildModal.siblingName ? '添加同级' : '添加子级' }} — {{ addChildModal.siblingName || addChildModal.targetName }}</h2><button class="btn-ghost" @click="addChildModal.show=false">&times;</button></div>
      <div class="tr-hint" style="margin-bottom:12px;padding:10px 12px;background:var(--bg-soft,#f6f8fa);border:1px solid var(--line,#e5e7eb);border-radius:8px;font-size:12.5px;color:var(--ink-faint,#666);line-height:1.6">
        <template v-if="addChildModal.siblingName">
          同级 = 与「{{ addChildModal.siblingName }}」拥有<strong>同一父级</strong>的并列节点（同一阶段/批次的并列组成项）。下方将以「{{ addChildModal.targetName }}」为父，新建一个与「{{ addChildModal.siblingName }}」并列的节点。
        </template>
        <template v-else>
          子级 = 由该节点<strong>向下游组成/消耗</strong>而产生的节点。例：来料 → 半成品，半成品即来料的子级。提交后会建立「该节点 → 新/已有子级」的组成关系。
        </template>
      </div>
      <div style="margin:12px 0;display:flex;gap:12px">
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" v-model="addChildModal.mode" value="existing"> 选择已有</label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" v-model="addChildModal.mode" value="custom"> 自定义新建</label>
      </div>
      <!-- 选择已有 -->
      <template v-if="addChildModal.mode==='existing'">
        <select v-model="addChildModal.selectedId" class="tr-sel" style="width:100%">
          <option value="">— 请选择 —</option>
          <option v-for="c in addChildModal.candidates" :key="c.id" :value="c.id" :disabled="isDescendantOf(c.id, addChildModal.targetNodeId)">{{ c.batchNo||c.nodeName||c.id }} · {{ typeLabelMap[c.nodeType]||c.nodeType }} · {{ c.nodeName }}</option>
        </select>
        <div v-if="addChildMaterial" class="tr-fg" style="margin-top:14px;display:flex;gap:10px">
          <div style="flex:1"><label>消耗数量（将扣减该物料库存）</label><input v-model.number="addChildModal.usageQty" class="tr-inp" style="width:100%" type="number" min="0" step="0.01" placeholder="必填"></div>
          <div style="flex:1"><label>单位</label><input v-model="addChildModal.unit" class="tr-inp" style="width:100%" placeholder="如 PCS"></div>
        </div>
        <div v-if="addChildMaterial" style="margin-top:8px;font-size:12px;color:var(--ink-faint)">当前物料库存：{{ addChildMaterial.qty ?? 0 }}{{ addChildMaterial.unit || '' }}</div>
      </template>
      <!-- 自定义新建 -->
      <template v-else>
        <div class="tr-fg">
          <label>节点类型</label>
          <select v-model="addChildModal.form.nodeType" class="tr-sel" style="width:100%">
            <option v-for="t in addChildModal.types" :key="t" :value="t">{{ typeLabelMap[t] }}</option>
          </select>
        </div>
        <div class="tr-fg">
          <label>节点名称</label>
          <input v-model="addChildModal.form.nodeName" class="tr-inp" style="width:100%" placeholder="输入节点名称">
        </div>
        <div class="tr-fg"><label>物料编码</label><input v-model="addChildModal.form.materialCode" class="tr-inp" style="width:100%" placeholder="物料编码(必填)"></div>
        <div class="tr-fg"><label>规格型号</label><input v-model="addChildModal.form.modelSpec" class="tr-inp" style="width:100%" placeholder="规格型号"></div>
        <template v-if="['incoming','semi','ship'].includes(addChildModal.form.nodeType)">
          <div class="tr-fg"><label>产品名称</label><input v-model="addChildModal.form.productName" class="tr-inp" style="width:100%" placeholder="产品名称(写入产品明细)"></div>
        </template>
        <template v-else-if="addChildModal.form.nodeType==='customer'">
          <div class="tr-fg"><label>客户名称</label><input v-model="addChildModal.form.customerName" class="tr-inp" style="width:100%" placeholder="客户名称"></div>
          <div class="tr-fg"><label>客户编码</label><input v-model="addChildModal.form.customerCode" class="tr-inp" style="width:100%" placeholder="客户编码"></div>
        </template>
        <div class="tr-fg">
          <label>批次号</label>
          <input v-model="addChildModal.form.batchNo" class="tr-inp" style="width:100%" placeholder="自动生成批次号">
        </div>
        <div class="tr-fg" style="display:flex;gap:8px">
          <div style="flex:1"><label>数量</label><input v-model.number="addChildModal.form.qty" class="tr-inp" style="width:100%" type="number"></div>
          <div style="flex:1"><label>单位</label><input v-model="addChildModal.form.unit" class="tr-inp" style="width:100%" placeholder="如 PCS"></div>
        </div>
        <div v-if="isMaterialType(addChildModal.form.nodeType)" class="tr-fg" style="display:flex;gap:8px">
          <div style="flex:1"><label>消耗数量（该物料被本节点消耗的量）</label><input v-model.number="addChildModal.usageQty" class="tr-inp" style="width:100%" type="number" min="0" step="0.01"></div>
          <div style="flex:1"><label>消耗单位</label><input v-model="addChildModal.unit" class="tr-inp" style="width:100%" placeholder="如 PCS"></div>
        </div>
      </template>
      <div v-if="addChildModal.loading&&!addChildModal.candidates.length" style="text-align:center;padding:20px">加载中…</div>
      <div style="margin-top:16px;text-align:right">
        <button class="tg" @click="addChildModal.show=false">取消</button>
        <button class="tg primary" style="margin-left:8px" :disabled="addChildModal.loading" @click="doAddChild">确认添加</button>
      </div>
    </div></div>

    <!-- ====== 添加父级弹窗 ====== -->
    <div v-if="addParentModal.show" class="tr-overlay" @click.self="addParentModal.show=false"><div class="tr-dlg" style="max-width:520px">
      <div class="card-head" style="margin-bottom:8px"><h2>添加父级 — {{ addParentModal.targetName }}</h2><button class="btn-ghost" @click="addParentModal.show=false">&times;</button></div>
      <div class="tr-hint" style="margin-bottom:12px;padding:10px 12px;background:var(--bg-soft,#f6f8fa);border:1px solid var(--line,#e5e7eb);border-radius:8px;font-size:12.5px;color:var(--ink-faint,#666);line-height:1.6">
        父级 = 向上游<strong>消耗该节点、将其纳入自身组成</strong>的节点。例：半成品 → 成品，成品即半成品的父级。提交后会建立「父级 → 该节点」的组成关系。
      </div>
      <div style="margin:12px 0;display:flex;gap:12px">
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" v-model="addParentModal.mode" value="custom"> 自定义新建</label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer"><input type="radio" v-model="addParentModal.mode" value="existing"> 选择已有</label>
      </div>
      <!-- 选择已有 -->
      <template v-if="addParentModal.mode==='existing'">
        <select v-model="addParentModal.selectedId" class="tr-sel" style="width:100%">
          <option value="">— 请选择 —</option>
          <option v-for="c in addParentModal.candidates" :key="c.id" :value="c.id" :disabled="isDescendantOf(addParentModal.targetNodeId, c.id)">{{ c.batchNo||c.nodeName||c.id }} · {{ typeLabelMap[c.nodeType]||c.nodeType }} · {{ c.nodeName }}</option>
        </select>
        <div v-if="addParentMaterial" class="tr-fg" style="margin-top:14px;display:flex;gap:10px">
          <div style="flex:1"><label>消耗数量（将扣减物料库存）</label><input v-model.number="addParentModal.usageQty" class="tr-inp" style="width:100%" type="number" min="0" step="0.01" placeholder="必填"></div>
          <div style="flex:1"><label>单位</label><input v-model="addParentModal.unit" class="tr-inp" style="width:100%" placeholder="如 PCS"></div>
        </div>
        <div v-if="addParentMaterial" style="margin-top:8px;font-size:12px;color:var(--ink-faint)">物料库存 — 当前节点：{{ addParentTargetStock }}；所选父级：{{ addParentSelectedStock }}</div>
      </template>
      <!-- 自定义新建 -->
      <template v-else>
        <div class="tr-fg">
          <label>节点类型</label>
          <select v-model="addParentModal.form.nodeType" class="tr-sel" style="width:100%">
            <option v-for="t in addParentModal.types" :key="t" :value="t">{{ typeLabelMap[t] }}</option>
          </select>
        </div>
        <div class="tr-fg">
          <label>节点名称</label>
          <input v-model="addParentModal.form.nodeName" class="tr-inp" style="width:100%" placeholder="输入节点名称">
        </div>
        <!-- raw: 物料编码 + 规格型号(写入 raw 明细) -->
        <template v-if="addParentModal.form.nodeType==='raw'">
          <div class="tr-fg">
            <label>物料编码</label>
            <input v-model="addParentModal.form.materialCode" class="tr-inp" style="width:100%" placeholder="物料编码">
          </div>
          <div class="tr-fg">
            <label>规格型号</label>
            <input v-model="addParentModal.form.modelSpec" class="tr-inp" style="width:100%" placeholder="规格型号">
          </div>
        </template>
        <!-- incoming/semi/ship: 产品名称(写入产品明细, 避免 product_name 为空) -->
        <template v-else-if="['incoming','semi','ship'].includes(addParentModal.form.nodeType)">
          <div class="tr-fg">
            <label>产品名称</label>
            <input v-model="addParentModal.form.productName" class="tr-inp" style="width:100%" placeholder="产品名称(写入产品明细)">
          </div>
        </template>
        <!-- customer: 客户名称 + 客户编码(写入客户明细) -->
        <template v-else-if="addParentModal.form.nodeType==='customer'">
          <div class="tr-fg">
            <label>客户名称</label>
            <input v-model="addParentModal.form.customerName" class="tr-inp" style="width:100%" placeholder="客户名称">
          </div>
          <div class="tr-fg">
            <label>客户编码</label>
            <input v-model="addParentModal.form.customerCode" class="tr-inp" style="width:100%" placeholder="客户编码">
          </div>
        </template>
        <div class="tr-fg">
          <label>批次号</label>
          <input v-model="addParentModal.form.batchNo" class="tr-inp" style="width:100%" placeholder="自动生成批次号">
        </div>
        <div class="tr-fg" style="display:flex;gap:8px">
          <div style="flex:1"><label>数量</label><input v-model.number="addParentModal.form.qty" class="tr-inp" style="width:100%" type="number"></div>
          <div style="flex:1"><label>单位</label><input v-model="addParentModal.form.unit" class="tr-inp" style="width:100%" placeholder="如 PCS"></div>
        </div>
        <div class="tr-fg">
          <label>日期</label>
          <input v-model="addParentModal.form.nodeDate" class="tr-inp" style="width:100%" type="date">
        </div>
      </template>
      <div style="margin-top:16px;text-align:right">
        <button class="tg" @click="addParentModal.show=false">取消</button>
        <button class="tg primary" style="margin-left:8px" :disabled="addParentModal.loading" @click="doAddParent">确认</button>
      </div>
    </div></div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sqmTraceApi } from '@/api/modules/sqm/trace'
import type { TraceFullTreeVO, TraceNodeTreeVO, TraceNodeFullVO, TraceNodeSearchVO, TraceLinkRef, TraceNodeType } from '@/api/types/sqm'

const route = useRoute()
const router = useRouter()

// ── state ──
const tab = ref<'master'|'mat'|'semi'|'fg'>('master')
const mode = ref<'both'|'up'|'down'>('both')
const searchKeyword = ref('')
const errorMsg = ref('')
const focusId = ref<string|null>(null)
const activeLotId = ref<string|null>(null)
const rootNodeId = ref<string|null>(null)
const treeData = ref<TraceFullTreeVO|null>(null)
const loading = ref(false)

// ── 详情弹窗 ──
const detailModal = ref({ show: false, data: null as TraceNodeFullVO|null, loading: false })

// ── 可选的子级类型（约束规则） ──
const childTypeMap:Record<string,TraceNodeType[]> = {
  incoming: ['raw'],
  raw: ['semi','ship'],
  semi: ['raw','ship'],
  ship: ['customer'],
  customer: [],
}

// ── 可选的父级类型 ──
const parentTypeMap:Record<string,TraceNodeType[]> = {
  incoming: [],
  raw: ['incoming','semi'],
  semi: ['raw'],
  ship: ['raw','semi'],
  customer: ['ship'],
}

// ── 添加子级弹窗 ──
const addChildModal = ref({ show: false, siblingName: '', targetNodeId: '', targetName: '', mode: 'existing' as 'existing'|'custom', types: [] as string[], candidates: [] as TraceNodeSearchVO[], selectedId: '', usageQty: 0 as number, unit: '', loading: false, form: { nodeType: '', nodeName: '', productName: '', materialCode: '', modelSpec: '', customerName: '', customerCode: '', batchNo: '', qty: 0, unit: '', nodeDate: '' as string, supplierId: '' } })
// ── 添加父级弹窗 ──
const addParentModal = ref({ show: false, targetNodeId: '', targetName: '', mode: 'custom' as 'custom'|'existing', types: [] as string[], candidates: [] as TraceNodeSearchVO[], selectedId: '', targetNodeType: '', usageQty: 0 as number, unit: '', targetQty: 0 as number, targetUnit: '', form: { nodeType: '', nodeName: '', productName: '', materialCode: '', modelSpec: '', customerName: '', customerCode: '', batchNo: '', qty: 0, unit: '', nodeDate: '' as string, supplierId: '' }, loading: false })
// 物料类节点(挂接时会消耗其来源批次库存)
function isMaterialType(t?: string) { return t === 'raw' || t === 'incoming' }
// 添加子级: 所选子级若为来料/物料, 则需输入消耗数量
const addChildMaterial = computed(() => {
  const m = addChildModal.value
  const c = m.candidates.find(x => x.id === m.selectedId)
  return c && isMaterialType(c.nodeType) ? c : null
})
// 添加父级(选择已有): 当前节点或所选父级任一为来料/物料, 则需输入消耗数量
const addParentMaterial = computed(() => {
  const m = addParentModal.value
  const t = m.candidates.find(x => x.id === m.selectedId)
  return isMaterialType(m.targetNodeType) || (t != null && isMaterialType(t.nodeType))
})
const addParentTargetStock = computed(() => {
  const m = addParentModal.value
  return `${m.targetQty ?? 0}${m.targetUnit || ''}`
})
const addParentSelectedStock = computed(() => {
  const m = addParentModal.value
  const c = m.candidates.find(x => x.id === m.selectedId)
  return c ? `${c.qty ?? 0}${c.unit || ''}` : '—'
})

// ── SVG constants (exact match reference HTML) ──
const CX = [100, 290, 480, 670, 860, 1050] as const
const BW = 180; const BH = 58; const RW = 150; const RH = 44
const ROWH = 110; const ARC = 60
const colHeaders = ['来料批','物料行·条码','半成品批','半成品行·条码','成品批','成品行·条码']

// ── Graph types ──
interface GraphBatch { id:string;col:number;rowIdx:number;x:number;y:number;batchNo?:string;nodeName?:string;qty?:number;unit?:string;status?:string;supplier?:string;nodeType?:string;nodeDate?:string;treeNode?:TraceNodeTreeVO;childIds:string[] }
interface GraphRow { id:string;col:number;rowIdx:number;x:number;y:number;name?:string;qty?:number;unit?:string;status?:string;nodeType?:string;batchNo?:string;parentBatchId:string;treeNode?:TraceNodeTreeVO }
interface GraphEdge { id:string;from:string;to:string;qty?:number;unit?:string;label?:string;path:string;lx:number;ly:number }
interface LinkItem { idSub:string;name:string;type:string;qty:string;nodeId:string }
interface RelItem { dir:string;dirLabel:string;typeLabel:string;code:string;name:string;qty:string;source:string;status:string;statusL:string;nodeId:string;materialName:string }

const typeLabelMap:Record<string,string> = { incoming:'来料批',raw:'物料行',semi:'半成品批',ship:'成品批',customer:'客户' }
const typeBatchSet = new Set(['incoming','semi','ship','customer'])
const batchColMap:Record<string,number> = { incoming:0, semi:2, ship:4, customer:5 }

function sC(s?:string) {
  if(s==='ok'||s==='合格'||s==='是') return 'var(--green)'
  if(s==='pending'||s==='待检') return 'var(--amber)'
  if(s==='locked'||s==='锁定') return 'var(--signal-red)'
  return 'var(--hairline)'
}

function makePath(x1:number,y1:number,x2:number,y2:number):{d:string;lx:number;ly:number} {
  const dx=Math.max(Math.abs(x2-x1)*0.3,ARC)
  const d=`M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`
  return {d,lx:(x1+x2)/2,ly:(y1+y2)/2-10}
}

// ══════ Flatten tree → graph ══════
function flattenTree(root:TraceNodeTreeVO|null) {
  const batches:GraphBatch[]=[]
  const rows:GraphRow[]=[]
  const edges:GraphEdge[]=[]
  if(!root) return {batches,rows,edges}

  const allNodes:TraceNodeTreeVO[]=[]
  const nodeMap=new Map<string,TraceNodeTreeVO>()
  function collect(n:TraceNodeTreeVO) {
    if(!n||nodeMap.has(n.id)) return
    nodeMap.set(n.id,n); allNodes.push(n)
    if(n.children) n.children.forEach(collect)
  }
  collect(root)

  // raw 节点的列由父节点类型决定；semi/ship 的子节点若为 raw 则列为 3/5
  for(const n of allNodes) {
    const pid = n.parentNodeId||''
    const parentNode = pid ? nodeMap.get(pid) : null
    if(typeBatchSet.has(n.nodeType)) {
      // batch: incoming→0, semi→2, ship→4, customer→cx[5]+offset
      let col = batchColMap[n.nodeType]??0
      if(col>=6) col=5 // customer 放在最后一列展示
      batches.push({id:n.id,col,rowIdx:0,x:CX[Math.min(col,5)],y:0,
        batchNo:n.batchNo,nodeName:n.nodeName,qty:n.qty,unit:n.unit,
        status:n.isValid||undefined,supplier:n.supplierName,nodeType:n.nodeType,
        nodeDate:n.nodeDate,treeNode:n,childIds:(n.children||[]).map(c=>c.id)})
    } else {
      // row(raw): 按父节点列映射
      let col=1
      if(parentNode) {
        if(parentNode.nodeType==='incoming') col=1
        else if(parentNode.nodeType==='semi') col=3
        else if(parentNode.nodeType==='ship') col=5
        else if(parentNode.nodeType==='customer') col=5
      }
      rows.push({id:n.id,col,rowIdx:0,x:CX[Math.min(col,5)],y:0,
        name:n.materialCode||n.nodeName,qty:n.qty,unit:n.unit,
        status:n.isValid||undefined,nodeType:n.nodeType,batchNo:n.batchNo,parentBatchId:pid,treeNode:n})
    }
  }

  // position batches by column group
  for(let col=0;col<CX.length;col++) {
    const g=batches.filter(b=>b.col===col)
    g.forEach((b,i)=>{b.rowIdx=i;b.y=50+i*ROWH})
  }
  // 计算行节点的“理想 y”（尽量贴近父批次），实际 y 稍后由列内防重叠统一收敛
  for(const r of rows) {
    const p=batches.find(b=>b.id===r.parentBatchId)
    r.x=CX[Math.min(r.col,5)]
    if(p) {
      const sibs=rows.filter(rr=>rr.parentBatchId===r.parentBatchId)
      r.rowIdx=Math.max(0,sibs.indexOf(r)); r.y=p.y+BH+8+r.rowIdx*(RH+6)
    } else {
      const cr=rows.filter(rr=>rr.col===r.col&&!rr.parentBatchId)
      r.rowIdx=Math.max(0,cr.indexOf(r)); r.y=50+batches.length*ROWH+r.rowIdx*(RH+8)
    }
  }
  // 列内统一防重叠：同一列的 batch(高 BH) 与 row(高 RH) 按理想 y 排序后逐个下推，避免任意卡片重叠
  const GAP=10
  for(let col=0;col<CX.length;col++) {
    const items:{y:number;h:number;set:(v:number)=>void}[]=[]
    for(const b of batches) if(b.col===col) items.push({y:b.y,h:BH,set:v=>{b.y=v}})
    for(const r of rows) if(Math.min(r.col,5)===col) items.push({y:r.y,h:RH,set:v=>{r.y=v}})
    items.sort((a,b)=>a.y-b.y)
    let cursor=-Infinity
    for(const it of items) {
      const y=Math.max(it.y,cursor)
      it.set(y)
      cursor=y+it.h+GAP
    }
  }

  const batchMap=new Map(batches.map(b=>[b.id,b]))
  const rowMap=new Map(rows.map(r=>[r.id,r]))
  // batch→child edges
  for(const b of batches) {
    if(!b.treeNode?.children) continue
    for(const ch of b.treeNode.children) {
      const cb=batchMap.get(ch.id); const cr=rowMap.get(ch.id)
      const tgt=cb||cr; if(!tgt) continue
      const p=makePath(b.x+BW,b.y+BH/2,tgt.x,tgt.y+(cb?BH:RH)/2)
      const lbl=ch.qty!=null?`${ch.qty}${ch.unit||''}`:''
      edges.push({id:`${b.id}>${ch.id}`,from:b.id,to:ch.id,qty:ch.qty,unit:ch.unit,label:lbl||undefined,path:p.d,lx:p.lx,ly:p.ly})
    }
  }
  // row→child edges
  for(const r of rows) {
    if(!r.treeNode?.children) continue
    for(const ch of r.treeNode.children) {
      const cb=batchMap.get(ch.id); if(!cb) continue
      const p=makePath(r.x+RW,r.y+RH/2,cb.x,cb.y+BH/2)
      const lbl=ch.qty!=null?`${ch.qty}${ch.unit||''}`:''
      edges.push({id:`${r.id}>${ch.id}`,from:r.id,to:ch.id,qty:ch.qty,unit:ch.unit,label:lbl||undefined,path:p.d,lx:p.lx,ly:p.ly})
    }
  }
  return {batches,rows,edges}
}

const graphData = computed(() => flattenTree(treeData.value?.tree||null))
const batches = computed(()=>graphData.value.batches)
const rows = computed(()=>graphData.value.rows)
const edgeList = computed(()=>graphData.value.edges)

// ── BFS reachable path set ──
const pathSet = computed(() => {
  const s=new Set<string>()
  if(!focusId.value) return s
  s.add(focusId.value)
  if(mode.value==='both'){
    const q=[focusId.value]
    while(q.length){
      const cur=q.shift()!
      for(const e of edgeList.value){
        if(e.from===cur&&!s.has(e.to)){s.add(e.to);q.push(e.to)}
        if(e.to===cur&&!s.has(e.from)){s.add(e.from);q.push(e.from)}
      }
    }
  }else if(mode.value==='up'){
    const q=[focusId.value]
    while(q.length){
      const cur=q.shift()!
      for(const e of edgeList.value){
        if(e.to===cur&&!s.has(e.from)){s.add(e.from);q.push(e.from)}
      }
    }
  }else{
    const q=[focusId.value]
    while(q.length){
      const cur=q.shift()!
      for(const e of edgeList.value){
        if(e.from===cur&&!s.has(e.to)){s.add(e.to);q.push(e.to)}
      }
    }
  }
  return s
})

// tab 页签筛选：总表=全部, 物料表=raw, 半成品表=semi, 成品表=ship
function tabOk(nt:string):boolean {
  return tab.value==='master'||(tab.value==='mat'&&nt==='raw')||(tab.value==='semi'&&nt==='semi')||(tab.value==='fg'&&nt==='ship')
}
function nodeTypeOf(id:string):string {
  const b=batches.value.find(x=>x.id===id); if(b) return b.nodeType||''
  const r=rows.value.find(x=>x.id===id); return r?.nodeType||''
}
function bCls(b:GraphBatch):string[] {
  if(b.id===focusId.value) return ['sel']
  if(focusId.value&&pathSet.value.size) return [pathSet.value.has(b.id)?'on':'dim']
  if(tab.value!=='master') return tabOk(b.nodeType||'')?['on']:['dim']
  return []
}
function rCls(r:GraphRow):string[] {
  if(r.id===focusId.value) return ['sel']
  if(focusId.value&&pathSet.value.size) return [pathSet.value.has(r.id)?'on':'dim']
  if(tab.value!=='master') return tabOk(r.nodeType||'')?['on']:['dim']
  return []
}
function edgeCls(e:GraphEdge):string[] {
  if(pathSet.value.size) return [pathSet.value.has(e.from)&&pathSet.value.has(e.to)?'on':'dim']
  if(tab.value!=='master') return tabOk(nodeTypeOf(e.from))||tabOk(nodeTypeOf(e.to))?[]:['dim']
  return []
}

const svgW = computed(()=>CX[5]+BW+40)
const svgH = computed(()=>{
  const my=Math.max(0,...batches.value.map(b=>b.y+BH),...rows.value.map(r=>r.y+RH))
  return Math.max(my,300)+40
})
const dividers = computed(()=>CX.slice(1).map(x=>({x:x-10})))
const graphStats = computed(()=>`${batches.value.length}批次 · ${rows.value.length}物料行 · ${edgeList.value.length}流转`)

// ── Right panel ──
const activePanel = computed(() => {
  if(!focusId.value) return null
  const b=batches.value.find(x=>x.id===focusId.value)
  const r=rows.value.find(x=>x.id===focusId.value)
  const node=b||r; if(!node) return null
  const links:LinkItem[]=edgeList.value.filter(e=>e.from===focusId.value||e.to===focusId.value).map(e=>{
    const tid=e.from===focusId.value?e.to:e.from
    const tb=batches.value.find(x=>x.id===tid)
    const trr=rows.value.find(x=>x.id===tid)
    return {idSub:(tb?.batchNo||trr?.name||tid).substring(0,24),name:tb?.nodeName||trr?.name||'-',type:tb?typeLabelMap[tb.nodeType||'']||'':typeLabelMap[trr?.nodeType||'']||'',qty:`${e.qty||'-'}${e.unit||''}`,nodeId:tid}
  })
  const st=(node as any).status||''
  return {
    idSub:((node as any).batchNo||(node as any).name||focusId.value).substring(0,24),
    name:((node as any).nodeName||(node as any).name||'—'),
    qty:(node as any).qty,unit:(node as any).unit,
    batchNo:(node as any).batchNo||(node as any).name||'',
    typeLabel:typeLabelMap[(node as any).nodeType||'']||'',
    date:(node as any).nodeDate||'—',
    supplier:((node as any).nodeType==='semi'||(node as any).nodeType==='ship')?'工厂自制':((node as any).supplier||(node as any).supplierName||'—'),
    isOk:st==='ok'||st==='合格'||st==='是',isLock:st==='locked'||st==='锁定',
    statusLabel:st==='ok'||st==='是'?'合格':st==='locked'?'锁定':st==='pending'?'待检':st||'—',
    linkCount:links.length,links,
  }
})

// ── Relation table ──
const relTitle = computed(()=>{
  if(!focusId.value) return '点击图谱节点查看关系明细'
  const b=batches.value.find(x=>x.id===focusId.value)
  const r=rows.value.find(x=>x.id===focusId.value)
  return `聚焦：${(b?.batchNo||r?.name||focusId.value).substring(0,30)}`
})

const filteredRels = computed(():RelItem[]=>{
  // tab 页签筛选复用全局 tabOk：总表=全部, 物料表=raw, 半成品表=semi, 成品表=ship
  if(!focusId.value) {
    const r:RelItem[]=[]
    for(const b of batches.value) {if(tabOk(b.nodeType||'')) r.push(makeRel(b))}
    for(const row of rows.value) {if(tabOk(row.nodeType||'')) r.push(makeRel(row))}
    return r
  }
  const r:RelItem[]=[]
  for(const id of pathSet.value) {
    const b=batches.value.find(x=>x.id===id)
    if(b){if(tabOk(b.nodeType||'')) r.push(makeRel(b));continue}
    const row=rows.value.find(x=>x.id===id)
    if(row&&tabOk(row.nodeType||'')) r.push(makeRel(row))
  }
  return r
})

function makeRel(node:GraphBatch|GraphRow):RelItem {
  const st=node.status||''
  const isRow=!!(node as any).parentBatchId&&(node as GraphRow).parentBatchId
  const nt=(node as any).nodeType||''
  const isSelfMade=nt==='semi'||nt==='ship' // 半成品/成品是工厂自制，无外部供应商
  const matName=(node as any).treeNode?.detail?.productName||(node as any).nodeName||(node as any).name||'—'
  let dir='both'; let dirLabel='聚焦'
  if(focusId.value&&focusId.value!==node.id) {
    dir=isUpstream(node.id)?'up':'down'
    dirLabel=dir==='up'?'上游':'下游'
  }
  if(focusId.value===node.id){dir='both';dirLabel='聚焦'}
  return {
    dir,dirLabel,
    typeLabel:isRow||!typeLabelMap[nt]?'物料行':typeLabelMap[nt],
    code:(node as any).batchNo||(node as any).nodeName||(node as any).name||node.id,
    // 半成品/成品：节点名=物料名，删除冗余的节点名，只保留物料名
    name:isSelfMade?'—':((node as any).nodeName||(node as any).name||'—'),
    materialName:matName,
    qty:`${(node as any).qty||'-'}${(node as any).unit||''}`,
    // 半成品/成品：工厂自制，不展示供应商
    source:isSelfMade?'工厂自制':((node as any).supplier||(node as any).supplierName||'—'),
    status:st,statusL:st==='ok'||st==='是'?'合格':st==='locked'?'锁定':st==='pending'?'待检':st||'—',
    nodeId:node.id,
  }
}

function isUpstream(nodeId:string):boolean {
  if(!focusId.value) return false
  const q=[nodeId]; const v=new Set([nodeId])
  while(q.length){const cur=q.shift()!;for(const e of edgeList.value){if(e.from===cur&&!v.has(e.to)){v.add(e.to);q.push(e.to)}}}
  return v.has(focusId.value)
}

// 沿当前图谱的 parent→child 边, 判断 candidateId 是否为 ancestorId 的下游(含自身)。
// 与后端 SqmTraceServiceImpl.isDescendantOf 语义一致: 用于挂载前防御环路(体验兜底, 后端仍为权威)。
function isDescendantOf(ancestorId:string, candidateId:string):boolean {
  if(ancestorId===candidateId) return true
  const q=[ancestorId]; const visited=new Set([ancestorId])
  while(q.length){
    const cur=q.shift()!
    for(const e of edgeList.value){
      if(e.from===cur&&!visited.has(e.to)){
        if(e.to===candidateId) return true
        visited.add(e.to); q.push(e.to)
      }
    }
  }
  return false
}

// ── Actions ──
function setMode(v:'both'|'up'|'down'){mode.value=v}
function focusNode(b:GraphBatch){focusId.value=focusId.value===b.id?null:b.id}
function focusRow(r:GraphRow){focusId.value=focusId.value===r.id?null:r.id}
function gotoLink(lk:LinkItem){focusId.value=lk.nodeId}
function relClick(r:RelItem){focusId.value=r.nodeId}

// ── 详情弹窗 ──
async function openDetail(nodeId: string) {
  detailModal.value = { show: true, data: null, loading: true }
  try {
    const res = await sqmTraceApi.getNodeDetail(nodeId)
    detailModal.value.data = res
  } catch(e: any) {
    ElMessage.error(e?.message||'获取详情失败')
    detailModal.value.show = false
  } finally {
    detailModal.value.loading = false
  }
}

function fmtVal(v: any): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? '是' : '否'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// ── 统一刷新：优先按批次，其次按节点根 ──
async function reloadTree() {
  if (activeLotId.value) { await loadTrace(activeLotId.value); return }
  if (rootNodeId.value) {
    try {
      // 用"按节点取完整连通分量"接口, 同时含上游(来料/物料)与下游, 避免只取下游导致列位错位
      const treeRes = await sqmTraceApi.getFullTraceTreeByRootNode(rootNodeId.value)
      treeData.value = treeRes
    } catch(e: any) {
      errorMsg.value = e?.message || '刷新追溯树失败'
    }
  }
}

// ── 添加子级 ──
async function openAddChild(nodeId: string, siblingName?: string) {
  const node = batches.value.find(b => b.id === nodeId) || rows.value.find(r => r.id === nodeId)
  if (!node) { ElMessage.warning('节点未找到'); return }
  const types = childTypeMap[node.nodeType||''] || []
  if (!types.length) { ElMessage.warning('该类型节点不允许添加子级'); return }
  addChildModal.value = {
    show: true, siblingName: siblingName || '',
    targetNodeId: nodeId, targetName: node.batchNo||node.nodeName||nodeId,
    mode: 'existing', types, candidates: [], selectedId: '', usageQty: 0, unit: '',
    loading: true,
    form: { nodeType: types[0]||'raw', nodeName: '', productName: '', materialCode: '', modelSpec: '', customerName: '', customerCode: '', batchNo: 'LOT-' + Date.now(), qty: 0, unit: '', nodeDate: new Date().toISOString().slice(0,10), supplierId: '' }
  }
  const all: TraceNodeSearchVO[] = []
  for (const type of types) {
    try {
      const r = await sqmTraceApi.searchNodes({ nodeType: type, page: 1, size: 100 })
      const items = (r as any)?.records || (r as any)?.list || []
      all.push(...items)
    } catch {}
  }
  addChildModal.value.candidates = all
  addChildModal.value.loading = false
}

// 添加同级 = 在当前节点的父节点下新增一个并列子级(与当前节点同列/同阶段)
async function openAddSibling(nodeId: string) {
  const node = batches.value.find(b => b.id === nodeId) || rows.value.find(r => r.id === nodeId)
  if (!node) { ElMessage.warning('节点未找到'); return }
  const pid = (node as any).parentBatchId as string | undefined
  if (!pid) { ElMessage.warning('该节点为根节点，没有同级，请使用“添加子级”'); return }
  openAddChild(pid, node.batchNo||node.nodeName||nodeId)
}

async function doAddChild() {
  const m = addChildModal.value
  // 自定义新建子级: 直接以当前节点为父建立新节点(走 saveNode, 不触发 reroot/clone)
  if (m.mode === 'custom') {
    const f = m.form
    if (!f.nodeType) { ElMessage.warning('请选择节点类型'); return }
    if (!f.materialCode) { ElMessage.warning('请填写物料编码'); return }
    if (!f.qty || f.qty <= 0) { ElMessage.warning('请填写数量'); return }
    if (!f.nodeName && !f.productName && !f.customerName && !f.batchNo) { ElMessage.warning('请填写节点名称或批次号'); return }
    if (isMaterialType(f.nodeType) && (!m.usageQty || m.usageQty <= 0)) { ElMessage.warning('该子级为来料/物料，必须输入消耗数量'); return }
    m.loading = true
    try {
      let targetId = m.targetNodeId
      if (String(targetId).startsWith('seed-')) targetId = await persistSeedNode(targetId)
      const newNode = await sqmTraceApi.saveNode({
        nodeType: f.nodeType as any,
        parentNodeId: targetId,                 // 直接作为当前节点的子级
        rootLotId: activeLotId.value || undefined,
        nodeName: f.nodeName || f.productName || f.customerName || (f.batchNo + ' 自动创建'),
        productName: f.productName || f.nodeName || undefined,
        materialCode: f.materialCode || undefined,
        modelSpec: f.modelSpec || undefined,
        customerName: f.customerName || undefined,
        customerCode: f.customerCode || undefined,
        batchNo: f.batchNo,
        qty: isMaterialType(f.nodeType) && m.usageQty > 0 ? m.usageQty : (f.qty || undefined),
        unit: f.unit || m.unit || undefined,
        nodeDate: f.nodeDate || undefined,
        supplierId: f.supplierId || undefined,
      })
      ElMessage.success('子节点创建成功')
      m.show = false
      await reloadTree()
      focusId.value = newNode.id
    } catch(e: any) {
      ElMessage.error(e?.message||'添加失败')
    } finally { m.loading = false }
    return
  }
  // 选择已有节点作为子级
  if (!m.selectedId) { ElMessage.warning('请选择一个节点'); return }
  // 体验兜底: 防止把当前节点的下游/自身节点添加为子级形成环(后端 isDescendantOf 为权威)
  if (isDescendantOf(m.selectedId, m.targetNodeId)) {
    ElMessage.warning('不能将当前节点的下游或自身节点添加为子级（会形成环路）')
    return
  }
  // 来料/物料必须输入消耗数量(用于扣减库存)
  if (addChildMaterial.value && (!m.usageQty || m.usageQty <= 0)) {
    ElMessage.warning('该子级为来料/物料，必须输入消耗数量')
    return
  }
  m.loading = true
  try {
    // seed 兜底节点未落库: 先 saveNode 落库拿到真实 UUID, 否则 attachComponent 按假 id 查库会 500
    let targetId = m.targetNodeId
    if (String(targetId).startsWith('seed-')) {
      targetId = await persistSeedNode(targetId)
    }
    await sqmTraceApi.attachComponent(targetId, {
      refNodeId: m.selectedId,
      usageQty: m.usageQty > 0 ? m.usageQty : undefined,
      unit: m.unit || undefined,
    })
    ElMessage.success('子节点关联成功')
    m.show = false
    // 重新加载追溯树（支持批次根/节点根两种场景）
    await reloadTree()
    focusId.value = targetId
  } catch(e: any) {
    ElMessage.error(e?.message||'添加失败')
  } finally {
    m.loading = false
  }
}

// ── 添加父级 ──
async function openAddParent(nodeId: string) {
  const node = batches.value.find(b => b.id === nodeId) || rows.value.find(r => r.id === nodeId)
  if (!node) { ElMessage.warning('节点未找到'); return }
  const types = parentTypeMap[node.nodeType||''] || []
  addParentModal.value = { show: true, targetNodeId: nodeId, targetName: node.batchNo||node.nodeName||nodeId, mode: 'custom', types, candidates: [], selectedId: '', targetNodeType: (node as any).nodeType||'', usageQty: 0, unit: '', targetQty: (node as any).qty ?? 0, targetUnit: (node as any).unit || '', form: { nodeType: types[0]||'incoming', nodeName: '', productName: '', materialCode: '', modelSpec: '', customerName: '', customerCode: '', batchNo: 'LOT-' + Date.now(), qty: 0, unit: '', nodeDate: new Date().toISOString().slice(0,10), supplierId: '' }, loading: false }
  // 预加载已有节点
  if (types.length) {
    addParentModal.value.loading = true
    const all: TraceNodeSearchVO[] = []
    for (const type of types) {
      try {
        const r = await sqmTraceApi.searchNodes({ nodeType: type, page: 1, size: 100 })
        all.push(...((r as any)?.records || (r as any)?.list || []))
      } catch {}
    }
    addParentModal.value.candidates = all
    addParentModal.value.loading = false
  }
}

async function doAddParent() {
  const m = addParentModal.value
  m.loading = true
  try {
    // seed 兜底节点未落库: 先 saveNode 落库拿到真实 UUID, 否则 attachComponent 按假 id 查库会 500
    let targetId = m.targetNodeId
    if (String(targetId).startsWith('seed-')) {
      targetId = await persistSeedNode(targetId)
    }
    if (m.mode === 'existing') {
      if (!m.selectedId) { ElMessage.warning('请选择一个已有节点'); m.loading = false; return }
      // 体验兜底: 防止把当前节点的上游/自身节点设为父级形成环(后端 isDescendantOf 为权威)
      if (isDescendantOf(m.targetNodeId, m.selectedId)) {
        ElMessage.warning('不能将当前节点的上游或自身节点设为父级（会形成环路）')
        m.loading = false
        return
      }
      // 来料/物料必须输入消耗数量(用于扣减库存)
      if (addParentMaterial.value && (!m.usageQty || m.usageQty <= 0)) {
        ElMessage.warning('该关系涉及来料/物料，必须输入消耗数量')
        m.loading = false
        return
      }
      // 用 attachComponent 把当前节点挂到已有节点下面
      await sqmTraceApi.attachComponent(m.selectedId, {
        refNodeId: targetId,
        usageQty: m.usageQty > 0 ? m.usageQty : undefined,
        unit: m.unit || undefined,
      })
      // 节点根场景：新父级成为更高的根，改用它刷新以显示新层级
      if (!activeLotId.value) rootNodeId.value = m.selectedId
      ElMessage.success('父节点关联成功')
    } else {
      // 自定义创建父节点：先建独立节点，再通过 attachComponent 把当前节点挂为新节点的子级
      const f = m.form
      const newNode = await sqmTraceApi.saveNode({
        nodeType: f.nodeType as any,
        // 不传 parentNodeId，作为独立树根创建；保持 rootLotId 避免 re-root 后丢失归属
        rootLotId: activeLotId.value || undefined,
        // 节点名称回退：产品名/客户名/批次号，保证节点名不为空
        nodeName: f.nodeName || f.productName || f.customerName || (f.batchNo + ' 自动创建'),
        // 按类型补齐详情字段，避免产品明细/客户明细关键列空值
        productName: f.productName || f.nodeName || undefined,
        materialCode: f.materialCode || undefined,
        modelSpec: f.modelSpec || undefined,
        customerName: f.customerName || undefined,
        customerCode: f.customerCode || undefined,
        batchNo: f.batchNo,
        qty: f.qty || undefined,
        unit: f.unit || undefined,
        nodeDate: f.nodeDate || undefined,
        supplierId: f.supplierId || undefined,
      })
      // 把当前节点挂到新节点下面（新节点→当前节点 = 新节点是父级）
      await sqmTraceApi.attachComponent(newNode.id, {
        refNodeId: targetId,
        componentType: f.nodeType,
        usageQty: m.usageQty > 0 ? m.usageQty : undefined,
        unit: m.unit || undefined,
      })
      // 节点根场景：新建的父级成为更高的根
      if (!activeLotId.value) rootNodeId.value = newNode.id
      ElMessage.success('父节点创建成功')
    }
    m.show = false
    await reloadTree()
  } catch(e: any) {
    ElMessage.error(e?.message||'操作失败')
  } finally {
    m.loading = false
  }
}

// ══════ API 调用 ══════
async function loadTrace(lotId:string) {
  const data = await sqmTraceApi.getFullTree(lotId)
  treeData.value = data
  focusId.value = null
}

// 解析 seed 查询参数(URL-encoded JSON),用于兜底构造单节点种子树
function parseSeed(s: string | undefined | null): Record<string, any> | null {
  if (!s) return null
  try { return JSON.parse(decodeURIComponent(s)) } catch { return null }
}

// 用 seed 构造一个单节点追溯树(TraceFullTreeVO),使 API 返回空时图谱仍可见
function buildSeedFromSeed(seed: Record<string, any> | null, rootLotId: string, rootNodeId: string | null): TraceFullTreeVO {
  const id = rootNodeId || `seed-${rootLotId || 'lot'}-${seed?.nodeType || 'node'}`
  const tree: TraceNodeTreeVO = {
    id,
    rootLotId: rootLotId || undefined,
    parentNodeId: undefined,
    nodeType: (seed?.nodeType || 'incoming') as TraceNodeType,
    nodeName: seed?.nodeName,
    batchNo: seed?.batchNo,
    materialCode: seed?.materialCode,
    qty: seed?.qty,
    unit: seed?.unit,
    nodeDate: seed?.nodeDate,
    supplierName: seed?.supplierName,
    isValid: seed?.isValid,
    treeLevel: 0,
    children: [],
  }
  return {
    rootLotId: rootLotId || undefined,
    rootLotNo: seed?.batchNo,
    rootNodeId: id,
    tree,
  }
}

// seed 兜底节点只在本地存在(假 id 形如 "seed-...", 未落库)。
// 在其上加子/父级前必须先 saveNode 落库拿到真实 UUID, 否则后端按假 id 查 sqm_trace_node 会因 ?::uuid 转换失败报 500。
// 落库后用真实 id 替换本地图中该节点 id(及其作为父的引用), 并同步更新 rootNodeId, 保证焦点与图谱一致。
async function persistSeedNode(nodeId: string): Promise<string> {
  const node = batches.value.find(b => b.id === nodeId) || rows.value.find(r => r.id === nodeId)
  if (!node) return nodeId
  const created = await sqmTraceApi.saveNode({
    orgId: 'ROOT',
    rootLotId: (node as any).rootLotId || activeLotId.value || undefined,
    nodeType: (node as any).nodeType,
    nodeName: (node as any).nodeName,
    batchNo: (node as any).batchNo,
    materialCode: (node as any).materialCode,
    qty: (node as any).qty,
    unit: (node as any).unit,
    nodeDate: (node as any).nodeDate,
  })
  replaceNodeId(nodeId, created.id)
  if (rootNodeId.value === nodeId) rootNodeId.value = created.id
  return created.id
}

function replaceNodeId(oldId: string, newId: string) {
  const vo = treeData.value
  if (!vo?.tree) return
  const fix = (n: any) => {
    if (!n) return
    if (n.id === oldId) n.id = newId
    if (n.parentNodeId === oldId) n.parentNodeId = newId
    if (Array.isArray(n.children)) n.children.forEach(fix)
  }
  fix(vo.tree)
}

async function doSearch() {
  errorMsg.value=''
  const kw = searchKeyword.value.trim()
  if(!kw) { errorMsg.value='请输入批号或物料编码'; return }
  loading.value = true
  try {
    // 1. 先搜批次
    const lots = await sqmTraceApi.listLots({ keyword: kw })
    const lotList: any[] = Array.isArray(lots) ? lots : (lots as any)?.records || (lots as any)?.list || []
    if (lotList.length > 0) {
      const lot = lotList[0]
      activeLotId.value = lot.id
      rootNodeId.value = null
      searchKeyword.value = lot.lotNo || kw
      await loadTrace(lot.id)
      return
    }
    // 2. 没找到批次，尝试搜节点后取整树
    const searchRes = await sqmTraceApi.searchNodes({ keyword: kw, page: 1, size: 5 })
    const items: any[] = (searchRes as any)?.records || (searchRes as any)?.list || []
    if (items.length > 0) {
      const nodeId = items[0].id
      // 尝试以该节点为根获取完整树
      try {
        const treeRes = await sqmTraceApi.getTraceTreeFromNode(nodeId)
        treeData.value = treeRes
        activeLotId.value = null
        rootNodeId.value = nodeId
        focusId.value = null
        ElMessage.success(`已定位到节点 "${items[0].nodeName || items[0].batchNo || nodeId}" 的追溯树`)
      } catch {
        errorMsg.value = '找到节点但无法构建完整追溯树'
      }
      return
    }
    errorMsg.value = '未找到匹配的批次或节点'
  } catch(e: any) {
    errorMsg.value = e?.message || '查询失败'
  } finally {
    loading.value = false
  }
}

function goBack() { router.push('/sqm/trace') }

onMounted(async () => {
  const qLotId = (route.query.rootLotId as string) || ''
  const qNodeId = (route.query.rootNodeId as string) || ''
  const qLotNo = (route.query.lotNo as string) || ''
  const qNodeType = (route.query.nodeType as string) || ''
  const qSeed = parseSeed(route.query.seed as string)

  // 半成品/成品/物料表: 以点击的列表行节点为起点, 加载其完整连通分量谱系(同时含上游来料/物料与下游),
  // 列位按 nodeType 排布, 不会出现只取下游导致的缺列错位。
  if (qNodeId) {
    activeLotId.value = qLotId || null
    rootNodeId.value = qNodeId
    searchKeyword.value = qLotNo || ''
    // 按节点类型切到对应 tab, 使图谱立即聚焦该节点所属列
    if (qNodeType === 'semi') tab.value = 'semi'
    else if (qNodeType === 'ship') tab.value = 'fg'
    else if (qNodeType === 'raw') tab.value = 'mat'
    if (qLotId) {
      // 用整批完整谱系(列位与参考图一致, 父节点以 DB parent_node_id 为准, 不会因多父连边错位),
      // 仅把点击节点设为 focusId 聚焦。
      try {
        await loadTrace(qLotId)
      } catch (e: any) {
        errorMsg.value = e?.message || '加载追溯树失败'
      }
    } else {
      // 无批次的孤立节点: 退用"按节点取完整连通分量"接口
      try {
        const treeRes = await sqmTraceApi.getFullTraceTreeByRootNode(qNodeId)
        treeData.value = treeRes
      } catch (e: any) {
        errorMsg.value = e?.message || '加载追溯树失败'
      }
    }
    // 兜底: 后端返回空树(孤立节点/无关联)时, 用 seed 构造单节点种子, 保证至少可见本节点
    if (!treeData.value?.tree && qSeed) {
      treeData.value = buildSeedFromSeed(qSeed, qLotId, qNodeId)
    }
    focusId.value = qNodeId
    return
  }

  // 总表/物料表: 来料批次, getFullTree 返回完整树(incoming 节点为根)
  if (qLotId) {
    activeLotId.value = qLotId
    rootNodeId.value = null
    searchKeyword.value = qLotNo || ''
    try {
      await loadTrace(qLotId)
    } catch (e: any) {
      errorMsg.value = e?.message || '加载追溯树失败'
    }
    // 兜底: 后端无 incoming 节点(空树)时, 用 seed 构造单节点种子
    if (!treeData.value?.tree && qSeed) {
      treeData.value = buildSeedFromSeed(qSeed, qLotId, null)
    }
    // 让右侧详情面板默认聚焦到树根(incoming 节点), 立即可见可操作
    if (treeData.value?.tree?.id) {
      focusId.value = treeData.value.tree.id
    }
  }
})
</script>

<style scoped>
/* ═══════════════════ CSS VARIABLES ═══════════════════ */
.tr-root {
  --paper:#f8f7f4;--white:#fff;--ink:#141414;--ink-soft:#5c5c5c;--ink-faint:#9e9e9e;
  --hairline:#e4e2dd;--cobalt:#0047ab;--cobalt-dim:#eef3fa;
  --signal-red:#e03616;--signal-red-dim:#fdf0ed;--amber:#c77800;--amber-dim:#fdf6e9;
  --green:#1a7f4b;--green-dim:#edf7f1;--sans:'Inter','Segoe UI',system-ui,-apple-system,sans-serif;
  font-family:var(--sans);color:var(--ink);background:var(--paper);min-height:100vh;padding-bottom:60px;
}

/* ====== HEAD ====== */
.head-b{display:flex;justify-content:space-between;align-items:flex-start;padding:24px 24px 16px;background:var(--white);border-bottom:1px solid var(--hairline)}
.head-b .crumb{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint);margin-bottom:4px}
.head-b h1{font-size:24px;font-weight:700;letter-spacing:-0.02em;margin:0}
.head-actions{display:flex;gap:10px}
.btn-line,.btn-fill{font-family:var(--sans);font-size:13px;font-weight:600;padding:8px 20px;border-radius:8px;cursor:pointer;transition:all .15s}
.btn-line{background:transparent;border:1px solid var(--hairline);color:var(--ink)}
.btn-line:hover{background:var(--paper);border-color:var(--ink-faint)}
.btn-fill{background:var(--cobalt);color:#fff;border:none}
.btn-fill:hover{background:#003380}

/* ====== TABS ====== */
.tr-tabs{display:flex;align-items:center;gap:0;padding:10px 24px;background:var(--white);border-bottom:1px solid var(--hairline);flex-wrap:wrap}
.tr-tabs button[data-tab]{font-family:var(--sans);font-size:13px;font-weight:600;padding:8px 18px;border:none;background:transparent;color:var(--ink-soft);cursor:pointer;border-bottom:3px solid transparent;transition:all .15s}
.tr-tabs button[data-tab].on{color:var(--cobalt);border-bottom-color:var(--cobalt)}
.tr-tabs button .en{display:block;font-size:10px;font-weight:400;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em}
.tr-seg{margin-left:auto;display:flex;gap:4px;background:var(--paper);border-radius:8px;padding:3px}
.tr-seg button{font-family:var(--sans);font-size:12px;font-weight:600;padding:5px 14px;border:none;background:transparent;color:var(--ink-soft);border-radius:6px;cursor:pointer;transition:all .15s}
.tr-seg button.on{background:var(--white);color:var(--cobalt);box-shadow:0 1px 3px rgba(0,0,0,.08)}

/* ====== BAR ====== */
.tr-bar{padding:16px 24px;background:var(--white)}
.tr-qwrap{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.tr-qlabel{font-size:10px;font-weight:700;color:var(--ink-faint);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}
.tr-input{flex:1;max-width:520px;font-family:var(--sans);font-size:13px;padding:8px 14px;border:1px solid var(--hairline);border-radius:8px;background:var(--paper);color:var(--ink);outline:none;transition:border .15s}
.tr-input:focus{border-color:var(--cobalt);background:var(--white)}
.tr-chips{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.tr-chip-l{font-size:12px;color:var(--ink-faint);font-weight:500}
.tr-chip{font-size:11px;font-weight:500;padding:4px 10px;border-radius:6px;background:var(--paper);border:1px solid var(--hairline);color:var(--ink-soft);cursor:pointer;transition:all .15s}
.tr-chip:hover{background:var(--cobalt-dim);color:var(--cobalt)}
.tr-chip.on{background:var(--cobalt);color:#fff;border-color:var(--cobalt)}
.tr-err{color:var(--signal-red);font-size:12px;margin-top:6px}

/* ====== LAYOUT ====== */
.tr-layout{display:flex;gap:18px;padding:14px 24px 0;align-items:flex-start}
.card-b{flex:1;min-width:0;background:var(--white);border:1px solid var(--hairline);border-radius:12px;overflow:hidden}
.card-head{display:flex;justify-content:space-between;align-items:baseline;padding:14px 20px;border-bottom:1px solid var(--hairline)}
.card-head h2{font-size:16px;font-weight:700;margin:0;letter-spacing:-0.01em}
.card-head .sub{font-size:11px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em}

/* ====== GRAPH ====== */
.tr-graph{position:relative;min-height:320px;overflow-x:auto;overflow-y:auto;max-height:68vh}
.tr-svg{width:100%;min-width:900px}
.tr-div{stroke:var(--hairline);stroke-width:1;stroke-dasharray:6 4}
.tr-colh{font-size:11px;font-weight:700;fill:var(--ink-soft);letter-spacing:.03em}

/* edges */
.teg .te{fill:none;stroke:var(--hairline);stroke-width:1.6;transition:stroke .25s,opacity .25s}
.teg.on .te{stroke:var(--cobalt);stroke-width:2.2;opacity:1}
.teg.dim .te{opacity:.12}
.teq{font-size:10px;fill:var(--ink-faint);text-anchor:middle;transition:fill .25s,opacity .25s}
.teg.on .teq{fill:var(--cobalt);font-weight:700}
.teg.dim .teq{opacity:.15}

/* batch nodes */
.tn{cursor:pointer;transition:opacity .25s}
.tn-box{fill:var(--white);stroke:var(--hairline);stroke-width:1.5;transition:stroke .2s,fill .2s,filter .2s}
.tn.on .tn-box{stroke:var(--cobalt);stroke-width:2.2}
.tn.sel .tn-box{stroke:var(--cobalt);stroke-width:2.8;filter:drop-shadow(0 4px 12px rgba(0,71,171,.18))}
.tn.dim .tn-box{opacity:.28}
.tn-id{font-size:10px;font-weight:700;fill:var(--ink);letter-spacing:.01em;text-transform:uppercase}
.tn-nm{font-size:11px;fill:var(--ink-soft);overflow:hidden}
.tn-qt{font-size:11px;font-weight:600;fill:var(--cobalt)}
.tn.on .tn-id{fill:var(--cobalt)}
.tn.sel .tn-id{fill:var(--cobalt);font-size:11px}
.tn.dim .tn-id,.tn.dim .tn-nm,.tn.dim .tn-qt{opacity:.2}

/* row nodes */
.tn-rbox{fill:var(--paper);stroke:var(--hairline);stroke-width:1.2;transition:stroke .2s,fill .2s,opacity .25s}
.tn-r.on .tn-rbox{stroke:var(--cobalt);stroke-width:2}
.tn-r.sel .tn-rbox{stroke:var(--cobalt);stroke-width:2.5;filter:drop-shadow(0 3px 8px rgba(0,71,171,.14))}
.tn-r.dim .tn-rbox{opacity:.25}
.tn-rnm{font-size:10px;font-weight:600;fill:var(--ink-soft)}
.tn-rqt{font-size:10px;fill:var(--ink-faint)}
.tn-r.on .tn-rnm{fill:var(--cobalt)}
.tn-r.sel .tn-rnm{fill:var(--cobalt);font-weight:700}

/* legend */
.tr-legend{display:flex;align-items:center;gap:14px;padding:10px 20px;border-top:1px solid var(--hairline);font-size:11px;color:var(--ink-soft);flex-wrap:wrap}
.tr-lg{display:inline-flex;align-items:center;gap:5px}
.tr-lg i{display:inline-block;width:10px;height:10px;border-radius:3px}
.tr-lg i.ln{display:inline-block;width:18px;height:3px;border-radius:2px}
.tr-lg i.sq{width:10px;height:10px;border-radius:2px}
.tr-lg-sep{width:1px;height:14px;background:var(--hairline)}
.tr-lg-note{font-size:10px;color:var(--ink-faint);margin-left:auto}

/* empty */
.tr-empty{display:flex;align-items:center;justify-content:center;height:320px;color:var(--ink-faint);font-size:14px}

/* ====== RIGHT PANEL ====== */
.tr-panel{width:280px;flex-shrink:0;background:var(--white);border:1px solid var(--hairline);border-radius:12px;padding:18px;position:sticky;top:14px;max-height:calc(100vh - 140px);overflow-y:auto}
.tr-p-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.tr-p-id{font-size:12px;font-weight:700;color:var(--ink);letter-spacing:.02em;text-transform:uppercase;word-break:break-all}
.tr-p-name{font-size:15px;font-weight:600;margin-bottom:12px;color:var(--ink)}
.tr-p-stats{display:flex;gap:20px;margin-bottom:14px}
.tr-p-stats .v{font-size:20px;font-weight:700;color:var(--cobalt);display:block}
.tr-p-stats .l{font-size:10px;color:var(--ink-faint);text-transform:uppercase}
.tr-f{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--hairline);font-size:12px}
.tr-f .l{color:var(--ink-faint)}
.tr-f .v{font-weight:600;color:var(--ink);text-align:right;max-width:160px;word-break:break-all}
.tr-mini-h{font-size:10px;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em;margin-top:14px;margin-bottom:6px;padding-top:10px;border-top:1px solid var(--hairline)}
.tr-mini{font-size:11px;padding:6px 8px;border-radius:6px;background:var(--paper);margin-bottom:4px;cursor:pointer;transition:background .15s;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.tr-mini:hover{background:var(--cobalt-dim)}
.tr-p-tip{font-size:10px;color:var(--ink-faint);margin-top:12px;font-style:italic}

/* pills */
.pill{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;padding:3px 8px;border-radius:20px}
.pill .d{width:6px;height:6px;border-radius:50%}
.p-done{background:var(--green-dim);color:var(--green)}.p-done .d{background:var(--green)}
.p-lock{background:var(--signal-red-dim);color:var(--signal-red)}.p-lock .d{background:var(--signal-red)}
.p-wait{background:var(--amber-dim);color:var(--amber)}.p-wait .d{background:var(--amber)}

/* ====== TABLE ====== */
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{background:var(--paper);text-align:left;padding:10px 14px;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-faint);border-bottom:1px solid var(--hairline)}
tbody td{padding:9px 14px;border-bottom:1px solid var(--hairline);color:var(--ink);vertical-align:middle}
tbody tr{cursor:pointer;transition:background .12s}
tbody tr:hover{background:var(--cobalt-dim)}
.tr-dir{display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;text-transform:uppercase}
.tr-dir.up{color:var(--cobalt);background:var(--cobalt-dim)}
.tr-dir.down{color:var(--green);background:var(--green-dim)}
.tag-b{display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;background:var(--paper);border:1px solid var(--hairline);color:var(--ink-soft)}
.tr-st{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-family:monospace}
.tr-st i{display:inline-block;width:7px;height:7px;border-radius:50%;flex-shrink:0}

/* ── 弹窗 & 按钮 ── */
.tr-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1000;display:flex;align-items:center;justify-content:center}
.tr-dlg{background:#fff;border-radius:12px;padding:24px;box-shadow:0 8px 32px rgba(0,0,0,.15);min-width:400px;max-height:85vh;overflow-y:auto}
.tr-dg{font-size:12px;font-weight:700;color:var(--cobalt);padding:10px 0 6px;border-bottom:1px solid var(--hairline);margin-bottom:8px}
.tr-ft{width:100%;border-collapse:collapse;font-size:13px}
.tr-ft td{padding:5px 10px;border-bottom:1px solid var(--hairline);vertical-align:top}
.tr-ft td:first-child{color:var(--ink-soft);width:100px;white-space:nowrap;font-weight:500}
.tr-fg{margin-bottom:10px}
.tr-fg label{display:block;font-size:12px;font-weight:500;color:var(--ink-soft);margin-bottom:3px}
.tr-inp{height:32px;border:1px solid var(--hairline);border-radius:6px;padding:0 8px;font-size:13px;box-sizing:border-box}
.tr-sel{height:34px;border:1px solid var(--hairline);border-radius:6px;padding:0 8px;font-size:13px;background:#fff;cursor:pointer}
.tr-inp:focus,.tr-sel:focus{outline:none;border-color:var(--cobalt);box-shadow:0 0 0 2px var(--cobalt-dim)}
.btn-xs{padding:3px 10px;font-size:11px;border:1px solid var(--hairline);border-radius:5px;background:#fff;cursor:pointer;color:var(--ink-soft);white-space:nowrap}
.btn-xs:hover{background:var(--paper);border-color:var(--cobalt-dim);color:var(--cobalt)}
.btn-act{padding:4px 14px;font-size:12px;border:1px solid var(--hairline);border-radius:6px;background:#fff;cursor:pointer;color:var(--ink)}
.btn-add{color:var(--cobalt);border-color:var(--cobalt-dim);background:var(--cobalt-dim)}
.btn-add:hover{background:var(--cobalt);color:#fff}
.btn-ghost{background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink-soft);line-height:1}
.tg{padding:6px 18px;border:1px solid var(--hairline);border-radius:8px;background:#fff;font-size:13px;cursor:pointer;color:var(--ink)}
.tg:hover{background:var(--paper)}
.tg.primary{background:var(--cobalt);border-color:var(--cobalt);color:#fff}
.tg.primary:hover{opacity:.9}
.tg:disabled{opacity:.4;cursor:not-allowed}
</style>

