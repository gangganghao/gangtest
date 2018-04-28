/**
 * Created by wuzhenquan on 2017/12/6.
 */
import szApi from 'szApi';
import apiHelper from '../../api/apiHelper';
import * as types from '../../constants/newSystemAttendance/machineSettingTypes';

/**
 * 获取考勤机
 * @param parameters
 * @param callback
 */
export function getMachines(parameters, callback) {
    let options = { m: 'attendance', a: 'machine' };
    return (dispatch, getState) => {
        szApi.get(options).then(function (res) {
            if (res && Array.isArray(res.data)) {
                dispatch({
                    type: types.GET_MACHINE,
                    machines: res.data
                });
            }
        }).catch(function (err) {
            apiHelper.error(err.message);
        });
    };
}

/**
 * 添加考勤机
 * @param parameters
 * @param callback
 */
export function addMachine(parameters, callback) {
    let options = { m: 'attendance', a: 'machine', ...parameters };
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
 * 修改考勤机
 * @param id 考勤机 id
 * @param parameters
 * @param callback
 */
export function editMachine(id, parameters, callback) {
    let options = { m: 'attendance', a: `machine/${id}`, ...parameters };
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
 * 解绑考勤机
 * @param id 考勤机 id
 * @param callback
 */
export function deleteMachine(id, callback) {
    let options = { m: 'attendance', a: `machine/${id}` };
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
 * 获取已录入指纹人员
 * @param parameters
 */
export function geFingerPrint(parameters) {
    let options = { m: 'attendance', a: 'fingerprint', ...parameters };
    return (dispatch, getState) => {
        szApi.get(options).then(function (res) {
            if (res && Array.isArray(res.data)) {
                dispatch({
                    type: types.GET_FINGERPRINT,
                    fingerprints: res.data
                });
            }
        }).catch(function (err) {
            apiHelper.error(err.message);
        });
    };
}