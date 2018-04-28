import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from "prop-types";
import apiHelper from '../../../../api/apiHelper.js';

class OverTimeRuleSelect extends Component {
    constructor(props) {
        super(props);
        this.state = {
            keyWord: '',
            selectedId: props.selectedId || 0,
            overTimeRuleArray: window.global.OvertimeRuleProcessor.getOvertimeRules().overtimeRules,
        }
    }
    submit(e) {
        let {selectedId} = this.state;
        if(!selectedId){
            apiHelper.error('请选择加班规则',1500);
            return;
        }
        let {enterFunction} = this.props;
        enterFunction(selectedId);
    }
    onSearchInputChange(e) {
        var value = e.target.value;
        let overTimeRuleArray = window.global.OvertimeRuleProcessor.getOvertimeRules().overtimeRules;
        if (!value) {
            this.setState({ keyWord: '', overTimeRuleArray });
        } else {
            let newOverTimeRuleArray = _.filter(overTimeRuleArray, (c) => _.includes(c.overtime_rule_title, value));
            this.setState({ keyWord: value, overTimeRuleArray: newOverTimeRuleArray });
        }
    }
    getRuleApproveTypeDesc(ruleApproveType){
        let retStr = '';
        switch(ruleApproveType){
            case 1:
            retStr = '需审批，以审批单位为准';
            break;
            case 2:
            retStr = '需审批，以打卡为准，但不能超过审批时长';
            break;
            case 3:
            retStr = '无需审批，根据打卡时间计算加班时长';
            break;
        }
        return retStr;
    }
    render() {
        let { closeModal } = this.props;
        let { overTimeRuleArray, selectedId } = this.state;
        return (
            <div className="modal-content">
                <div className="modal-header">
                    <a onClick={closeModal} href="javascript:;" draggable="false" className="close"><i className="iconfont icon-delname"></i></a>
                    <h4 className="modal-title">添加加班规则</h4>
                </div>
                <div className="modal-body">
                    <div className="tool-box clearfix">
                        <div className="search-box">
                            <span className="inputbox">
                                <input onChange={this.onSearchInputChange.bind(this)} className="form-control" type="text" placeholder="搜索规则名称" />
                                <i className="iconfont icon-search"></i>
                            </span>
                        </div>
                    </div>
                    <div className="table-box clearfix">
                        <div className="table-cont">
                            <table>
                                <colgroup>
                                    <col width="2%" />
                                    <col width="18%" />
                                    <col width="50%" />
                                    <col width="30%" />
                                </colgroup>
                                <tbody>
                                    <tr>
                                        <th>&nbsp;</th>
                                        <th>
                                            <span>规则名称</span>
                                        </th>
                                        <th>
                                            <span>规则内容</span>
                                        </th>
                                        <th>
                                            <span>应用范围</span>
                                        </th>
                                    </tr>
                                    {
                                        !_.isEmpty(overTimeRuleArray) ?
                                            overTimeRuleArray.map((item, index) => {
                                                return (
                                                    <tr onClick={() => { item.id !== selectedId && this.setState({ selectedId: item.id }); }} key={index}>
                                                        <td>
                                                            <input checked={item.id === selectedId} type="radio" name="overTimeRule" />
                                                        </td>
                                                        <td>
                                                            <span>{item.overtime_rule_title}</span>
                                                        </td>
                                                        <td>
                                                            {item.can_workday_overtime ? <p>工作日：{this.getRuleApproveTypeDesc(item.approve_type)}</p> : null}
                                                            {item.can_holiday_overtime ? <p>休息日和节假日：{this.getRuleApproveTypeDesc(item.holiday_approve_type)}</p> : null}
                                                        </td>
                                                        <td>
                                                            <span>{item.apply_rule_ids && item.apply_rule_ids.join(',')||'未使用'}</span>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                            :
                                            null
                                    }

                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={this.submit.bind(this)} type="submit" className="btn btn-primary" value="submit">确定</button>
                    <button onClick={closeModal} type="button" className="btn btn-default">取消</button>
                </div>
            </div>
        );
    }
}

OverTimeRuleSelect.propTypes = {
    closeModal: PropTypes.func,//关闭窗口
    enterFunction: PropTypes.func,//保存回调
    selectedId: PropTypes.number,//保存回调
};
export default OverTimeRuleSelect;