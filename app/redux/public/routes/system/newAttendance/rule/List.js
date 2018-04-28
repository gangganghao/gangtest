module.exports = {
    path: 'rulelist',
    getComponent(nextState, cb) {
        require.ensure([], (require) => {
            cb(null, require('../../../../components/system/newAttendance/rule/AttendanceList.react'))
        }, 'systemAttendanceAttendanceList')
    }
}