import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from "prop-types";
import apiHelper from '../../../../../api/apiHelper.js';
import NoCheckDateSelect from './NoCheckDateSelect.react';
import NeedCheckDateSelect from './NeedCheckDateSelect.react';
import SelectAttendanceClass from './SelectAttendanceClass.react';
import Modal from 'react-modal';
import {weekChinese2, attendanceNeedCheckDateStyles } from '../../../../../constants/Constant.js';
import update from 'immutability-helper';

class Fixed extends Component {
    constructor(props) {
        super(props);
        this.state = {
            deleteConfirmIsOpen: false,
            addNeedCheckDateModalOpen: false,
            addNoCheckDateModalOpen: false,
            editNeedCheckDateInfo: null,
            selectAttendanceClassModalOpen:false,
            currentSelectAttendance:null,
        }
    }
    
    //region 无需打卡日期操作
    deleteNoCheckDate(index) {
        let { ruleInfo, updateRuleInfo } = this.props;
        let noChackDates = [];
        if (!_.isEmpty(ruleInfo.no_check_date)) {
            noChackDates = update(ruleInfo.no_check_date, { $splice: [[index, 1]] });
        }
        updateRuleInfo('no_check_date', noChackDates);
    }
    noCheckDateSelected(value) {
        let { ruleInfo, updateRuleInfo } = this.props;
        let noChackDates = [];
        if (!_.isEmpty(ruleInfo.no_check_date)) {
            noChackDates = _.concat(ruleInfo.no_check_date, value);
        } else {
            noChackDates = [value]
        }
        updateRuleInfo('no_check_date', noChackDates);
        this.setState({ addNoCheckDateModalOpen: false });
    }
    noCheckDateSelectModalRender() {
        let { addNoCheckDateModalOpen } = this.state;
        if (!addNoCheckDateModalOpen) return null;
        let { ruleInfo } = this.props;
        return (
            <Modal
                isOpen={addNoCheckDateModalOpen}
                style={attendanceNeedCheckDateStyles}
                contentLabel={"选择不用打卡日期"}
            >
                <NoCheckDateSelect
                    closeModal={() => { this.setState({ addNoCheckDateModalOpen: false }); }}
                    enterFunction={this.noCheckDateSelected.bind(this)}
                    needCheckDates={ruleInfo.need_check_date || []}
                    noNeedCheckDates={ruleInfo.no_check_date || []}
                />
            </Modal>
        );
    }
    //endregion

    //region 必须打卡日期操作
    updateAddNeedCheckDateModalOpenStatus(addNeedCheckDateModalOpen,editInfo = null){
        if(addNeedCheckDateModalOpen){
            this.setState({addNeedCheckDateModalOpen:true,editNeedCheckDateInfo:editInfo});
        }else{
            this.setState({addNeedCheckDateModalOpen:false,editNeedCheckDateInfo:null});
        }
    }
    deleteNeedCheckDate(index) {
        let { ruleInfo, updateRuleInfo } = this.props;
        let needChackDates = [];
        if (!_.isEmpty(ruleInfo.need_check_date)) {
            needChackDates = update(ruleInfo.need_check_date, { $splice: [[index, 1]] });
        }
        updateRuleInfo('need_check_date', needChackDates);
    }
    /**
     * 必须打卡选择回调
     * 
     * @param {object} selectedObj  {special_date:特殊日期,attendance_class_id:班次id}
     * @memberof Fixed
     */
    needCheckDateSelected(selectedObj) {
        let { ruleInfo, updateRuleInfo } = this.props;
        let needChackDates = [];
        if (!_.isEmpty(ruleInfo.need_check_date)) {
            var selectIndex = _.findIndex(ruleInfo.need_check_date, { special_date: selectedObj.special_date });
            if (selectIndex > -1) {//编辑必须打卡日期
                needChackDates = update(ruleInfo.need_check_date, { $splice: [[selectIndex, 1, selectedObj]] });
            } else {
                needChackDates = _.concat(ruleInfo.need_check_date, selectedObj);
            }
        } else {
            needChackDates = [selectedObj]
        }
        updateRuleInfo('need_check_date', needChackDates);
        this.updateAddNeedCheckDateModalOpenStatus(false);
    }
    needCheckDateSelectModalRender() {
        let { addNeedCheckDateModalOpen, editNeedCheckDateInfo } = this.state;
        if (!addNeedCheckDateModalOpen) return null;
        let { ruleInfo } = this.props;
        return (
            <Modal
                isOpen={true}
                style={attendanceNeedCheckDateStyles}
                contentLabel={"选择必须打卡日期"}
            >
                <NeedCheckDateSelect
                    closeModal={() => { this.updateAddNeedCheckDateModalOpenStatus(false); }}
                    enterFunction={this.needCheckDateSelected.bind(this)}
                    needCheckDates={ruleInfo.need_check_date || []}
                    noNeedCheckDates={ruleInfo.no_check_date || []}
                    editNeedCheckDateInfo={editNeedCheckDateInfo}
                />
            </Modal>
        );
    }
    //endregion
    
