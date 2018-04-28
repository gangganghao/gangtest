module.exports = {
    path: 'machine',
    getComponent(nextState, cb) {
        require.ensure([], (require) => {
            cb(null, require('../../../components/system/newAttendance/machine/MachineSetting.react'));
        }, 'systemAttendanceMachineSetting');
    }
};