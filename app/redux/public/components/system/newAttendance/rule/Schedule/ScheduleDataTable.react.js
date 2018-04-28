import React, { Component } from 'react';
import PropTypes from "prop-types";
import classNames from 'classnames';
import { weekChineseShort } from '../../../../../constants/Constant.js';
import apiHelper from '../../../../../api/apiHelper.js';

class ScheduleDataTable extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        let { mouthDayArray, scheduleInfo, selectAttendanceClassIsShow, currentInfo,setSchedule,setScheduleX,setScheduleY,getClassNameByAttendanceClassId,getSectionName } = this.props;
        return (
            <table>
                <colgroup>
                    <col style={{ width: 100 }} />
                    {_.fill(Array(mouthDayArray.length), <col style={{ width: 40 }} />)}
                </colgroup>
                <tbody>
                    <tr>
                        <th>姓名</th>
                        <th colSpan={mouthDayArray.length || 1}>日期/班次</th>
                    </tr>
                    <tr>
                        <td>&nbsp;</td>
                        {//渲染头信息
                            mouthDayArray && mouthDayArray.map((item, index) => {
                                if (_.includes([0, 6], item.week)) {//节假日标红
                                    return (
                                        <td onClick={(e) => { setScheduleY(e, item.unixTime); }} key={index}>
                                            <em>
                                                {item.num}
                                                <br />
                                                {weekChineseShort[item.week] || ''}
                                            </em>
                                            <b></b>
                                        </td>
                                    );
                                } else {
                                    return (
                                        <td onClick={(e) => { setScheduleY(e, item.unixTime); }} key={index}>
                                            {item.num}
                                            <br />
                                            {weekChineseShort[item.week] || ''}
                                            <b></b>
                                        </td>
                                    );
                                }

                            })
                        }
                    </tr>
                    {//渲染人员与排班信息
                        !_.isEmpty(scheduleInfo.schedule_uids) ?
                            scheduleInfo.schedule_uids.map((userId, index) => {
                                let userInfo = apiHelper.getCurrentUser(userId);
                                let userScheduleData = null;
                                if (!_.isElement(scheduleInfo.schedule_data)) {
                                    userScheduleData = _.find(scheduleInfo.schedule_data, { uid: userId });
                                }
                                return (
                                    <tr key={index}>
                                        <td onClick={(e) => { setScheduleX(e, userId); }}>{userInfo.name}<b></b></td>
                                        {
                                            mouthDayArray && mouthDayArray.map((item, tdIndex) => {
                                                if (!_.isEmpty(userScheduleData)) {
                                                    let userScheduleInfo = _.find(userScheduleData.schedule, { schedule_date: item.unixTime });
                                                    if (!_.isEmpty(userScheduleInfo)) {
                                                        return (
                                                            <td onClick={(e) => { setSchedule(e, item.unixTime, userId, userScheduleInfo.attendance_class_id) }} key={tdIndex}>
                                                                <span className={getClassNameByAttendanceClassId(userScheduleInfo.attendance_class_id)}>
                                                                    <em className={classNames({ 'hide': selectAttendanceClassIsShow && userId === currentInfo.userId && item.unixTime === currentInfo.unixTime })}>{getSectionName(userScheduleInfo.attendance_class_id)}</em>
                                                                    <i className={classNames('iconfont', 'icon-edit', { 'active': selectAttendanceClassIsShow && userId === currentInfo.userId && item.unixTime === currentInfo.unixTime })}></i>
                                                                </span>
                                                            </td>
                                                        );
                                                    }
                                                }
                                                return (<td onClick={(e) => { setSchedule(e, item.unixTime, userId, 0) }} key={tdIndex}></td>);
                                            })
                                        }
                                    </tr>
                                );
                            })
                            :
                            null
                    }
                </tbody>
            </table>
        );
    }
}

ScheduleDataTable.propTypes = {
    scheduleInfo: PropTypes.object.isRequired,
    currentInfo: PropTypes.object.isRequired,
    mouthDayArray: PropTypes.array.isRequired,
    selectAttendanceClassIsShow: PropTypes.bool.isRequired,
    setSchedule: PropTypes.func.isRequired,
    setScheduleX: PropTypes.func.isRequired,
    setScheduleY: PropTypes.func.isRequired,
    getClassNameByAttendanceClassId: PropTypes.func.isRequired,
    getSectionName: PropTypes.func.isRequired,
};
export default ScheduleDataTable;