    // region 选择考勤班次
    /**
     * 打开/关闭选择考勤班次窗口
     * 
     * @param {bool} selectAttendanceClassModalOpen 
     * @param {object} currentSelectAttendance { type: '', index: -1 }  type = 0:常规 1:大周,2：小周
     * @memberof Fixed
     */
    updateSelectAttendanceClassModalOpenStatus(selectAttendanceClassModalOpen, currentSelectAttendance) {
        if (selectAttendanceClassModalOpen) {
            currentSelectAttendance = currentSelectAttendance || { type: 0, index: -1 };
            this.setState({ selectAttendanceClassModalOpen: true, currentSelectAttendance });
        } else {
            this.setState({ selectAttendanceClassModalOpen: false, currentSelectAttendance: null });
        }
    }
    /**
     * 工作日设置周一~周日复选框操作，
     * 选中时打开选择考勤班次窗口，取消选中时恢复考勤班次为休息
     * @param {any} e 
     * @param {any} type 
     * @param {any} index 
     * @returns 
     * @memberof Fixed
     */
    onSelectAttendanceClassChange(e,type,index){
        let isChecked = e.target.checked;
        if(isChecked){//复选框选中时，打开选择考勤班次窗口
            this.updateSelectAttendanceClassModalOpenStatus(true,{type,index});
            return;
        }
        let {ruleInfo,updateRuleInfo} = this.props;
        let {working_date} = ruleInfo;
        switch (type) {// 0:常规 1:大周,2：小周
            case 0:
                working_date.general[index] = 0;
                break;
            case 1:
                working_date.big[index] = 0;
                break;
            case 2:
                working_date.small[index] = 0;
                break;
        }
        updateRuleInfo('working_date',working_date);
    }
    /**
     * 保存工作日班次选择
     * 
     * @param {any} selecteds 
     * @memberof Fixed
     */
    selectAttendanceClass(selecteds) {
        let { currentSelectAttendance } = this.state;
        let {ruleInfo,updateRuleInfo} = this.props;
        let {working_date} = ruleInfo;
        let selected = selecteds[0];
        if(!_.isEmpty(currentSelectAttendance) && currentSelectAttendance.index > -1){//按天设置
            switch (currentSelectAttendance.type) {
                case 0:
                    working_date.general[currentSelectAttendance.index] = selected;
                    break;
                case 1:
                    working_date.big[currentSelectAttendance.index] = selected;
                    break;
                case 2:
                    working_date.small[currentSelectAttendance.index] = selected;
                    break;
            }
        }else{//快速设置全部
            switch(ruleInfo.working_model){
                case 1://常规模式
                working_date.general = _.fill(new Array(7),selected);
                break;
                case 2://大小周模式
                working_date.big = _.fill(new Array(7),selected);
                working_date.small = _.fill(new Array(7),selected);
                break;
            }
        }
        updateRuleInfo('working_date',working_date);
        this.updateSelectAttendanceClassModalOpenStatus(false);
    }
    selectAttendanceClassModalRender() {
        let { selectAttendanceClassModalOpen,currentSelectAttendance } = this.state;
        if (!selectAttendanceClassModalOpen) return null;
        let {ruleInfo} = this.props;
        let {working_date} = ruleInfo;
        let selected = 0;
        if (!_.isEmpty(currentSelectAttendance) && currentSelectAttendance.index > -1) {//按天设置班次
            switch (currentSelectAttendance.type) {// 0:常规 1:大周,2：小周
                case 0:
                    selected = working_date.general[currentSelectAttendance.index];
                    break;
                case 1:
                    selected = working_date.big[currentSelectAttendance.index];
                    break;
                case 2:
                    selected = working_date.small[currentSelectAttendance.index];
                    break;
            }
        }
        return (
            <Modal
                isOpen={true}
                style={attendanceNeedCheckDateStyles}
                contentLabel={"选择班次"}
            >
                <SelectAttendanceClass
                    closeModal={this.updateSelectAttendanceClassModalOpenStatus.bind(this,false)}
                    enterFunction={this.selectAttendanceClass.bind(this)}
                    selecteds = {[selected]}
                    multiple={false}
                />
            </Modal>
        );
    }
    // endregion
    
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
    
