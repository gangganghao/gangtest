/**
 * Created by wuzhenquan on 2017/11/27.
 */
import szApi from 'szApi';
import apiHelper from '../../api/apiHelper';
import * as types from '../../constants/newSystemAttendance/classManageTypes';
import async from 'async';
import SZUtil from 'szUtil';

/**
 * 获取考勤规则列表
 * @param 
 */
export function getClassRules() {
    let options = { m: 'attendance', a: 'class' };
    return (dispatch, getState) => {
        szApi.get(options).then(function (res) {
            if (res && Array.isArray(res.data)) {
                dispatch({
                    type: types.GET_CLASS_RULES,
                    classRules: res.data
                });
            }
        }).catch(function (err) {
            apiHelper.error(err.message);
        });
    };
}


/**
 * 设置列表 loading 状态
 * @returns classRulesLoading: true 加载中 false 加载完成
 */
export function updateClassRuleLoadingState(classRulesLoading) {
    return (dispatch, getState) => {
        dispatch({
            type: types.UPDATE_CLASS_RULE_LOADING_STATE,
            classRulesLoading: classRulesLoading
        });
    };
}

/**
 * 添加班次规则
 * @param parameters
 * @param callback
 */
export function addClassRule(parameters, callback) {
    let options = { m: 'attendance', a: 'class', ...parameters };
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
 * 修改班次规则
 * @param id 班次规则 id
 * @param parameters
 * @param callback
 */
export function editClassRule(id, parameters, callback) {
    let options = { m: 'attendance', a: `class/${id}`, ...parameters };
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
 * 删除班次规则
 * @param callback
 */
export function deleteClassRule(id, callback) {
    let options = { m: 'attendance', a: `class/${id}` };
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