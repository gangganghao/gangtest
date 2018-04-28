/**
 * Created by wuzhenquan on 2017/11/27.
 */
import * as types from '../../constants/newSystemAttendance/overtimeRuleTypes';
import update from 'immutability-helper';
let global = window.g ? window.g : window.global;

const initialState = {
    overtimeRules: [],
    overtimeRulesLoading: true,
    overtimeBase: {},
    attendanceRules: []
};

export default function overtimeRule(state = initialState, action = {}) {
    switch (action.type) {
        // 获取加班规则列表
        case types.GET_OVERTIME_RULES:
            return update(state, {
                overtimeRules: { $set: action.overtimeRules },
                overtimeRulesLoading: { $set: false },
            });
        // 获取加班规则 loading 状态
        case types.UPDATE_OVERTIME_RULE_LOADING_STATE:
            return update(state, {
                overtimeRulesLoading: { $set: action.overtimeRulesLoading },
            });
        // 获取加班基础设置
        case types.GET_OVERTIME_BASE:
            return update(state, {
                overtimeBase: { $set: action.overtimeBase },
            });
        // 获取考勤规则
        case types.GET_ATTENDANCE_RULES:
            return update(state, {
                attendanceRules: { $set: action.attendanceRules },
            });
        default:
            return state;
    }
}