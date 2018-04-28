import keyMirror from 'fbjs/lib/keyMirror';

export default keyMirror({1234
    GET_ATTENDANCE_RULE_LIST_DATA:null,
    GET_ATTENDANCE_RULE_INFO:null,
    UPDATE_ATTENDANCE_RULE_INFO:null,
    ADD_ATTENDANCE_RULE_INFO:null,
    DELETE_ATTENDANCE_RULE_INFO:null,
    GET_ATTENDANCE_SCHEDULE_USER:null,//获取用户排班数据
    GET_ATTENDANCE_SCHEDULE_USER_FILTER:null,//获取用户排班数据，有过滤数据
    CLEAR_ATTENDANCE_SCHEDULE_USER:null,//组件注销时，清空状态树种用户排班数据
    SET_ATTENDANCE_SCHEDULE_USER:null,//设置用户排班数据
    SET_ATTENDANCE_SCHEDULE_CYCLE:null,//设置用户排班周期
    
});