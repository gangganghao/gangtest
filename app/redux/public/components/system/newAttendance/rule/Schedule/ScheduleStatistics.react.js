import React, { Component } from 'react';
import PropTypes from "prop-types";
import classNames from 'classnames';

class ScheduleStatistics extends Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    render() {
        let { mouthDayArray,attendanceClasses,scheduleData,getClassNameByAttendanceClassId,attendanceClassArray } = this.props;
        return (
            <div className="back-arr-total">
                <table>
                    <colgroup>
                        <col style={{ width: 100 }} />
                        {_.fill(Array(mouthDayArray.length), <col style={{ width: 38 }} />)}
                    </colgroup>
                    <tbody>
                        <tr>
                            <th>统计人数</th>
                            {//渲染头数据
                                mouthDayArray && mouthDayArray.map((item, index) => {
                                    return <th key = {index}>{item.num}</th>;
                                })
                            }
                        </tr>
                        {
                            attendanceClasses&&attendanceClasses.map((classId,trIndex)=>{
                                let attendanceClass = _.find(attendanceClassArray, { id: classId });
                                if (_.isEmpty(attendanceClass)) return null;
                                return (
                                    <tr key={trIndex}>
                                        <td>
                                            <em className={classNames('arr-box',getClassNameByAttendanceClassId(classId))}></em>
                                            {attendanceClass.title}
                                        </td>
                                        {
                                            mouthDayArray && mouthDayArray.map((item, tdIndex) => {
                                                let userScheduleData = _.filter(scheduleData, (sd) => {
                                                    return _.findIndex(sd.schedule, { schedule_date: item.unixTime, attendance_class_id: classId }) > -1;
                                                });
                                                return (<td key={tdIndex}>{!_.isEmpty(userScheduleData)&&userScheduleData.length||0}</td>);
                                            })
                                        }
                                    </tr>
                                );
                            })
                        }
                        <tr>
                            <td>
                                <em className="arr-rest"></em>休息
                            </td>
                            {
                                mouthDayArray && mouthDayArray.map((item, tdIndex) => {
                                    let userScheduleData = _.filter(scheduleData, (sd) => {
                                        return _.findIndex(sd.schedule, { schedule_date: item.unixTime, attendance_class_id: 0 }) > -1;
                                    });
                                    return (<td key={tdIndex}>{!_.isEmpty(userScheduleData) && userScheduleData.length || 0}</td>);
                                })
                            }
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}

ScheduleStatistics.propTypes = {
    attendanceClasses: PropTypes.array.isRequired,//考勤规则选择的班次Id
    attendanceClassArray: PropTypes.array,//所有班次数据
    scheduleData: PropTypes.array.isRequired,//用户排班数据
    getClassNameByAttendanceClassId:PropTypes.func.isRequired,//通过班次ID，获取className
    mouthDayArray: PropTypes.array.isRequired,//日期
};
export default ScheduleStatistics;