/**
 * Created by wuzhenquan on 2017/11/27.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createForm } from 'rc-form';
import Modal from 'react-modal';
import { customStyles } from '../../../../../constants/Constant';
import BtnMultipleSelect from '../../../../common/BtnMultipleSelect.react';

class AddOrEditOvertimeRule extends Component {
    constructor(props) {
        super(props);
        this.initialOvertimeRule = {
            overtime_rule_title: '',
            apply_rule_ids: [],
            can_workday_overtime: 1,
            approve_type: 1,
            overtime_begin_minute: 10,
            overtime_min_minute: 10,
            workday_overtime_to_adjust: 0,
            can_holiday_overtime: 1,
            holiday_approve_type: 1,
            holiday_overtime_min_minute: 30,
            holiday_overtime_to_adjust: 0
        };

        const { addOrEdit, overtimeRuleInfo } = props;
        let overtimeRule = this.initialOvertimeRule;

        if (addOrEdit === 'edit' && !_.isEmpty(overtimeRuleInfo)) {
            overtimeRule = overtimeRuleInfo;
        }
        this.state = {
            overtimeRule: overtimeRule,
            btnSubmitDisabled: false
        };
    }

    componentDidMount() {
        const { actions } = this.props;
        actions.getAttendanceRules();
    }

    setOvertimeRule(parameterObj) {
        let overtimeRule = this.state.overtimeRule;
        overtimeRule = Object.assign({}, overtimeRule, parameterObj);
        this.setState({ overtimeRule });
    }

    submit() {
        const { actions, addOrEdit, closeModal, callbackFunc } = this.props;
        this.setState({ btnSubmitDisabled: true });
        const callback = (err) => {
            this.setState({ btnSubmitDisabled: false });
            if (!err) {
                callbackFunc && callbackFunc();
                closeModal();
            }
        };
        if (addOrEdit === 'add') {
            actions.addOvertimeRule(this.state.overtimeRule, callback);
        } else if (addOrEdit === 'edit') {
            actions.editOvertimeRule(this.state.overtimeRule.id, this.state.overtimeRule, callback);
        }
    }

    render() {
        const { addOrEdit, closeModal, attendanceRules } = this.props;
        const { overtime_rule_title, apply_rule_ids, can_workday_overtime, approve_type,
            overtime_begin_minute, overtime_min_minute, workday_overtime_to_adjust, can_holiday_overtime,
            holiday_approve_type, holiday_overtime_min_minute, holiday_overtime_to_adjust } = this.state.overtimeRule;
        return (
            <Modal
                isOpen={true}
                style={customStyles}
            >
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <a
                                href="javascript:void(0)"
                                onClick={closeModal}
                                className="close"
                            >
                                <i className="iconfont icon-delname"></i>
                            </a>
                            <h4 className="modal-title">{addOrEdit === 'add' ? '新建' : '编辑'}加班规则</h4>
                        </div>
                        <div className="modal-body new-form">
                            <ul className="form-list">
                                <li>
                                    <em>加班规则名称</em>
                                    <div className="r">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={overtime_rule_title}
                                            placeholder="请输入"
                                            onChange={(e) => { this.setOvertimeRule({ overtime_rule_title: e.target.value }); }}
                                        />
                                    </div>
                                </li>
                                <li>
                                    <em>应用范围</em>
                                    <div className="r">
                                        <BtnMultipleSelect
                                            selectedArr={attendanceRules.filter(item => apply_rule_ids.includes(item.id))}
                                            listArr={attendanceRules}
                                            updateFunc={(obj) => { this.setOvertimeRule({ apply_rule_ids: obj.selectedArr.map(item => item.id) }); }}
                                        />
                                    </div>
                                </li>
                                <li>
                                    <em>工作日加班</em>
                                    <div className="r">
                                        <div className="clock-add-workday">
                                            <span>允许工作日加班</span>
                                            <div className="checkbox-item sm-checkbox">
                                                <input
                                                    id="can_workday_overtime"
                                                    type="checkbox"
                                                    defaultChecked={can_workday_overtime}
                                                    onChange={() => { this.setOvertimeRule({ can_workday_overtime: can_workday_overtime ? 0 : 1 }); }}
                                                />
                                                <label htmlFor="can_workday_overtime"></label>
                                            </div>
                                            {can_workday_overtime
                                                ?
                                                <div className="clock-work-day">
                                                    <label><input type="radio" name="approve_type" defaultChecked={approve_type === 1} onChange={() => { this.setOvertimeRule({ approve_type: 1 }); }} />需审批，以审批单位为准</label>
                                                    <label><input type="radio" name="approve_type" defaultChecked={approve_type === 2} onChange={() => { this.setOvertimeRule({ approve_type: 2 }); }} />需审批，以打卡为准，但不能超过审批时长</label>
                                                    <label><input type="radio" name="approve_type" defaultChecked={approve_type === 3} onChange={() => { this.setOvertimeRule({ approve_type: 3 }); }} />无需审批，根据打卡时间计算加班时长</label>
                                                    <div className="clock-rule-one">
                                                        <p>
                                                            <em>加班起算时间： </em>
                                                            最后一次下班后
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={overtime_begin_minute}
                                                                onChange={(e) => { this.setOvertimeRule({ overtime_begin_minute: e.target.value }); }}
                                                            />
                                                            分钟，开始计算加班
                                                        </p>
                                                        <p>
                                                            <em>最小加班时长：</em>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={overtime_min_minute}
                                                                onChange={(e) => { this.setOvertimeRule({ overtime_min_minute: e.target.value }); }}
                                                            />
                                                            分钟，小于该时长则加班时长记为0
                                                        </p>
                                                        <p>
                                                            <em>加班调休：</em>
                                                            <label>
                                                                <input
                                                                    type="checkbox"
                                                                    defaultChecked={workday_overtime_to_adjust}
                                                                    onChange={() => { this.setOvertimeRule({ workday_overtime_to_adjust: workday_overtime_to_adjust ? 0 : 1 }); }}
                                                                />转为调休余额
                                                            </label>
                                                        </p>
                                                    </div>
                                                </div>
                                                : null}
                                        </div>
                                    </div>
                                </li>
                                <li>
                                    <em>休息日和节假日加班</em>
                                    <div className="r">
                                        <div className="clock-add-workday">
                                            <span>允许假期加班</span>
                                            <div className="checkbox-item sm-checkbox">
                                                <input
                                                    id="can_holiday_overtime"
                                                    type="checkbox"
                                                    defaultChecked={can_holiday_overtime}
                                                    onChange={() => { this.setOvertimeRule({ can_holiday_overtime: can_holiday_overtime ? 0 : 1 }); }}
                                                />
                                                <label htmlFor="can_holiday_overtime"></label>
                                            </div>
                                            {can_holiday_overtime
                                                ?
                                                <div className="clock-work-day">
                                                    <label><input type="radio" name="holiday_approve_type" defaultChecked={holiday_approve_type === 1} onChange={() => { this.setOvertimeRule({ holiday_approve_type: 1 }); }} />需审批，以审批单位为准</label>
                                                    <label><input type="radio" name="holiday_approve_type" defaultChecked={holiday_approve_type === 2} onChange={() => { this.setOvertimeRule({ holiday_approve_type: 2 }); }} />需审批，以打卡为准，但不能超过审批时长</label>
                                                    <label><input type="radio" name="holiday_approve_type" defaultChecked={holiday_approve_type === 3} onChange={() => { this.setOvertimeRule({ holiday_approve_type: 3 }); }} />无需审批，根据打卡时间计算加班时长</label>
                                                    <div className="clock-rule-one">
                                                        <p>
                                                            <em>最小加班时长：</em>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={holiday_overtime_min_minute}
                                                                onChange={(e) => { this.setOvertimeRule({ holiday_overtime_min_minute: e.target.value }); }}
                                                            />
                                                            分钟，小于该时长则加班时长记为0
                                                    </p>
                                                        <p>
                                                            <em>加班调休：</em>
                                                            <label>
                                                                <input
                                                                    type="checkbox"
                                                                    defaultChecked={holiday_overtime_to_adjust}
                                                                    onChange={() => { this.setOvertimeRule({ holiday_overtime_to_adjust: workday_overtime_to_adjust ? 0 : 1 }); }}
                                                                />转为调休余额
                                                        </label>
                                                        </p>
                                                    </div>
                                                </div>
                                                : null
                                            }
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={this.state.btnSubmitDisabled}
                                onClick={() => { this.submit(); }}
                            >确定</button>
                            <button type="button" className="btn btn-default"
                                onClick={() => { closeModal(); }}
                            >
                                取消
                        </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

AddOrEditOvertimeRule.propTypes = {
    actions: PropTypes.object.isRequired,
    form: PropTypes.object.isRequired,
    addOrEdit: PropTypes.string.isRequired,
    closeModal: PropTypes.func.isRequired,
    callbackFunc: PropTypes.func,
    overtimeRuleInfo: PropTypes.object,
    attendanceRules: PropTypes.array.isRequired,
};

export default createForm()(AddOrEditOvertimeRule);