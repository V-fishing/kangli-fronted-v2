package com.konli.qms.api.fia.controller;

import com.konli.qms.api.fia.dto.FiaWoLockActiveDTO;
import com.konli.qms.common.api.R;
import com.konli.qms.common.security.CompanyContext;
import com.konli.qms.domain.fia.entity.FiaWoLock;
import com.konli.qms.service.fia.FiaWoLockService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 首件工单锁定查询(SR-FIA-022~026)。
 * 前端 Tasks.vue 据此展示工单锁定状态徽标(锁定红/正常绿);
 * active 端点供仪表盘"工单锁定"告警条展示当前等待处置的锁定工单。
 */
@RestController
@RequestMapping("/api/v1/fia/wo-lock")
@RequiredArgsConstructor
public class FiaWoLockController {

    private final FiaWoLockService fiaWoLockService;

    /** 按工单号查当前锁定记录(无则 data=null)。 */
    @GetMapping
    @PreAuthorize("hasAuthority('fia.task.list')")
    public R<FiaWoLock> get(@RequestParam String woNo) {
        CompanyContext.CurrentUser u = CompanyContext.get();
        String orgId = u != null && !"all".equals(u.dataScope()) ? u.orgId() : null;
        return R.ok(fiaWoLockService.getByWoNo(orgId, woNo));
    }

    /** 当前组织下锁定中且等待处置的工单列表(按锁定时间升序,最久优先)。 */
    @GetMapping("/active")
    @PreAuthorize("hasAuthority('fia.task.list')")
    public R<List<FiaWoLockActiveDTO>> active() {
        CompanyContext.CurrentUser u = CompanyContext.get();
        String orgId = u != null && !"all".equals(u.dataScope()) ? u.orgId() : null;
        return R.ok(fiaWoLockService.listActive(orgId));
    }
}
