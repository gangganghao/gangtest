import * as types from '../../constants/newSystemAttendance/RuleTypes';
import update from 'immutability-helper';
let global = window.g ? window.g : window.global;

const initialState = {
    ruleList: null,
    ruleInfo: null,
    scheduleInfo: null,
};

export default function rule(state = initialState, action) {
    switch (action.type) {
        case types.GET_ATTENDANCE_RULE_LIST_DATA:
            return { ...state, ruleList: action.data };
        case types.GET_ATTENDANCE_RULE_INFO:
            return { ...state, ruleInfo: action.data };
        // var updateAttendanceRuleIndex = _.findIndex(state.ruleList, { id: action.data.id });
        // return update(state, {
        //     ruleList: {
        //         $splice: [
        //             [updateAttendanceRuleIndex, 1, action.data]
        //         ]
        //     }
        // });
        case types.DELETE_ATTENDANCE_RULE_INFO:
            var deleteAttendanceRuleIndex = _.findIndex(state.ruleList, { id: action.id });
            return update(state, {
                ruleList: {
                    $splice: [
                        [deleteAttendanceRuleIndex, 1]
                    ]
                }
            });
        case types.GET_ATTENDANCE_SCHEDULE_USER:
            return { ...state, scheduleInfo: action.data };
        case types.GET_ATTENDANCE_SCHEDULE_USER_FILTER://切换日期后，重新更新用户排班数据
            if (!_.isEmpty(state.scheduleInfo)) {
                return update(state, {
                    scheduleInfo: {
                        schedule_data: {
                            $set: action.data.schedule_data
                        }
                    }
                });
            }
            return state;
        case types.SET_ATTENDANCE_SCHEDULE_USER://用户排班数据保存成功后，刷新状态树
            if (!_.isEmpty(state.scheduleInfo)) {
                return update(state, {
                    scheduleInfo: {
                        schedule_data: {
                            $set: action.scheduleData
                        }
                    }
                });
            }
            return state;
        case types.CLEAR_ATTENDANCE_SCHEDULE_USER:
            return { ...state, scheduleInfo: null };
        case types.SET_ATTENDANCE_SCHEDULE_CYCLE://保存排班周期后，直接在组件内部更新数据
            if (!_.isEmpty(state.scheduleInfo)) {
                return update(state, {
                    scheduleInfo: {
                        schedule_cricle:{
                            $set:action.scheduleCricle
                        }
                    }
                });
            }
            return state;
    }
    return state;
}