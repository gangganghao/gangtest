/**
 * Created by wuzhenquan on 2017/12/5.
 */
import * as types from '../../constants/newSystemAttendance/adjustRuleTypes';
import update from 'immutability-helper';
let global = window.g ? window.g : window.global;

const initialState = {
    adjustRuleInfo: {},
};

export default function overtimeRule(state = initialState, action = {}) {
    switch (action.type) {
        // 获取加班规则
        case types.GET_ADJUST_RULE_INFO:
            return update(state, {
                adjustRuleInfo: { $set: action.adjustRuleInfo },
            });
        // 设置加班规则
        case types.SET_ADJUST_RULE_INFO:
            return update(state, {
                adjustRuleInfo: { $set: action.adjustRuleInfo },
            });
        default:
            return state;
    }
}