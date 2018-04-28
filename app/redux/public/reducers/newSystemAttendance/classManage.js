/**
 * Created by wuzhenquan on 2017/11/27.
 */
import * as types from '../../constants/newSystemAttendance/classManageTypes';
import update from 'immutability-helper';
let global = window.g ? window.g : window.global;

const initialState = {
    classRules: [],
    classRulesLoading: true,
};

export default function classManage(state = initialState, action = {}) {
    switch (action.type) {
        // 获取考勤规则
        case types.GET_CLASS_RULES:
            return update(state, {
                classRules: { $set: action.classRules },
                classRulesLoading: { $set: false },
            });
        // 设置列表 loading 状态
        case types.UPDATE_CLASS_RULE_LOADING_STATE:
            return update(state, {
                classRulesLoading: { $set: action.classRulesLoading },
            });
        default:
            return state;
    }
}