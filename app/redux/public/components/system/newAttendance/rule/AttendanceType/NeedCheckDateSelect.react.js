import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from "prop-types";
import DateInput from '../../../../common/validateComponents/Components/Date.js';
import apiHelper from '../../../../../api/apiHelper.js';

class NeedCheckDateSelect extends Component {
    constructor(props) {
        super(props);
        let today = this.getDayStartTimeUnix(_.now());
        let selectClassId = 0;
        if(!_.isEmpty(props.editNeedCheckDateInfo)){
            today = props.editNeedCheckDateInfo.special_date;
            selectClassId = props.editNeedCheckDateInfo.attendance_class_id;
        }
        this.state = {
            selectDate: today,
            selectClassId: selectClassId,
            errInfo: this.getCheckDateError(today, props.needCheckDates, props.noNeedCheckDates,props.editNeedCheckDateInfo)
        }
    }
    getDayStartTimeUnix(date) {
        return moment(date).startOf('day').valueOf();
    }
    submit(e) {
        let { selectDate, errInfo,selectClassId } = this.state;
        if (errInfo) return;
        if(!selectClassId){
            apiHelper.error('请选择考勤班次',1500);
            return;
        }
        let { enterFunction } = this.props;
        enterFunction({special_date:selectDate,attendance_class_id:selectClassId});
    }
    getCheckDateError(currentDate, needCheckDates, noNeedCheckDates,editNeedCheckDateInfo) {
        if (!_.isEmpty(noNeedCheckDates)) {
            if (_.includes(noNeedCheckDates, currentDate)) {
                return '该日期已被指定为不需要打卡';
            }
        }
        if (_.isEmpty(editNeedCheckDateInfo) && !_.isEmpty(needCheckDates)) {//编辑状态不检测必须打卡日期
            if (_.findIndex(needCheckDates, { special_date: currentDate })>-1) {
                return '该日期已被指定为必须打卡';
            }
        }
        return null;
    }
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
    getSectionName(sections) {
        let retArray = [];
        if (!_.isEmpty(sections)) {
            sections.map((item) => {
                if (item.is_rest === 0)
                    retArray.push(`${this.getTimeAcrossName(item.start_time_across)}${item.start_time}-${this.getTimeAcrossName(item.end_time_across)}${item.end_time}`)
            }, this);
        }
        return retArray;
    }
    render() {
        let { closeModal, needCheckDates, noNeedCheckDates,editNeedCheckDateInfo } = this.props;
        let { selectDate, errInfo,selectClassId } = this.state;
        let classArray = window.global.AttendanceClassProcessor.getAttendanceClasses().attendanceClasses;
        return (
            <div className="modal-content">
                <div className="modal-header">
                    <a onClick={closeModal} href="javascript:;" draggable="false" className="close"><i className="iconfont icon-delname"></i></a>
                    <h4 className="modal-title">选择不用打卡日期</h4>
                </div>
                <div className="modal-body">

                    <div className="tool-box clearfix">
                        <div className="search-box">
                            <DateInput
                                timePicker={false}
                                onChangeFunc={(value) => {
                                    this.setState({ selectDate: value.valueOf(), errInfo: this.getCheckDateError(value.valueOf(), needCheckDates, noNeedCheckDates,editNeedCheckDateInfo) })
                                }}
                                defaultDate={this.state.selectDate}
                                dateFormatStr={'YYYY-MM-DD'}
                                disabled={!_.isEmpty(editNeedCheckDateInfo)}
                            />
                            <b className="red">{errInfo}</b>
                        </div>
                    </div>
                    <div className="table-box clearfix">
                        <div className="table-cont">
                            {
                                !_.isEmpty(classArray) ?
                                    <table>
                                        <colgroup>
                                            <col width="2%" />
                                            <col width="18%" />
                                            <col width="80%" />
                                        </colgroup>
                                        <tbody>
                                            <tr>
                                                <th>&nbsp;</th>
                                                <th>
                                                    <span>班次名称</span>
                                                </th>
                                                <th>
                                                    <span>考勤时间</span>
                                                </th>
                                            </tr>
                                            {
                                                classArray.map((item, index) => {
                                                    return (
                                                        <tr onClick={()=>{ item.id !== selectClassId&&this.setState({selectClassId:item.id});}} key={index}>
                                                            <td>
                                                                <input checked={item.id === selectClassId} type="radio" name="attendanceClass" />
                                                            </td>
                                                            <td>
                                                                <span>班次{item.title}</span>
                                                            </td>
                                                            <td>
                                                                <span>{this.getSectionName(item.section).join(' ')}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            }
                                        </tbody>
                                    </table>
                                    :
                                    null
                            }
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={this.submit.bind(this)} className="btn btn-primary" value="submit">确定</button>
                    <button onClick={closeModal} type="button" className="btn btn-default">取消</button>
                </div>
            </div>
        );
    }
}

NeedCheckDateSelect.propTypes = {
    needCheckDates: PropTypes.array.isRequired,
    noNeedCheckDates: PropTypes.array.isRequired,
    editNeedCheckDateInfo: PropTypes.object,
    closeModal: PropTypes.func,//关闭窗口
    enterFunction: PropTypes.func,//保存回调
};
export default NeedCheckDateSelect;