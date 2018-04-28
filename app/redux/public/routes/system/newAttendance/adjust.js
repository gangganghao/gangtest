module.exports = {
    path: 'adjust',
    getComponent(nextState, cb) {
        require.ensure([], (require) => {
            cb(null, require('../../../components/system/newAttendance/adjust/AdjustRule.react'));
        }, 'systemAttendanceAdjustRule');
    }
};