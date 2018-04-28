module.exports = {
    path: 'basesetting',
    getComponent(nextState, cb) {
        require.ensure([], (require) => {
            cb(null, require('../../../components/system/newAttendance/base/BaseSetting.react'))
        }, 'systemAttendanceBaseSetting')
    }
}