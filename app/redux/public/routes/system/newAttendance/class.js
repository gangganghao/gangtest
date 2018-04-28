module.exports = {
    path: 'class',
    getComponent(nextState, cb) {
        require.ensure([], (require) => {
            cb(null, require('../../../components/system/newAttendance/class/ClassManage.react'));
        }, 'systemAttendanceClassManage');
    }
};