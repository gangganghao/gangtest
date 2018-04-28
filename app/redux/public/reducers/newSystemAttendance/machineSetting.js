/**
 * Created by wuzhenquan on 2017/12/6.
 */
import * as types from '../../constants/newSystemAttendance/machineSettingTypes';
import update from 'immutability-helper';
let global = window.g ? window.g : window.global;

const initialState = {
    machines: [],
    fingerprints:[]
};

export default function machineSetting(state = initialState, action = {}) {
    switch (action.type) {
        // 获取规考勤机
        case types.GET_MACHINE:
            return update(state, {
                machines: { $set: action.machines },
            });
        // 获取已录入指纹人员
        case types.GET_FINGERPRINT:
            return update(state, {
                fingerprints: { $set: action.fingerprints },
            });
        default:
            return state;
    }
}