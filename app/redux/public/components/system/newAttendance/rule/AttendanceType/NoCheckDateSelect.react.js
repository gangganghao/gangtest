import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from "prop-types";
import DateInput from '../../../../common/validateComponents/Components/Date.js';

class NoCheckDateSelect extends Component {
    constructor(props) {
        super(props);
        let today = this.getDayStartTimeUnix(_.now());
        this.state = {
            selectDate :today,
            errInfo:this.getCheckDateError(today,props.needCheckDates,props.noNeedCheckDates)
        }
    }
    getDayStartTimeUnix(date){
        return moment(date).startOf('day').valueOf();
    }
    submit(e){
        let {selectDate,errInfo} = this.state;
        if(errInfo)return;
        let {enterFunction} = this.props;
        enterFunction(selectDate);
    }
    getCheckDateError(currentDate,needCheckDates,noNeedCheckDates){
        if(!_.isEmpty(noNeedCheckDates)){
            if(_.includes(noNeedCheckDates,currentDate)){
                return '该日期已被指定为不需要打卡';
            }
        }
        if(!_.isEmpty(needCheckDates)){
            if(_.findIndex(needCheckDates,{special_date:currentDate})>-1){
                return '该日期已被指定为必须打卡';
            }
        }
        return null;
    }
    render() {
        let {closeModal,needCheckDates,noNeedCheckDates} = this.props;
        let {selectDate,errInfo} = this.state;
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
                                    this.setState({ selectDate: value.valueOf(),errInfo:this.getCheckDateError(value.valueOf(),needCheckDates,noNeedCheckDates) })
                                }}
                                defaultDate={this.state.selectDate}
                                dateFormatStr={'YYYY-MM-DD'}
                            />
                            <b className="red">{errInfo}</b>
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

NoCheckDateSelect.propTypes = {
    needCheckDates: PropTypes.array.isRequired,
    noNeedCheckDates: PropTypes.array.isRequired,
    closeModal: PropTypes.func,//关闭窗口
    enterFunction: PropTypes.func,//保存回调
};
export default NoCheckDateSelect;