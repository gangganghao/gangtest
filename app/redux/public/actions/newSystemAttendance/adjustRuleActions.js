/**
 * Created by wuzhenquan on 2017/12/5.
 */
import szApi from 'szApi';
import apiHelper from '../../api/apiHelper';
import * as types from '../../constants/newSystemAttendance/adjustRuleTypes';

/**
 * 获取调休规则
 * @param 
 */
export function getAdjustRuleInfo() {
    let options = { m: 'attendance', a: 'adjust' };
    return (dispatch, getState) => {
        szApi.get(options).then(function (res) {
            if (res) {
                dispatch({
                    type: types.GET_ADJUST_RULE_INFO,
                    adjustRuleInfo: res.data
                });
            }
        }).catch(function (err) {
            apiHelper.error(err.message);
        });
    };
}

/**
 * 修改调休规则
 * @param parameters
 * @param callback
 */
export function setAdjustRuleInfo(parameters, callback) {
    let options = { m: 'attendance', a: 'adjust', ...parameters };
    return (dispatch, getState) => {
        szApi.put(options).then(function (res) {
            if (res) {
                dispatch({
                    type: types.SET_ADJUST_RULE_INFO,
                    adjustRuleInfo: parameters
                });
                if (typeof callback === 'function') { callback(null); }
            }
        }).catch(function (err) {
            if (typeof callback === 'function') { callback(err); }
            apiHelper.error(err.message);
        });
    };
}