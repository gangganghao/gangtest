module.exports = {
    path: 'overtime',
    getComponent(nextState, cb) {
        require.ensure([], (require) => {
            cb(null, require('../../../components/system/newAttendance/overtime/OvertimeRule.react'));
        }, 'systemAttendanceOvertimeRule');
    }
};