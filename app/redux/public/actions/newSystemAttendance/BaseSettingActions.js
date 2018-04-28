import szApi from 'szApi';
import apiHelper from '../../api/apiHelper';
import * as types from '../../constants/newSystemAttendance/BaseSettingTypes';

export function getBaseSettingInfo() {
    let options = { m: 'attendance', a: 'base' };
    return (dispatch, getState) => {
        szApi.get(options).then(function (res) {
            if (res) {
                dispatch({
                    type: types.INIT_BASE_SETTING_DATA,
                    baseSettingInfo: res.data
                });
            }
        }).catch(function (err) {
            apiHelper.error(err.message);
        });
    };
}
export function saveBaseSettingInfo(saveInfo,callBack) {
    let options = { m: 'attendance', a: 'base' };
    return (dispatch, getState) => {
        szApi.put(_.assign(options,saveInfo)).then(function (res) {
            if (typeof callBack === 'function') { callBack(null); }
        }).catch(function (err) {
            apiHelper.error(err.message);
            if (typeof callBack === 'function') { callBack(err); }
        });
    };
}