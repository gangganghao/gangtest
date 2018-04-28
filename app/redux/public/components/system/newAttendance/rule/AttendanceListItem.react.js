import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from "prop-types";
import apiHelper from '../../../../api/apiHelper.js';
import Confirm from '../../../common/Confirm.react.js';
import { weekChineseShort, weekChinese } from '../../../../constants/Constant.js';
import UsersView from './UsersView.react';
import { customStyles } from '../../../../constants/Constant.js';
import Modal from 'react-modal';

class AttendanceListItem extends Component {
    constructor(props) {
        super(props);
        this.state = {
            deleteConfirmIsOpen: false,
            userViewModalIsOpen: false,
        }
    }
    getApplicableUsers(applyUserAndDeptIds) {
        let retArr = [];
        if (_.isEmpty(applyUserAndDeptIds)) return retArr;
        let applyUserIds = _.filter(applyUserAndDeptIds, { relation_type: 1 });
        let applyDeptIds = _.filter(applyUserAndDeptIds, { relation_type: 2 });
        if (!_.isEmpty(applyDeptIds)) {
            let deptIds = _.map(applyDeptIds, 'relation_id');
            let deptNames = apiHelper.getDeptInfo(deptIds, 'dept_name', 'array');
            retArr = _.concat(retArr, deptNames);
            if (retArr.length >= 4) return _.take(retArr, 4);
        }
        if (!_.isEmpty(applyUserIds)) {
            let userIds = _.map(applyUserIds, 'relation_id');
            let userNames = apiHelper.getUserInfo(userIds, 'username');
            retArr = _.concat(retArr, userNames);
            if (retArr.length >= 4) return _.take(retArr, 4);
        }
        return retArr;
    }
    deleteAttendanceRule() {
        let { ruleItem, actions } = this.props;
        actions.delAttendanceRule(ruleItem.id);
    }
    deleteConfirmRender() {
        let { deleteConfirmIsOpen } = this.state;
        if (!deleteConfirmIsOpen) {
            return null;
        }
        return (<Confirm
            modalIsOpen={deleteConfirmIsOpen}
            closeModal={() => {
                this.setState({ deleteConfirmIsOpen: false })
            }}
            enterFunc={this.deleteAttendanceRule.bind(this)}
            message={"考勤规则删除后不可恢复，确认删除？"}
        />);
    }
    /**
     * 查看所有适用人员
     * 
     * @returns 
     * @memberof AttendanceListItem
     */
    userViewModalRender() {
        let { userViewModalIsOpen } = this.state;
        if (!userViewModalIsOpen) {
            return null;
        }
        let { ruleItem } = this.props;
        return (
            <Modal
                isOpen={true}
                style={customStyles}
                portalClassName="userViewModalIsOpen"
                contentLabel="users View Modal"
            >
                <UsersView
                    closeModal={() => { this.setState({ userViewModalIsOpen: false }) }}
                    ruleUsers={ruleItem.rule_user}
                />
            </Modal>
        )
    }

