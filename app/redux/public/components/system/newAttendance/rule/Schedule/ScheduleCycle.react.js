import React, { Component } from 'react';
import PropTypes from "prop-types";
import classNames from 'classnames';
import apiHelper from '../../../../../api/apiHelper.js';

class ScheduleCycle extends Component {
    constructor(props) {
        super(props);
        let { scheduleCycleObj, attendanceClassIds } = props;
        this.state = {
            title: scheduleCycleObj && scheduleCycleObj.title || '',
            days: scheduleCycleObj && scheduleCycleObj.days || 2,
            selectedClassIds: scheduleCycleObj && scheduleCycleObj.attendance_class || _.fill(Array(2), attendanceClassIds[0])
        }
    }
    onSubmit(e) {
        let { title,days,selectedClassIds } = this.state;
        if(!_.trim(title)){
            apiHelper.error('请输入周期名称',1500);
            return;
        }
        let { enterFunction } = this.props;
        enterFunction(title,days,selectedClassIds);
    }
    onDaysChange(e) {
        let value = parseInt(e.target.value);
        let { days, selectedClassIds } = this.state;
        let { attendanceClassIds } = this.props;
        if (value > days) {
            selectedClassIds = _.concat(selectedClassIds, _.fill(Array(value - days), attendanceClassIds[0]));
        } else {
            selectedClassIds = _.dropRight(selectedClassIds, days - value);
        }
        this.setState({ days: value, selectedClassIds });
    }
    onScheduleClassChange(e,index){
        let value = e.target.value;
        let { selectedClassIds } = this.state;
        selectedClassIds[index] = parseInt(value);
        this.setState({ selectedClassIds });
    }
    getDaysOptions() {
        let retArr = [];
        for (var i = 2; i <= 31; i++) {
            retArr.push(<option key={i} value={i}>{i}</option>);
        }
        return retArr;
    }
    getScheduleClassOptions(){
        var classArray = window.global.AttendanceClassProcessor.getAttendanceClasses().attendanceClasses;
        let {attendanceClassIds} = this.props;
        let retArr = attendanceClassIds.map((classId,index)=>{
            let attendanceClass = _.find(classArray, { id: classId });
            return (<option key={index} value={classId}>{attendanceClass&&attendanceClass.title||''}</option>);
        })||[];
        retArr.push(<option key={-1} value='0'>休息</option>);
        return retArr;
    }
    render() {
        let { closeModal,scheduleCycleSaving } = this.props;
        let { title,days,selectedClassIds } = this.state;
        return (
            <div className="modal-content">
                <div className="modal-header">
                    <a onClick={closeModal} href="javascript:;" draggable="false" className="close"><i className="iconfont icon-delname"></i></a>
                    <h4 className="modal-title">排班周期设置</h4>
                </div>
                <div className="modal-body new-form">
                    <div className="rule-note"><span className="txt">设置保存后，请到考勤排班设置页面，点击单元格进行排班</span></div>
                    <ul className="form-list">
                        <li>
                            <em><span>*</span>周期名称</em>
                            <div className="r">
                                <input type="text" className="form-control" onChange={(e)=>{this.setState({title:e.target.value})}} value={title} placeholder="请输入" />
                            </div>
                        </li>
                        <li>
                            <em>周期天数</em>
                            <div className="r">
                                <select
                                    className="form-control"
                                    defaultValue={days}
                                    onChange={this.onDaysChange.bind(this)}
                                >
                                    {this.getDaysOptions()}
                                </select>
                                <p className="c-999 mb-10">最小周期天数为2天，最大周期数为31天</p>
                            </div>
                        </li>
                        {
                            !_.isEmpty(selectedClassIds) ?
                                selectedClassIds.map((classId, index) => {
                                    return (
                                        <li key={index}>
                                            <b>第{index + 1}天：</b>
                                            <div className="r">
                                                <select
                                                    className="form-control"
                                                    defaultValue={classId}
                                                    onChange={(e) => { this.onScheduleClassChange(e, index); }}
                                                >
                                                    {this.getScheduleClassOptions()}
                                                </select>
                                            </div>
                                        </li>
                                    )
                                })
                                :
                                null
                        }

                    </ul>

                </div>
                <div className="modal-footer">
                    <button disabled={scheduleCycleSaving} onClick={this.onSubmit.bind(this)} type="submit" className="btn btn-primary">保存</button>
                    <button onClick={closeModal} type="button" className="btn btn-default">取消</button>
                </div>

            </div>
        );
    }
}

ScheduleCycle.propTypes = {
    closeModal: PropTypes.func,//关闭窗口
    enterFunction: PropTypes.func,//保存回调
    attendanceClassIds:PropTypes.array.isRequired,//待选择的班次数据
    scheduleCycleObj:PropTypes.object,//编辑的时候需要
};
ScheduleCycle.defaultProps = {
    isSupportCycle: true
}
export default ScheduleCycle;