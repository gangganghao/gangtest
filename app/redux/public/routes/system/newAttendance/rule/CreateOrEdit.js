module.exports = {
    path: 'createoredit/:id',
    getComponent(nextState, cb) {
        require.ensure([], (require) => {
            cb(null, require('../../../../components/system/newAttendance/rule/CreateOrEdit.react'))
        }, 'systemAttendanceAttendanceCreateOrEdit')
    }
}