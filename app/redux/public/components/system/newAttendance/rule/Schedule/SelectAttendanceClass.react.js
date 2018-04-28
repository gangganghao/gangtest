import React, { Component } from 'react';
import PropTypes from "prop-types";
import classNames from 'classnames';

class SelectAttendanceClass extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectType:0
        }
    }
    updateSelectType(selectType){
        this.setState({selectType});
    }
    onSubmit(classId,selectType){
        let {onSelectAttendanceClassChange} = this.props;
        onSelectAttendanceClassChange(classId,selectType);
    }
    render() {
        let { isSupportCycle,attendanceClassArray,attendanceClasses,scheduleCycle,getClassNameByAttendanceClassId,customStyle } = this.props;
        let { selectType } = this.state;
        return (
            <div className="back-arr-elect" style={customStyle}>
                <div className="back-elect-hd">
                    <span className={classNames({ 'active': isSupportCycle&&selectType === 0 })} onClick={this.updateSelectType.bind(this, 0)}>按天排班</span>
                    {isSupportCycle ? <span className={classNames({ 'active': isSupportCycle&&selectType === 1 })} onClick={this.updateSelectType.bind(this, 1)}>按周期排班</span> : null}
                </div>
                {
                    selectType === 0 ?
                        <div className="back-elect-lump">
                            {
                                !_.isEmpty(attendanceClasses) ?
                                    attendanceClasses.map((classId, index) => {
                                        let attendanceClass = _.find(attendanceClassArray, { id: classId });
                                        if (_.isEmpty(attendanceClass)) return null;
                                        return (
                                            <span onClick={this.onSubmit.bind(this, classId, selectType)} key={index} className={getClassNameByAttendanceClassId(classId)}>{attendanceClass.title}</span>
                                        );
                                    })
                                    :
                                    null
                            }
                            <span onClick={this.onSubmit.bind(this, 0, selectType)} className="arr-lump">休息</span>
                        </div>
                        :
                        selectType === 1 ?
                            <div className="back-elect-lump">
                                {
                                    !_.isEmpty(scheduleCycle) ? <span onClick={this.onSubmit.bind(this, 0, selectType)} className="bench-blue">{scheduleCycle.title}</span> : null
                                }
                            </div>
                            :
                            null
                }
            </div>
        );
    }
}

SelectAttendanceClass.propTypes = {
    onSelectAttendanceClassChange: PropTypes.func,//保存回调
    selectId:PropTypes.number,//已选数据
    isSupportCycle:PropTypes.bool.isRequired,//是否支持按周期排
    getClassNameByAttendanceClassId:PropTypes.func.isRequired,//通过班次ID，获取className
    scheduleCycle:PropTypes.object.isRequired,//排班周期数据
    attendanceClasses:PropTypes.array.isRequired,//考勤规则选择的班次Id
    attendanceClassArray:PropTypes.array,//所有班次数据
    customStyle:PropTypes.object.isRequired,

};
SelectAttendanceClass.defaultProps = {
    isSupportCycle: true
}
export default SelectAttendanceClass;