import szApi from 'szApi';
import apiHelper from '../../api/apiHelper';
import * as types from '../../constants/newSystemAttendance/RuleTypes';

export function getAttendanceRuleData(id, callBack) {
    if (typeof id === 'function') { callBack = id; }

    let options = { m: 'attendance', a: 'rule' };
    let type = types.GET_ATTENDANCE_RULE_LIST_DATA;
    if (typeof id === 'number' && id) {
        options.a = `rule/${id}`;
        type = types.GET_ATTENDANCE_RULE_INFO;
    }
    return (dispatch, getState) => {
        szApi.get(options).then(function (res) {
            if (res) {
                dispatch({
                    type,
                    data: res.data
                });
                if (typeof callBack === 'function') { callBack(null); }
            }
        }).catch(function (err) {
            apiHelper.error(err.message);
            if (typeof callBack === 'function') { callBack(err); }
        });
    };
}
export function addAttendanceRule(saveInfo, callBack) {
    let options = { m: 'attendance', a: 'rule' };
    return (dispatch, getState) => {
        szApi.post(_.assign(options, saveInfo)).then(function (res) {
            if (typeof callBack === 'function') { callBack(null,res.data); }
        }).catch(function (err) {
            apiHelper.error(err.message);
            if (typeof callBack === 'function') { callBack(err); }
        });
    };
}
/**
 * 更改考勤规则
 * 
 * @export
 * @param {number} id 考勤规则数据，考勤类型不能修改
 * @param {object} saveInfo 考勤规则数据，考勤类型不能修改
 * @param {function} callBack 
 * @returns 
 */
export function updateAttendanceRule(id, saveInfo, callBack) {
    let options = { m: 'attendance', a: `rule/${id}` };
    return (dispatch, getState) => {
        szApi.put(_.assign(options, saveInfo)).then(function (res) {
            if (typeof callBack === 'function') { callBack(null,res.data); }
        }).catch(function (err) {
            apiHelper.error(err.message);
            if (typeof callBack === 'function') { callBack(err); }
        });
    };
}
/**
 * 删除考勤规则
 * 
 * @export
 * @param {number} id 考勤规则数据，考勤类型不能修改
 * @param {object} saveInfo 考勤规则数据，考勤类型不能修改
 * @param {function} callBack 
 * @returns 
 */
export function delAttendanceRule(id) {
    let options = { m: 'attendance', a: `rule/${id}` };
    return async (dispatch, getState) => {
        try {
            const res = await szApi.delete(options);
            if (res) {
                dispatch({ type: types.DELETE_ATTENDANCE_RULE_INFO, id });
            }
        } catch (err) {
            apiHelper.error(err.message);
        }
    };
}
/**
 * 获取用户排班数据
 * 
 * @export
 * @param {number} id 考勤规则Id
 * @param {number} monthTime 月份，1号0点开始的时间戳 
 * @param {number} isFilter 是否过滤 1：过滤，0：不过滤
 * @param {function} callBack 
 * @returns 
 */
export function getAttendanceScheduleUser(id, monthTime, isFilter, callBack) {
    let options = { m: 'attendance', a: 'schedule/user', attendance_rule_id: id, month_time: monthTime, is_filter: isFilter };
    return (dispatch, getState) => {
        szApi.get(options).then(function (res) {
            if (res) {
                dispatch({
                    type: isFilter === 0 ? types.GET_ATTENDANCE_SCHEDULE_USER : types.GET_ATTENDANCE_SCHEDULE_USER_FILTER,
                    data: res.data
                });
                if (typeof callBack === 'function') { callBack(null); }
            }
        }).catch(function (err) {
            apiHelper.error(err.message);
            if (typeof callBack === 'function') { callBack(err); }
        });
    };
}
export function clearScheduleInfo() {
    return (dispatch, getState) => {
        dispatch({
            type: types.CLEAR_ATTENDANCE_SCHEDULE_USER,
        });
    };
}
/**
 * 设置用户排班数据
 * 
 * @export
 * @param {number} id 考勤规则Id
 * @param {number} monthTime 月份，1号0点开始的时间戳 
 * @param {array} scheduleData 用户排班数据
 * @param {function} callBack 
 * @returns 
 */
export function addAttendanceScheduleUser(id, monthTime, scheduleData, callBack) {
    let options = { m: 'attendance', a: 'schedule/user', attendance_rule_id: id, month_time: monthTime, schedule_data: scheduleData };
    return (dispatch, getState) => {
        szApi.post(options).then(function (res) {
            if (typeof callBack === 'function') { callBack(null); }
            dispatch({
                type: types.SET_ATTENDANCE_SCHEDULE_USER,
                scheduleData: scheduleData
            });
        }).catch(function (err) {
            apiHelper.error(err.message);
            if (typeof callBack === 'function') { callBack(err); }
        });
    };
}
/**
 * 设置排班周期
 * 
 * @export
 * @param {number} id 考勤规则Id
 * @param {any} title 周期名称
 * @param {number} days 周期天数
 * @param {array} attendanceClasses 班次Id列表
 * @param {function} callBack 
 * @returns 
 */
export function addAttendanceScheduleCycle(id, title, days, attendanceClasses, callBack) {
    let options = { m: 'attendance', a: 'schedule', attendance_rule_id: id, title: title, days: days, attendance_class: attendanceClasses };
    return (dispatch, getState) => {
        szApi.post(options).then(function (res) {
            let scheduleCricle = {
                title: title,
                days: days,
                attendance_class: attendanceClasses,
            }
            dispatch({
                type: types.SET_ATTENDANCE_SCHEDULE_CYCLE,
                scheduleCricle: scheduleCricle
            });
            if (typeof callBack === 'function') { callBack(null); }
        }).catch(function (err) {
            apiHelper.error(err.message);
            if (typeof callBack === 'function') { callBack(err); }
        }); 
    };
}
/**
 * 获取加班基础设置
 * 
 * @param {function} callback 
 */
export const getOverTimeBaseInfo = (callback) => {
    let options = { m: "attendance", a: `overtime/base`};
    szApi.get(options).then((res) => {
        if (res && res.data) {
            if (typeof callback === 'function') { callback(null, res.data); }
        }
    }).catch((error) => {
        if (typeof callback === 'function') { callback(error, null); }
    });
};

export function getAttendanceRuleDataById(id, callBack) {
    let options = { m: 'attendance', a: `rule/${id}` };
    szApi.get(options).then(function (res) {
        if (res) {
            typeof callBack === 'function' && callBack(null, res.data);
        }
    }).catch(function (err) {
        apiHelper.error(err.message);
        typeof callBack === 'function' && callBack(err, null);
    });
}