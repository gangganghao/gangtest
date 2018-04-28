module.exports = {
    path: 'editschedule/:id',
    getComponent(nextState, cb) {
        require.ensure([], (require) => {
            cb(null, require('../../../../components/system/newAttendance/rule/Schedule/EditSchedule.react'))
        }, 'systemAttendanceAttendanceEditSchedule')
    }
}