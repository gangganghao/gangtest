import React, { Component } from 'react';
import PropTypes from "prop-types";
import SelectAttendanceClass from './SelectAttendanceClass.react';
import { attendanceNeedCheckDateStyles } from '../../../../../constants/Constant.js';
import Modal from 'react-modal';

class Schedule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectAttendanceClassModalOpen:false
        }
    }
    // region 获取班次名字
    getTimeAcrossName(type) {
        let retStr = '';
        switch (type) {
            case 0:
                retStr = '';
                break;
            case 1:
                retStr = '次日';
                break;
            case 2:
                retStr = '后天';
                break;
        }
        return retStr;
    }
    /**
     * 根据班次Id，获取班次名字
     * 
     * @param {number} id 
     * @returns 
     * @memberof Fixed
     */
    getSectionName(id) {
        if (id === 0) return '休息';
        else if (id === -1) return '';
        else {
            let retStr = '';
            let attendanceClass = _.find(window.global.AttendanceClassProcessor.getAttendanceClasses().attendanceClasses, { id: id });
            if (!_.isEmpty(attendanceClass) && !_.isEmpty(attendanceClass.section)) {
                let retArray = [attendanceClass.title];
                attendanceClass.section.map((item) => {
                    if (item.is_rest === 0)
                        retArray.push(`${this.getTimeAcrossName(item.start_time_across)}${item.start_time}-${this.getTimeAcrossName(item.end_time_across)}${item.end_time}`)
                }, this);
                retStr = retArray.join(' ');
            }
            return retStr;
        }
    }
    // endregion
    
    // region 选择考勤班次
    deleteAttendanceClass(e,id){
        let {ruleInfo,updateRuleInfo} = this.props;
        let {working_date} = ruleInfo;
        if(!_.isEmpty(working_date.class)){
            _.remove(working_date.class,(t)=>t===id);
        }else{
            working_date.class =[];
        }
        updateRuleInfo('working_date',working_date);
        e.stopPropagation();
        e.preventDefault();
    }
    /**
     * 保存排班制-考勤班次
     * 
     * @param {any} selecteds 
     * @memberof Fixed
     */
    selectAttendanceClass(selecteds) {
        let {ruleInfo,updateRuleInfo} = this.props;
        let {working_date} = ruleInfo;
        working_date.class = selecteds;
        updateRuleInfo('working_date',working_date);
        this.setState({selectAttendanceClassModalOpen:false});
        return;
    }
    selectAttendanceClassModalRender() {
        let { selectAttendanceClassModalOpen } = this.state;
        if (!selectAttendanceClassModalOpen) return null;
        let {ruleInfo} = this.props;
        let {working_date} = ruleInfo;
        let selectedIds = working_date.class||[];
        return (
            <Modal
                isOpen={true}
                style={attendanceNeedCheckDateStyles}
                contentLabel={"选择班次"}
            >
                <SelectAttendanceClass
                    closeModal={()=>{this.setState({selectAttendanceClassModalOpen:false});}}
                    enterFunction={this.selectAttendanceClass.bind(this)}
                    selecteds = {selectedIds}
                    multiple={true}
                />
            </Modal>
        );
    }
    // endregion
    
    // region 根据班次Id，获取班次的颜色className
    getClassNameByAttendanceClassId(classId) {
        let retStr = '';
        if (classId === 0) return 'c-999';
        switch (classId % 8) {
            case 0:
                retStr = 'bench-yellow';
                break;
            case 1:
                retStr = 'bench-azure';
                break;
            case 2:
                retStr = 'bench-light-orange';
                break;
            case 3:
                retStr = 'bench-light-blue';
                break;
            case 4:
                retStr = 'bench-green';
                break;
            case 5:
                retStr = 'bench-salmon';
                break;
            case 6:
                retStr = 'bench-sopraan';
                break;
            case 7:
                retStr = 'bench-violet';
                break;
        }
        return retStr;
    }
    // endregion
    render() {
        let {ruleInfo} = this.props;
        return (
            <div className="clock-form-menu">
                <h4>5、考勤班次</h4>
                <div className="clock-rule-classes" onClick={()=>{this.setState({selectAttendanceClassModalOpen:true});}}>
                {
                    !_.isEmpty(ruleInfo.working_date)&&!_.isEmpty(ruleInfo.working_date.class)?
                            ruleInfo.working_date.class.map((classId, index) => {
                                return (
                                    <span key={index} className={this.getClassNameByAttendanceClassId(classId)} onClick={(e)=>{e.stopPropagation();}}>
                                        <b>{this.getSectionName(classId)}</b>
                                        <i onClick={(e)=>{this.deleteAttendanceClass(e,classId)}} className="iconfont icon-thinclose"></i>
                                    </span>
                                )
                            })
                    :
                    null
                }
                    <input type="text" placeholder="请选择..." />
                </div>
                {this.selectAttendanceClassModalRender()}
            </div>
        );
    }
}
Schedule.propTypes = {
    ruleInfo: PropTypes.object.isRequired,
    updateRuleInfo: PropTypes.func.isRequired,
};
export default Schedule;