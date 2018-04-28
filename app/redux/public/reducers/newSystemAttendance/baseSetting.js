import * as types from '../../constants/newSystemAttendance/BaseSettingTypes';
import update from 'immutability-helper';
let global = window.g ? window.g : window.global;

const initialState = {
    baseSettingInfo:null
};

export default function baseSetting(state = initialState, action) {
    switch (action.type) {
        case types.INIT_BASE_SETTING_DATA:
            return { ...state, baseSettingInfo: action.baseSettingInfo };
    }
    return state;
}