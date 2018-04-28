/**
 * Created by wuzhenquan on 2017/11/27.
 */
import szApi from 'szApi';
import apiHelper from '../../api/apiHelper';
import * as types from '../../constants/newSystemAttendance/overtimeRuleTypes';

/**
 * 获取加班规则列表
 * @param 
 */
export function getOvertimeRules() {
    let options = { m: 'attendance', a: 'overtime/rule' };
    return (dispatch, getState) => {
        szApi.get(options).then(function (res) {
            if (res && Array.isArray(res.data)) {
                dispatch({
                    type: types.GET_OVERTIME_RULES,
                    overtimeRules: res.data
                });
            }
        }).catch(function (err) {
            apiHelper.error(err.message);
        });
    };
}

/**
 * 获取加班基础设置
 * @param 
 */
export function getOvertimeBase() {
    let options = { m: 'attendance', a: 'overtime/base' };
    return (dispatch, getState) => {
        szApi.get(options).then(function (res) {
            if (res) {
                dispatch({
                    type: types.GET_OVERTIME_BASE,
                    overtimeBase: res.data
                });
            }
        }).catch(function (err) {
            apiHelper.error(err.message);
        });
    };
}

/**
 * 修改加班基础设置
 * @param parameters
 * @param callback
 */
export function editOvertimeBase(parameters, callback) {
    let options = { m: 'attendance', a: 'overtime/base', ...parameters };
    return (dispatch, getState) => {
        szApi.put(options).then(function (res) {
            if (res) {
                if (typeof callback === 'function') { callback(null); }
            }
        }).catch(function (err) {
            if (typeof callback === 'function') { callback(err); }
            apiHelper.error(err.message);
        });
    };
}

/**
 * 设置考勤基础设置
 * @param parameters
 */
export function setOvertimeBase(parameters, callback) {
    let options = { m: 'attendance', a: 'overtime/base', ...parameters };
    return (dispatch, getState) => {
        szApi.put(options).then(function (res) {
            if (res) {
                if (typeof callback === 'function') { callback(null); }
            }
        }).catch(function (err) {
            if (typeof callback === 'function') { callback(err); }
            apiHelper.error(err.message);
        });
    };
}

/**
 * 设置列表 loading 状态
 * @returns overtimeRulesLoading: true 加载中 false 加载完成
 */
export function updateOvertimeRuleLoadingState(overtimeRulesLoading) {
    return (dispatch, getState) => {
        dispatch({
            type: types.UPDATE_OVERTIME_RULE_LOADING_STATE,
            overtimeRulesLoading: overtimeRulesLoading
        });
    };
}

/**
 * 添加加班规则
 * @param parameters
 * @param callback
 */
export function addOvertimeRule(parameters, callback) {
    let options = { m: 'attendance', a: 'overtime/rule', ...parameters };
    return (dispatch, getState) => {
        szApi.post(options).then(function (res) {
            if (res) {
                if (typeof callback === 'function') { callback(null); }
            }
        }).catch(function (err) {
            if (typeof callback === 'function') { callback(err); }
            apiHelper.error(err.message);
        });
    };
}

/**
 * 编辑加班规则
 * @param parameters
 * @param callback
 */
export function editOvertimeRule(id, parameters, callback) {
    let options = { m: 'attendance', a: `overtime/rule/${id}`, ...parameters };
    return (dispatch, getState) => {
        szApi.put(options).then(function (res) {
            if (res) {
                if (typeof callback === 'function') { callback(null); }
            }
        }).catch(function (err) {
            if (typeof callback === 'function') { callback(err); }
            apiHelper.error(err.message);
        });
    };
}


/**
 * 删除加班规则
 * @param parameters
 * @param callback
 */
export function deleteOvertimeRule(id, callback) {
    let options = { m: 'attendance', a: `overtime/rule/${id}` };
    return (dispatch, getState) => {
        szApi.delete(options).then(function (res) {
            if (res) {
                if (typeof callback === 'function') { callback(null); }
            }
        }).catch(function (err) {
            if (typeof callback === 'function') { callback(err); }
            apiHelper.error(err.message);
        });
    };
}

/**
 * 获取考勤规则列表
 * @param 
 */
export function getAttendanceRules() {
    let options = { m: 'attendance', a: 'rule' };
    return (dispatch, getState) => {
        szApi.get(options).then(function (res) {
            if (res && Array.isArray(res.data)) {
                dispatch({
                    type: types.GET_ATTENDANCE_RULES,
                    attendanceRules: res.data
                });
            }
        }).catch(function (err) {
            apiHelper.error(err.message);
        });
    };
}