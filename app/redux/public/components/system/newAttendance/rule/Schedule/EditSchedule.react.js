import React, { Component } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from "prop-types";
import * as actions from '../../../../../actions/newSystemAttendance/RuleActions';
import apiHelper from '../../../../../api/apiHelper.js';
import Loading from '../../../../common/Loading.react';
import { weekChineseShort } from '../../../../../constants/Constant.js';
import DateInput from '../../../../common/validateComponents/Components/Date.js';
import SelectAttendanceClass from './SelectAttendanceClass.react';
import ScheduleCycle from './ScheduleCycle.react';
import ScheduleStatistics from './ScheduleStatistics.react';
import Modal from 'react-modal';
import { attendanceScheduleCycleModalStyle } from '../../../../../constants/Constant.js';
import { Table, Column, ColumnGroup, Cell } from 'fixed-data-table-2';
import ScheduleDataTable from './ScheduleDataTable.react';
import ScheduleFixDataTable from './ScheduleFixDataTable.react';

class EditSchedule extends Component {
    constructor(props) {
        super(props);
        let scheduleDate = new moment(_.now()).startOf('month');
        this.state = {
            scheduleInfoLoading: false,
            scheduleDateValue: scheduleDate.valueOf(),
            mouthDayArray: this.getMouthDayArrayByTime(scheduleDate),
            scheduleInfo: null,
            classArray: window.global.AttendanceClassProcessor.getAttendanceClasses().attendanceClasses,
            selectAttendanceClassIsShow: false,
            currentInfo: null,//{left:0,top:0,momentDateValue:时间轴位置,userId：人员轴位置,classId：当前表格内的已选Id,isSupportCycle:是否可以按照周期排班}
            scheduleCycleModalIsOpen: false,//排班周期设置窗口
            scheduleCycleSaving: false,//排班周期设置窗口
            scheduleSaving: false,//排班数据保存中
        }
    }
    componentWillReceiveProps(nextProps, nextState) {
        if (this.props.ruleId > 0) {
            if (!_.isEmpty(nextProps.scheduleInfo) && nextProps.scheduleInfo != this.props.scheduleInfo && nextProps.ruleId == this.props.ruleId && _.isEmpty(this.state.scheduleInfo)) {
                this.setState({ scheduleInfo: _.cloneDeep(nextProps.scheduleInfo) });
            }
        }
    }
    componentDidMount() {
        let scheduleDateValue = new moment(_.now()).startOf('month').valueOf();
        let { ruleId, actions } = this.props;
        actions.getAttendanceScheduleUser(ruleId, scheduleDateValue, 0, () => {
            this.setState({ scheduleInfoLoading: false });
        });
    }
    /**
     * 组件注销时，清空状态树中的用户排班数据
     * 
     * @memberof EditSchedule
     */
    componentWillUnmount() {
        this.props.actions.clearScheduleInfo();
    }
    /**
     * 获取单月每天的数组
     * 
     * @param {any} currentUnixTime 
     * @returns 
     * @memberof EditSchedule
     */
    getMouthDayArrayByTime(currentUnixTime) {
        let retArry = [];
        let currentTimeObj = new moment(currentUnixTime);
        let start = currentTimeObj.startOf('month');//当月的1号
        let end = _.cloneDeep(start).add(1, 'M');//下月的1号
        for (var tempDate = _.cloneDeep(start); tempDate.isBefore(end); tempDate.add(1, 'd')) {
            retArry.push({
                momentDate: _.cloneDeep(tempDate),
                unixTime: tempDate.valueOf(),
                num: tempDate.format('D'),
                week: tempDate.day(),//当前星期几，星期天为0
            });
        }
        return retArry;
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

    // region 排班操作
    updateSelectAttendanceClassIsShowStatus(selectAttendanceClassIsShow, currentInfo) {
        if (selectAttendanceClassIsShow) {
            let self = this;
            this.setState({ selectAttendanceClassIsShow: true, currentInfo }, () => {
                $('body').on('mousedown', function (e) {
                    if ($(e.target).closest(".back-arr-elect").length <= 0) {
                        self.updateSelectAttendanceClassIsShowStatus(false, null);
                        $('body').off('mousedown');
                        // e.stopPropagation();
                    }
                });
            });
        } else {
            this.setState({ selectAttendanceClassIsShow: false, currentInfo: null }, () => {
                $('body').off('mousedown');
            });
        }
    }
    setScheduleY(e, unixTime) {
        var isFixTable = !_.isEmpty($(e.target).parents('div.setScheduleY'));//是否用的是table插件
        var $td = !_.isEmpty($(e.target).parents('td')) ? $(e.target).parents('td') : isFixTable ? $(e.target).parents('div.setScheduleY') : $(e.target);//找到td，e.target可能不是td，但他的父级必定有td
        var left = $td.offset().left;
        var top = $td.offset().top;
        var windowWidth = $(window).width();
        left = (windowWidth - left) < 197 ? left - 197 + 40 : left;
        left = windowWidth - left < 197 ? windowWidth - 197 : left;
        top = isFixTable ? top + 45 : top + 57;
        let currentInfo = {
            left: left,
            top: top,
            unixTime: unixTime,
            userId: 0,
            classId: 0,
            isSupportCycle: false
        };
        this.updateSelectAttendanceClassIsShowStatus(true, currentInfo);
    }
    setScheduleX(e, userId) {
        var $td = !_.isEmpty($(e.target).parents('td')) ? $(e.target).parents('td') : !_.isEmpty($(e.target).parents('div.setScheduleX')) ? $(e.target).parents('div.setScheduleX') : $(e.target);//找到td，e.target可能不是td，但他的父级必定有td
        var left = $td.offset().left;
        var top = $td.offset().top;
        var windowHeight = $(window).height();
        top = windowHeight - top < 252 ? top - 252 : top + 43;
        top = windowHeight - top < 252 ? windowHeight - 252 : top;
        let currentInfo = {
            left: left,
            top: top,
            unixTime: 0,
            userId: userId,
            classId: 0,
            isSupportCycle: true
        };
        this.updateSelectAttendanceClassIsShowStatus(true, currentInfo);
    }
    setSchedule(e, unixTime, userId, classId = 0) {
        var $td = !_.isEmpty($(e.target).parents('td')) ? $(e.target).parents('td') : $(e.target);//找到td，e.target可能不是td，但他的父级必定有td
        var left = $td.offset().left;
        var top = $td.offset().top;
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        left = (windowWidth - left) < 197 ? left - 197 + 40 : left;
        left = windowWidth - left < 197 ? windowWidth - 197 : left;
        top = windowHeight - top < 252 ? top - 252 : top + 43;
        top = windowHeight - top < 252 ? windowHeight - 252 : top;
        let currentInfo = {
            left: left,
            top: top,
            unixTime: unixTime,
            userId: userId,
            classId: classId,
            isSupportCycle: true
        };
        this.updateSelectAttendanceClassIsShowStatus(true, currentInfo);
    }
    /**
     * 排班数据变更
     * 
     * @param {number} classId 选择的班次Id
     * @param {number} selectType 排班类型 0：按天排班，1：周期排班
     * @returns 
     * @memberof EditSchedule
     */
    onSelectAttendanceClassChange(classId, selectType) {
        let { currentInfo, scheduleInfo, mouthDayArray } = this.state;
        if (_.isEmpty(currentInfo)) {
            this.updateSelectAttendanceClassIsShowStatus(false);
            return;
        }
        if (selectType === 1 && _.isEmpty(scheduleInfo.schedule_cricle)) {
            apiHelper.error('请先设置排班周期', 1500);
            this.updateSelectAttendanceClassIsShowStatus(false);
            return;
        }
        if (_.isEmpty(scheduleInfo)) {
            scheduleInfo = { schedule_data: [] };
        }
        if (_.isEmpty(scheduleInfo)) {
            scheduleInfo.schedule_data = [];
        }
        let { unixTime, userId } = currentInfo;
        if (unixTime && userId) {//按照日期和人员排班,可以按照周期排班
            let userIndex = _.findIndex(scheduleInfo.schedule_data, { uid: userId });
            if (selectType === 0) {
                if (userIndex === -1) {//当前人员从未排过班
                    scheduleInfo.schedule_data.push({
                        uid: userId,
                        schedule: [{
                            schedule_date: unixTime,
                            attendance_class_id: classId
                        }]
                    });
                } else {
                    var userScheduleDataArray = scheduleInfo.schedule_data[userIndex].schedule || [];
                    var userScheduleIndex = _.findIndex(userScheduleDataArray, { schedule_date: unixTime });
                    if (userScheduleIndex > -1) {//修改班次
                        userScheduleDataArray[userScheduleIndex] = {
                            schedule_date: unixTime,
                            attendance_class_id: classId
                        };
                    } else {
                        userScheduleDataArray.push({
                            schedule_date: unixTime,
                            attendance_class_id: classId
                        });
                    }
                }
            } else if (selectType === 1) {
                let tempMouthDayArray = _.filter(mouthDayArray, (m) => { return m.unixTime >= unixTime; });//当前选中的日期及以后的日期
                if (!_.isEmpty(tempMouthDayArray)) {
                    let mouthDayArrayLength = tempMouthDayArray.length, attendanceCycleClassLength = scheduleInfo.schedule_cricle.attendance_class.length;
                    let overflowCount = attendanceCycleClassLength - mouthDayArrayLength % attendanceCycleClassLength;//获取溢出天数
                    if (userIndex === -1) {//当前人员从未排过班
                        let tempUserScheduleData = {
                            uid: userId,
                            schedule: []
                        };
                        tempMouthDayArray.map((item, index) => {
                            let classIdIndex = index;//需要取的排班周期中的班次Id下标
                            if (index >= attendanceCycleClassLength) {
                                classIdIndex = index % attendanceCycleClassLength;
                            }
                            tempUserScheduleData.schedule.push({
                                schedule_date: item.unixTime,
                                date: moment(item.unixTime).format('YYYY-MM-DD'),
                                attendance_class_id: scheduleInfo.schedule_cricle.attendance_class[classIdIndex]
                            });
                        });
                        if (overflowCount > 0) {//排班数据有溢出
                            let nextMouth = new moment(tempMouthDayArray[0].unixTime).add(1, 'M').startOf('month').add(overflowCount - 1, 'd');//下个月初,再加上溢出的天数
                            let overflowAttendanceClassIndex = attendanceCycleClassLength - 1;
                            for (let i = overflowCount; i > 0 && overflowAttendanceClassIndex > 0; i--) {//倒序来填充数据
                                tempUserScheduleData.schedule.push({
                                    schedule_date: nextMouth.valueOf(),
                                    date: moment(nextMouth.valueOf()).format('YYYY-MM-DD'),
                                    attendance_class_id: scheduleInfo.schedule_cricle.attendance_class[overflowAttendanceClassIndex]
                                });
                                nextMouth = nextMouth.add(-1, 'd');//最大溢出天数，减一
                                overflowAttendanceClassIndex--;
                            }
                        }
                        scheduleInfo.schedule_data.push(tempUserScheduleData);
                    } else {
                        _.remove(scheduleInfo.schedule_data[userIndex].schedule, (sd) => { return sd.schedule_date >= unixTime; });//移除所以日期及以后的所有的排班数据
                        let tempScheduleDateAndClasses = [];
                        tempMouthDayArray.map((item, index) => {
                            let classIdIndex = index;//需要取的排班周期中的班次Id下标
                            if (index >= attendanceCycleClassLength) {
                                classIdIndex = index % attendanceCycleClassLength;
                            }
                            tempScheduleDateAndClasses.push({
                                schedule_date: item.unixTime,
                                date: moment(item.unixTime).format('YYYY-MM-DD'),
                                attendance_class_id: scheduleInfo.schedule_cricle.attendance_class[classIdIndex]
                            });
                        });
                        if (overflowCount > 0) {//排班数据有溢出
                            let nextMouth = new moment(tempMouthDayArray[0].unixTime).add(1, 'M').startOf('month').add(overflowCount - 1, 'd');//下个月初,再加上溢出的天数
                            let overflowAttendanceClassIndex = attendanceCycleClassLength - 1;
                            for (let i = overflowCount; i > 0 && overflowAttendanceClassIndex > 0; i--) {//倒序来填充数据
                                tempScheduleDateAndClasses.push({
                                    schedule_date: nextMouth.valueOf(),
                                    date: moment(nextMouth.valueOf()).format('YYYY-MM-DD'),
                                    attendance_class_id: scheduleInfo.schedule_cricle.attendance_class[overflowAttendanceClassIndex]
                                });
                                nextMouth = nextMouth.add(-1, 'd');//最大溢出天数，减一
                                overflowAttendanceClassIndex--;
                            }
                        }
                        //合并选择日期之前的数据
                        scheduleInfo.schedule_data[userIndex].schedule = _.concat(scheduleInfo.schedule_data[userIndex].schedule, tempScheduleDateAndClasses);
                    }

                } else {
                    apiHelper.error('日期选择错误', 1500);
                    this.updateSelectAttendanceClassIsShowStatus(false);
                    return;
                }

            }

        } else if (!unixTime && userId) {//按照人员排班,可以按照周期排班
            let userIndex = _.findIndex(scheduleInfo.schedule_data, { uid: userId });
            if (selectType === 0) {
                let newUserScheduleDataArray = newUserScheduleDataArray = mouthDayArray.map((item) => {
                    return { schedule_date: item.unixTime, attendance_class_id: classId };
                }) || [];
                if (userIndex === -1) {//没有排过班
                    scheduleInfo.schedule_data.push({
                        uid: userId,
                        schedule: newUserScheduleDataArray
                    });
                } else {
                    scheduleInfo.schedule_data[userIndex] = {
                        uid: userId,
                        schedule: newUserScheduleDataArray
                    };
                }
            } else if (selectType === 1) {
                let mouthDayArrayLength = mouthDayArray.length, attendanceCycleClassLength = scheduleInfo.schedule_cricle.attendance_class.length;
                let overflowCount = attendanceCycleClassLength - mouthDayArrayLength % attendanceCycleClassLength;//获取溢出天数
                if (userIndex === -1) {//当前人员从未排过班
                    let tempUserScheduleData = {
                        uid: userId,
                        schedule: []
                    };
                    mouthDayArray.map((item, index) => {
                        let classIdIndex = index;//需要取的排班周期中的班次Id下标
                        if (index >= attendanceCycleClassLength) {
                            classIdIndex = index % attendanceCycleClassLength;
                        }
                        tempUserScheduleData.schedule.push({
                            schedule_date: item.unixTime,
                            date: moment(item.unixTime).format('YYYY-MM-DD'),
                            attendance_class_id: scheduleInfo.schedule_cricle.attendance_class[classIdIndex]
                        });
                    });
                    if (overflowCount > 0) {//排班数据有溢出
                        let nextMouth = new moment(mouthDayArray[0].unixTime).add(1, 'M').startOf('month').add(overflowCount - 1, 'd');//下个月初,再加上溢出的天数
                        let overflowAttendanceClassIndex = attendanceCycleClassLength - 1;
                        for (let i = overflowCount; i > 0 && overflowAttendanceClassIndex > 0; i--) {//倒序来填充数据
                            tempUserScheduleData.schedule.push({
                                schedule_date: nextMouth.valueOf(),
                                date: moment(nextMouth.valueOf()).format('YYYY-MM-DD'),
                                attendance_class_id: scheduleInfo.schedule_cricle.attendance_class[overflowAttendanceClassIndex]
                            });
                            nextMouth = nextMouth.add(-1, 'd');//最大溢出天数，减一
                            overflowAttendanceClassIndex--;
                        }
                    }
                    scheduleInfo.schedule_data.push(tempUserScheduleData);
                } else {
                    let tempScheduleDateAndClasses = [];
                    mouthDayArray.map((item, index) => {
                        let classIdIndex = index;//需要取的排班周期中的班次Id下标
                        if (index >= attendanceCycleClassLength) {
                            classIdIndex = index % attendanceCycleClassLength;
                        }
                        tempScheduleDateAndClasses.push({
                            schedule_date: item.unixTime,
                            date: moment(item.unixTime).format('YYYY-MM-DD'),
                            attendance_class_id: scheduleInfo.schedule_cricle.attendance_class[classIdIndex]
                        });
                    });
                    if (overflowCount > 0) {//排班数据有溢出
                        let nextMouth = new moment(mouthDayArray[0].unixTime).add(1, 'M').startOf('month').add(overflowCount - 1, 'd');//下个月初,再加上溢出的天数
                        let overflowAttendanceClassIndex = attendanceCycleClassLength - 1;
                        for (let i = overflowCount; i > 0 && overflowAttendanceClassIndex > 0; i--) {//倒序来填充数据
                            tempScheduleDateAndClasses.push({
                                schedule_date: nextMouth.valueOf(),
                                date: moment(nextMouth.valueOf()).format('YYYY-MM-DD'),
                                attendance_class_id: scheduleInfo.schedule_cricle.attendance_class[overflowAttendanceClassIndex]
                            });
                            nextMouth = nextMouth.add(-1, 'd');//最大溢出天数，减一
                            overflowAttendanceClassIndex--;
                        }
                    }
                    //合并选择日期之前的数据
                    scheduleInfo.schedule_data[userIndex].schedule = tempScheduleDateAndClasses;
                }
            }

        } else if (unixTime && !userId) {//按照日期排班
            if (!_.isEmpty(scheduleInfo.schedule_uids)) {
                scheduleInfo.schedule_uids.map((uid) => {
                    let userIndex = _.findIndex(scheduleInfo.schedule_data, { uid: uid });
                    if (userIndex === -1) {//当前人员从未排过班
                        scheduleInfo.schedule_data.push({
                            uid: uid,
                            schedule: [{
                                schedule_date: unixTime,
                                attendance_class_id: classId
                            }]
                        });
                    } else {
                        var userScheduleDataArray = scheduleInfo.schedule_data[userIndex].schedule || [];
                        var userScheduleIndex = _.findIndex(userScheduleDataArray, { schedule_date: unixTime });
                        if (userScheduleIndex > -1) {//修改班次
                            userScheduleDataArray[userScheduleIndex] = {
                                schedule_date: unixTime,
                                attendance_class_id: classId
                            };
                        } else {
                            userScheduleDataArray.push({
                                schedule_date: unixTime,
                                attendance_class_id: classId
                            });
                        }
                    }
                });
            }

        }
        this.setState({ scheduleInfo }, () => {
            this.updateSelectAttendanceClassIsShowStatus(false);
        });
    }
    // endregion

    // region 设置排班周期
    onScheduleCycleChange(title, days, selectedClassIds) {
        this.setState({ scheduleCycleSaving: true });
        let { ruleId, actions } = this.props;
        actions.addAttendanceScheduleCycle(ruleId, title, days, selectedClassIds, (err) => {
            if (err) {
                this.setState({ scheduleCycleSaving: false });
                apiHelper.error(err.message, 1500);
                return;
            }
            let { scheduleInfo } = this.state;
            if (!_.isEmpty(scheduleInfo)) {
                let scheduleCricle = {
                    title: title,
                    days: days,
                    attendance_class: selectedClassIds,
                }
                scheduleInfo.schedule_cricle = scheduleCricle;
            }
            this.setState({ scheduleInfo, scheduleCycleModalIsOpen: false, scheduleCycleSaving: false });
        });
    }
    scheduleCycleRender() {
        let { scheduleCycleModalIsOpen, scheduleCycleSaving, scheduleInfo } = this.state;
        if (!scheduleCycleModalIsOpen) {
            return null;
        }
        return (
            <Modal
                isOpen={true}
                style={attendanceScheduleCycleModalStyle}
                contentLabel={"scheduleCycleModal"}
            >
                <ScheduleCycle
                    closeModal={() => { this.setState({ scheduleCycleModalIsOpen: false }); }}
                    enterFunction={this.onScheduleCycleChange.bind(this)}
                    attendanceClassIds={scheduleInfo.attendance_class}
                    scheduleCycleObj={scheduleInfo.schedule_cricle}
                    scheduleCycleSaving={scheduleCycleSaving}
                />
            </Modal>
        );
    }
    // endregion

    // region 日期变更
    onScheduleDateValueChange(value) {
        let { ruleId, actions } = this.props;
        this.setState({ scheduleDateValue: value.valueOf(), mouthDayArray: this.getMouthDayArrayByTime(value), scheduleInfoLoading: true, scheduleInfo: null }, () => {
            actions.getAttendanceScheduleUser(ruleId, value.valueOf(), 1, () => {
                this.setState({ scheduleInfoLoading: false });
            });
        });
    }
    // endregion

    // region 提交数据  和  恢复数据
    onSubmit(e) {
        let { ruleId, actions } = this.props;
        let { scheduleDateValue, scheduleInfo } = this.state;
        this.setState({ scheduleSaving: true });
        if (ruleId > 0 && scheduleDateValue > 0) {
            if (!_.isEmpty(scheduleInfo)) {
                if (!_.isEmpty(scheduleInfo.schedule_data)) {
                    let newScheduleData = scheduleInfo.schedule_data.map((item, index) => {
                        let maxSchedule = _.maxBy(item.schedule, (s) => { return s.schedule_date });
                        return {
                            ...item, last_time: maxSchedule.schedule_date
                        }
                    });
                    actions.addAttendanceScheduleUser(ruleId, scheduleDateValue, newScheduleData, (err) => {
                        if (err) {
                            this.setState({ scheduleSaving: false });
                            apiHelper.error(err.message, 1500);
                            return;
                        }
                        this.setState({ scheduleSaving: false, scheduleInfo: null });
                        apiHelper.info('保存成功', 1500);
                        return;
                    });
                    return;
                } else {
                    this.setState({ scheduleSaving: false });
                    apiHelper.error('请先进行排班', 1500);
                    return;
                }
            }
        }
        this.setState({ scheduleSaving: false });
        apiHelper.error('保存出错', 1500);
        return;
    }
    onReset(e) {
        this.setState({ scheduleInfo: _.cloneDeep(this.props.scheduleInfo) });
    }
    // endregion

    render() {
        let { scheduleDateValue, mouthDayArray, scheduleInfoLoading, scheduleInfo, classArray, selectAttendanceClassIsShow, currentInfo, scheduleSaving } = this.state;
        if (scheduleInfoLoading || _.isEmpty(scheduleInfo)) {
            return <Loading />;
        }
        let { closeModal } = this.props;
        return (
            <div className="back-arrange-pop">
                <div className="back-arrange-hd">
                    <i onClick={closeModal} className="iconfont icon-left-move"></i>
                    <h2>排班设置</h2>
                    <div className="data-sort">
                        <div className="task-scrone">
                            <label className="">
                                <input type="file" hidden={true} />
                                <i className="iconfont icon-file-down"></i>
                                导入
                            </label>
                        </div>
                        <div className="task-scrone">
                            <label className="">
                                <input type="file" hidden={true} />
                                <i className="iconfont icon-file-up"></i>
                                导出
                            </label>
                        </div>
                    </div>
                </div>
                <div className="back-arrange-cont clearfix">
                    <div className="back-arr-left">
                        <p>班次说明</p>
                        <ul>
                            {
                                !_.isEmpty(scheduleInfo.attendance_class) ?
                                    scheduleInfo.attendance_class.map((classId, index) => {
                                        let attendanceClass = _.find(classArray, { id: classId });
                                        if (_.isEmpty(attendanceClass)) return null;
                                        return (
                                            <li key={index}>
                                                <em className={`arr-box ${this.getClassNameByAttendanceClassId(classId)}`}></em>
                                                <span>{attendanceClass.title}</span>
                                                {
                                                    !_.isEmpty(attendanceClass.section) ?
                                                        attendanceClass.section.map((item, pIndex) => {
                                                            if (item.is_rest === 0) {
                                                                return <p key={pIndex}>{`${this.getTimeAcrossName(item.start_time_across)}${item.start_time}-${this.getTimeAcrossName(item.end_time_across)}${item.end_time}`}</p>;
                                                            }
                                                        }, this)
                                                        :
                                                        null
                                                }
                                            </li>
                                        );
                                    })
                                    :
                                    null
                            }
                            <li>
                                <em className="arr-rest"></em>
                                <span>休息</span>
                            </li>
                        </ul>
                    </div>
                    <div className="back-arr-right">
                        <div className="back-arr-date">
                            <div className="dateline-box">
                                <DateInput
                                    timePicker={false}
                                    onChangeFunc={this.onScheduleDateValueChange.bind(this)}
                                    defaultDate={scheduleDateValue}
                                    dateFormatStr={'YYYY-MM'}
                                />
                            </div>
                            <p>排班周期：
                                {
                                    !_.isEmpty(scheduleInfo.schedule_cricle) ?
                                        <span>{scheduleInfo.schedule_cricle.title}</span>
                                        :
                                        null
                                }
                                <a onClick={() => { this.setState({ scheduleCycleModalIsOpen: true }); }} draggable='false' href="javascript:;">设置</a></p>
                            <div className="fr">
                                <a onClick={this.onSubmit.bind(this)} disabled={scheduleSaving} draggable='false' href="javascript:;" className="btn btn-primary">保存</a>
                                <a onClick={this.onReset.bind(this)} draggable='false' href="javascript:;" className="btn btn-default">恢复</a>
                            </div>
                        </div>
                        <div className='back-arr-box'>
                            <div className="back-arr-table" id='userScheduleTable'>
                                {
                                    scheduleInfo.schedule_uids.length > 200 ?
                                        <ScheduleFixDataTable
                                            scheduleInfo={scheduleInfo}
                                            currentInfo={currentInfo}
                                            mouthDayArray={mouthDayArray}
                                            selectAttendanceClassIsShow={selectAttendanceClassIsShow}
                                            setSchedule={this.setSchedule.bind(this)}
                                            setScheduleX={this.setScheduleX.bind(this)}
                                            setScheduleY={this.setScheduleY.bind(this)}
                                            getClassNameByAttendanceClassId={this.getClassNameByAttendanceClassId.bind(this)}
                                            getSectionName={this.getSectionName.bind(this)}
                                        />
                                        :
                                        <ScheduleDataTable
                                            scheduleInfo={scheduleInfo}
                                            currentInfo={currentInfo}
                                            mouthDayArray={mouthDayArray}
                                            selectAttendanceClassIsShow={selectAttendanceClassIsShow}
                                            setSchedule={this.setSchedule.bind(this)}
                                            setScheduleX={this.setScheduleX.bind(this)}
                                            setScheduleY={this.setScheduleY.bind(this)}
                                            getClassNameByAttendanceClassId={this.getClassNameByAttendanceClassId.bind(this)}
                                            getSectionName={this.getSectionName.bind(this)}
                                        />
                                }
                                {
                                    selectAttendanceClassIsShow && <SelectAttendanceClass
                                        getClassNameByAttendanceClassId={this.getClassNameByAttendanceClassId.bind(this)}
                                        attendanceClassArray={classArray}
                                        scheduleCycle={scheduleInfo.schedule_cricle}
                                        attendanceClasses={scheduleInfo.attendance_class}
                                        selectId={currentInfo.classId}
                                        isSupportCycle={currentInfo.userId > 0}
                                        customStyle={{ ...this.customStyle, left: currentInfo.left || 0, top: currentInfo.top || 0 }}
                                        onSelectAttendanceClassChange={this.onSelectAttendanceClassChange.bind(this)}
                                        key={`${currentInfo.userId}-${currentInfo.unixTime}`}
                                    />
                                }
                            </div>
                            <ScheduleStatistics
                                attendanceClasses={scheduleInfo.attendance_class}
                                attendanceClassArray={classArray}
                                scheduleData={scheduleInfo.schedule_data}
                                getClassNameByAttendanceClassId={this.getClassNameByAttendanceClassId.bind(this)}
                                mouthDayArray={mouthDayArray}
                            />
                        </div>
                    </div>
                </div>
                {this.scheduleCycleRender()}
            </div>
        );
    }
}
const mapStateToProps = (state) => ({
    scheduleInfo: state.rule.scheduleInfo
});
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(actions, dispatch),
    dispatch: dispatch
});
EditSchedule.propTypes = {
    scheduleInfo: PropTypes.object,
    actions: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    closeModal: PropTypes.func.isRequired,
    enterFunction: PropTypes.func.isRequired,
    ruleId: PropTypes.number.isRequired,
};
EditSchedule.prototype.customStyle = {
    display: 'inline-block',
    position: 'fixed',
    left: 566.5,
    top: 308,
    bottom: 'initial',
    margin: 0
}
export default connect(mapStateToProps, mapDispatchToProps)(EditSchedule);