    // region 考勤时间格式化
    
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
        id = parseInt(id);
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
    getAttendanceTimeDesc(ruleItem) {
        let retArray = [];
        switch (ruleItem.attendance_type) {//考勤类型 1固定班制 2排班制 3自由工时
            case 1:
                if (ruleItem.working_model === 1) {//固定班制，工作日模式(固定班制必填)允许值: 1常规模式, 2大小周模式
                    let classAndWeekObj = {};
                    ruleItem.working_date.general.map((classId, index) => {
                        if (classAndWeekObj.hasOwnProperty(classId)) {
                            classAndWeekObj[classId].push({ classId, index });
                        } else {
                            classAndWeekObj[classId] = [{ classId, index }];
                        }
                    });
                    if (!_.isEmpty(classAndWeekObj)) {
                        _.mapKeys(classAndWeekObj, (value, key) => {
                            let weeks = value.map((classObj) => {
                                return weekChineseShort[classObj.index];
                            });
                            retArray.push(<p key={`${key}-week`}>周{weeks.join('、')}</p>);
                            retArray.push(<p key={`${key}-class`}>{this.getSectionName(key)}</p>);
                        }, this);
                    }
                } else if (ruleItem.working_model === 2) {
                    let bigClassAndWeekObj = {};
                    ruleItem.working_date.big.map((classId, index) => {
                        if (bigClassAndWeekObj.hasOwnProperty(classId)) {
                            bigClassAndWeekObj[classId].push({ classId, index });
                        } else {
                            bigClassAndWeekObj[classId] = [{ classId, index }];
                        }
                    });
                    if (!_.isEmpty(bigClassAndWeekObj)) {
                        _.mapKeys(bigClassAndWeekObj, (value, key) => {
                            let weeks = value.map((classObj) => {
                                return weekChineseShort[classObj.index];
                            });
                            retArray.push(<p key={`${key}-big-week`}>大周{weeks.join('、')}</p>);
                            retArray.push(<p key={`${key}-big-class`}>{this.getSectionName(key)}</p>);
                        }, this);
                    }
                    let smallClassAndWeekObj = {};
                    ruleItem.working_date.small.map((classId, index) => {
                        if (smallClassAndWeekObj.hasOwnProperty(classId)) {
                            smallClassAndWeekObj[classId].push({ classId, index });
                        } else {
                            smallClassAndWeekObj[classId] = [{ classId, index }];
                        }
                    });
                    if (!_.isEmpty(smallClassAndWeekObj)) {
                        _.mapKeys(smallClassAndWeekObj, (value, key) => {
                            let weeks = value.map((classObj) => {
                                return weekChineseShort[classObj.index];
                            });
                            retArray.push(<p key={`${key}-small-week`}>小周{weeks.join('、')}</p>);
                            retArray.push(<p key={`${key}-small-class`}>{this.getSectionName(key)}</p>);
                        }, this);
                    }
                }
                break;
            case 2:
                if (!_.isEmpty(ruleItem.working_date.class)) {
                    ruleItem.working_date.class.map((classId, index) => {
                        retArray.push(<p key={index}>{this.getSectionName(classId)}</p>);
                    });
                }
                break;
            case 3:
                if (!_.isEmpty(ruleItem.working_date.days)) {
                    let weeks = ruleItem.working_date.days.map((week, index) => {
                        return weekChineseShort[week];
                    });
                    retArray.push(<p>周{weeks.join('、')}</p>);
                }
                break;
        }
        return retArray;
    }
    // endregion
    
    render() {
        let { ruleItem, newAttendanceRule, updateEditScheduleModalIsOpenStatus } = this.props;
        let userAndDepartNames = this.getApplicableUsers(ruleItem.applicable_user);
        return (
            <tr>
                <td><span>{ruleItem.title}</span></td>
                <td>
                    <span>
                        {userAndDepartNames.join(',')}
                        <a onClick={()=>{this.setState({userViewModalIsOpen:true});}} draggable='false' href="javascript:;">等{ruleItem.rule_user.length}人</a>
                    </span>
                </td>
                <td><span>{ruleItem.attendance_type === 1 ? '固定班制' : ruleItem.attendance_type === 2 ? '排班制' : '自由工时'}</span></td>
                <td>
                    {this.getAttendanceTimeDesc(ruleItem)}
                </td>
                <td>
                    {
                        ruleItem.attendance_type === 2 ? <a onClick={() => { updateEditScheduleModalIsOpenStatus(true, ruleItem.id) }} draggable='false' href="javascript:;" className="edit">排班</a> : null
                    }
                    <a onClick={() => { newAttendanceRule(ruleItem.id); }} draggable='false' href="javascript:;" className="edit">编辑</a>
                    <a onClick={()=>{this.setState({deleteConfirmIsOpen:true});}} draggable='false' href="javascript:;" className="omit">删除</a>
                </td>
                {this.deleteConfirmRender()}
                {this.userViewModalRender()}
            </tr>
        );
    }
}

AttendanceListItem.propTypes = {
    ruleItem: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
    newAttendanceRule: PropTypes.func.isRequired,
    updateEditScheduleModalIsOpenStatus: PropTypes.func.isRequired,
};
export default AttendanceListItem;