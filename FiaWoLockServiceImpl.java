package com.konli.qms.service.fia.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.konli.qms.api.fia.dto.FiaWoLockActiveDTO;
import com.konli.qms.common.security.CompanyContext;
import com.konli.qms.domain.fia.entity.FiaTask;
import com.konli.qms.domain.fia.entity.FiaWoLock;
import com.konli.qms.domain.fia.mapper.FiaTaskMapper;
import com.konli.qms.domain.fia.mapper.FiaWoLockMapper;
import com.konli.qms.service.fia.FiaWoLockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 首件工单锁定服务实现(SR-FIA-022~026)。
 *
 * <p>同一工单仅保留一条当前锁定记录(lock_status='锁定');解锁时更新该记录为'正常'并记留痕,
 * 不新增行,保证"锁定->解锁"可追溯且工单维度唯一。</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FiaWoLockServiceImpl implements FiaWoLockService {

    private final FiaWoLockMapper fiaWoLockMapper;
    private final FiaTaskMapper fiaTaskMapper;

    @Override
    @Transactional
    public void lockOnCreate(String orgId, String woNo, String taskCode) {
        FiaWoLock exist = getByWoNo(orgId, woNo);
        if (exist != null) {
            // 已有锁定记录:若已解锁则重新锁定(新一轮首件);若仍锁定则保持
            if (!"锁定".equals(exist.getLockStatus())) {
                exist.setLockStatus("锁定");
                exist.setLockReason("首件未完成");
                exist.setLockedAt(LocalDateTime.now());
                exist.setWipHold(true);
                exist.setUnlockType(null);
                exist.setUnlockedAt(null);
                exist.setApproverId(null);
                exist.setReleaseReason(null);
                exist.setTraceTag(null);
                exist.setTaskCode(taskCode);
                fiaWoLockMapper.updateById(exist);
            }
            return;
        }
        FiaWoLock l = new FiaWoLock();
        l.setOrgId(orgId);
        l.setWoNo(woNo);
        l.setLockStatus("锁定");
        l.setLockReason("首件未完成");
        l.setLockedAt(LocalDateTime.now());
        l.setWipHold(true);
        l.setTaskCode(taskCode);
        fiaWoLockMapper.insert(l);
        log.info("[WO锁定] 工单 {} 锁定(首件未完成, task={})", woNo, taskCode);
    }

    @Override
    @Transactional
    public void lockOnFail(String orgId, String woNo, String taskCode) {
        FiaWoLock exist = getByWoNo(orgId, woNo);
        if (exist == null) {
            // 兜底:历史未锁定(直接判定不合格)则补建锁定
            FiaWoLock l = new FiaWoLock();
            l.setOrgId(orgId);
            l.setWoNo(woNo);
            l.setLockStatus("锁定");
            l.setLockReason("首件不合格");
            l.setLockedAt(LocalDateTime.now());
            l.setWipHold(true);
            l.setTaskCode(taskCode);
            fiaWoLockMapper.insert(l);
            log.info("[WO锁定] 工单 {} 锁定(首件不合格, task={})", woNo, taskCode);
            return;
        }
        exist.setLockStatus("锁定");
        exist.setLockReason("首件不合格");
        exist.setWipHold(true);
        if (exist.getLockedAt() == null) {
            exist.setLockedAt(LocalDateTime.now());
        }
        exist.setTaskCode(taskCode);
        fiaWoLockMapper.updateById(exist);
        log.info("[WO锁定] 工单 {} 锁定原因强化为首件不合格(task={})", woNo, taskCode);
    }

    @Override
    @Transactional
    public void unlockAuto(String orgId, String woNo, String taskCode) {
        FiaWoLock exist = getByWoNo(orgId, woNo);
        if (exist == null) {
            log.warn("[WO解锁] 工单 {} 无锁定记录,跳过自动解锁", woNo);
            return;
        }
        if (!"锁定".equals(exist.getLockStatus())) {
            return; // 已解锁,幂等
        }
        exist.setLockStatus("正常");
        exist.setUnlockType("自动解锁");
        exist.setUnlockedAt(LocalDateTime.now());
        exist.setWipHold(false);
        exist.setTaskCode(taskCode);
        fiaWoLockMapper.updateById(exist);
        log.info("[WO解锁] 工单 {} 自动解锁(重新校验通过/首件合格, task={})", woNo, taskCode);
    }

    @Override
    @Transactional
    public void unlockByApproval(String orgId, String woNo, String approverId,
                                 String releaseReason, String traceTag, String taskCode) {
        FiaWoLock exist = getByWoNo(orgId, woNo);
        if (exist == null) {
            // 兜底:无锁定记录也建一条放行留痕
            exist = new FiaWoLock();
            exist.setOrgId(orgId);
            exist.setWoNo(woNo);
            exist.setLockStatus("正常");
            exist.setLockedAt(LocalDateTime.now());
            exist.setTaskCode(taskCode);
            exist.setApproverId(approverId);
            exist.setReleaseReason(releaseReason);
            exist.setTraceTag(traceTag);
            exist.setUnlockType("紧急放行");
            exist.setUnlockedAt(LocalDateTime.now());
            exist.setWipHold(false);
            fiaWoLockMapper.insert(exist);
            log.info("[WO放行] 工单 {} 紧急放行(无前置锁定,补留痕, task={})", woNo, taskCode);
            return;
        }
        exist.setLockStatus("正常");
        exist.setUnlockType("紧急放行");
        exist.setUnlockedAt(LocalDateTime.now());
        exist.setWipHold(false);
        exist.setApproverId(approverId);
        exist.setReleaseReason(releaseReason);
        exist.setTraceTag(traceTag);
        exist.setTaskCode(taskCode);
        fiaWoLockMapper.updateById(exist);
        log.info("[WO放行] 工单 {} 紧急放行(approver={}, tag={}, task={})", woNo, approverId, traceTag, taskCode);
    }

    @Override
    public FiaWoLock getByWoNo(String orgId, String woNo) {
        if (woNo == null || woNo.isEmpty()) {
            return null;
        }
        LambdaQueryWrapper<FiaWoLock> w = new LambdaQueryWrapper<FiaWoLock>()
                .eq(FiaWoLock::getWoNo, woNo)
                .orderByDesc(FiaWoLock::getCreatedAt)
                .last("LIMIT 1");
        // 管理员(orgId=null/all)不按公司过滤;普通用户按本公司
        if (orgId != null && !orgId.isEmpty() && !"all".equals(orgId)) {
            w.eq(FiaWoLock::getOrgId, orgId);
        }
        return fiaWoLockMapper.selectOne(w);
    }

    @Override
    public List<FiaWoLockActiveDTO> listActive(String orgId) {
        boolean admin = CompanyContext.isAdmin();
        log.warn("[wo-lock] listActive admin={} orgId={}", admin, orgId);
        LambdaQueryWrapper<FiaWoLock> w = new LambdaQueryWrapper<FiaWoLock>()
                .eq(FiaWoLock::getLockStatus, "锁定")
                .eq(FiaWoLock::getWipHold, true)
                .orderByAsc(FiaWoLock::getLockedAt);
        // 管理员(全量数据域)不过滤组织;普通用户仅看本公司
        if (!admin && orgId != null && !orgId.isEmpty() && !"all".equals(orgId)) {
            w.eq(FiaWoLock::getOrgId, orgId);
        }
        List<FiaWoLock> locks = fiaWoLockMapper.selectList(w);
        log.warn("[wo-lock] listActive query count={}", locks.size());
        if (locks.isEmpty()) {
            return List.of();
        }
        List<String> codes = locks.stream()
                .map(FiaWoLock::getTaskCode)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<String, FiaTask> taskMap = new LinkedHashMap<>();
        if (!codes.isEmpty()) {
            List<FiaTask> tasks = fiaTaskMapper.selectList(
                    new LambdaQueryWrapper<FiaTask>().in(FiaTask::getCode, codes));
            for (FiaTask t : tasks) {
                taskMap.put(t.getCode(), t);
            }
        }
        List<FiaWoLockActiveDTO> res = new ArrayList<>();
        for (FiaWoLock l : locks) {
            FiaWoLockActiveDTO dto = new FiaWoLockActiveDTO();
            dto.setWoNo(l.getWoNo());
            dto.setLockReason(l.getLockReason());
            dto.setLockedAt(l.getLockedAt() != null ? l.getLockedAt().toString() : null);
            dto.setTaskCode(l.getTaskCode());
            FiaTask t = l.getTaskCode() != null ? taskMap.get(l.getTaskCode()) : null;
            if (t != null) {
                dto.setProductName(t.getProductName());
                dto.setLineName(t.getLineName());
            }
            res.add(dto);
        }
        return res;
    }

    /** 独立事务:工单锁定/解锁失败不回滚调用方主事务(签名/审批) */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void unlockAutoInNewTx(String orgId, String woNo, String taskCode) {
        unlockAuto(orgId, woNo, taskCode);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void lockOnFailInNewTx(String orgId, String woNo, String taskCode) {
        lockOnFail(orgId, woNo, taskCode);
    }
}