    getWorkDateRender(data, type) {
        return (<div className="clock-rule-week" key={type}>
            <span>{type === 0 ? '常规' : type === 1 ? '大周' : '小周'}</span>
            <ul>
                {
                    !_.isEmpty(data) ?
                        data.map((classId, index) => {
                            return (
                                <li key={`${type}_${index}`}>
                                    <label><input onChange={(e)=>{this.onSelectAttendanceClassChange(e,type,index)}} type="checkbox" name="week" checked={classId > 0} />{weekChinese2[index + 1]}</label>
                                    <div className="form-control" onClick={this.updateSelectAttendanceClassModalOpenStatus.bind(this,true,{type,index})}>
                                        {this.getSectionName(classId)}
                                        <i className="iconfont work-service"></i>
                                    </div>
                                </li>
                            )
                        })
                        :
                        null
                }
            </ul>
        </div>);
    }
    render() {
        let { ruleInfo, updateRuleInfo } = this.props;
        return [
            <div className="clock-form-menu" key={1}>
                <h4>5、工作日设置</h4>
                <div className="clock-rule-workday">
                    <div className="clock-rule-model">
                        <label><input type="radio" name="working_model" defaultChecked={ruleInfo.working_model === 1 ? 'defaultChecked' : ''} onChange={(e) => { updateRuleInfo('working_model', 1); }} />常规模式</label>
                        <label><input type="radio" name="working_model" defaultChecked={ruleInfo.working_model === 2 ? 'defaultChecked' : ''} onChange={(e) => { updateRuleInfo('working_model', 2); }} />大小周模式</label>
                        <p><a onClick={this.updateSelectAttendanceClassModalOpenStatus.bind(this,true,null)} href="javascript:;" draggable='false'>快速设置</a></p>
                    </div>
                    {
                        ruleInfo.working_model === 1 ? this.getWorkDateRender(ruleInfo.working_date.general,0) : ruleInfo.working_model === 2 ? [this.getWorkDateRender(ruleInfo.working_date.big,1),this.getWorkDateRender(ruleInfo.working_date.small,2)] : null
                    }
                    {
                        ruleInfo.working_model === 2 ?
                            <div className="clock-rule-week">
                                <span>当前周</span>
                                <label><input type="radio" name="size" defaultChecked={ruleInfo.week_type === 2 ? 'defaultChecked' : ''} onChange={(e) => { updateRuleInfo('week_type', 2); }} />大周</label>
                                <label><input type="radio" name="size" defaultChecked={ruleInfo.week_type === 3 ? 'defaultChecked' : ''} onChange={(e) => { updateRuleInfo('week_type', 3); }} />小周</label>
                            </div>
                            :
                            null
                    }
                    <p><label><input type="checkbox" defaultChecked={ruleInfo.holiday_auto_rest === 1 ? 'defaultChecked' : ''} onChange={(e) => { updateRuleInfo('holiday_auto_rest', e.target.checked ? 1 : 0); }} />法定节假日自动排休</label></p>
                </div>
            </div>,
            <div className="clock-form-menu" key={2}>
                <h4>6、特殊日期</h4>
                <div className="clock-rule-ways">
                    <div className="clock-way-site">
                        <span>必须打卡</span>
                        <a onClick={() => { this.updateAddNeedCheckDateModalOpenStatus(true,null); }} draggable='false' href="javascript:;" className="btn-white-blue">+添加日期</a>
                        {
                            !_.isEmpty(ruleInfo.need_check_date) ?
                                <div className="clock-site-list">
                                    <ul>
                                        {
                                            ruleInfo.need_check_date.map((item, index) => {
                                                return (
                                                    <li key={index}>
                                                        <span>{moment(item.special_date).format('YYYY-MM-DD')}<em>({this.getSectionName(item.attendance_class_id)})</em></span>
                                                        <div className="clock-workope">
                                                            <a onClick={() => { this.updateAddNeedCheckDateModalOpenStatus(true,item); }} draggable='false' href="javascript:;" className="edit"><i className="iconfont icon-edit"></i>编辑</a>
                                                            <a onClick={this.deleteNeedCheckDate.bind(this, index)} draggable='false' href="javascript:;" className="del"><i className="iconfont icon-delete"></i>删除</a>
                                                        </div>
                                                    </li>
                                                )
                                            })
                                        }
                                    </ul>
                                </div>
                                :
                                null
                        }
                    </div>
                    <div className="clock-way-site">
                        <span>无须打卡</span>
                        <a onClick={() => { this.setState({ addNoCheckDateModalOpen: true }); }} draggable='false' href="javascript:;" className="btn-white-blue">+添加日期</a>
                        {
                            !_.isEmpty(ruleInfo.no_check_date) ?
                                <div className="clock-site-list">
                                    <ul>
                                        {
                                            ruleInfo.no_check_date.map((value, index) => {
                                                return (
                                                    <li key={index}>
                                                        <span>{moment(value).format('YYYY-MM-DD')}<em>(休息)</em></span>
                                                        <div className="clock-workope">
                                                            <a onClick={this.deleteNoCheckDate.bind(this, index)} draggable='false' href="javascript:;" className="del"><i className="iconfont icon-delete"></i>删除</a>
                                                        </div>
                                                    </li>
                                                )
                                            })
                                        }
                                    </ul>
                                </div>
                                :
                                null
                        }
                    </div>
                </div>
                {this.noCheckDateSelectModalRender()}
                {this.needCheckDateSelectModalRender()}
                {this.selectAttendanceClassModalRender()}
            </div>
        ];
    }
}

Fixed.propTypes = {
    ruleInfo: PropTypes.object.isRequired,
    updateRuleInfo: PropTypes.func.isRequired,
};
export default Fixed;