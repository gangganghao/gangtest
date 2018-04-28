/**
 * Created by wuzhenquan on 2017/11/27.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as overtimeRuleActions from '../../../../actions/newSystemAttendance/overtimeRuleActions';
import Switch from '../../../common/Switch.react';
import BtnAddOrEditOvertimeRule from '../components/buttons/BtnAddOrEditOvertimeRule.react';
import BtnEditOvertimeBase from '../components/buttons/BtnEditOvertimeBase.react';
import Confirm from '../../../common/Confirm.react';
import Loading from '../../../common/Loading.react';

class OvertimeRule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modalIsOpen: false,
            confirmDeleteVisible: false,
            ruleDeleteId: 0,
        };
    }

    componentDidMount() {
        const { actions } = this.props;
        actions.getOvertimeRules();
        actions.getOvertimeBase();
    }

    componentWillUnmount() {
        const { actions } = this.props;
        actions.updateOvertimeRuleLoadingState(true);
    }

    setCanOvertime(canOvertime) {
        const { actions } = this.props;
        if (canOvertime === 1) {
            actions.setOvertimeBase({ can_overtime: 0 }, (err) => {
                if (!err) actions.getOvertimeBase();
            });
        } else if (canOvertime === 0) {
            actions.setOvertimeBase({ can_overtime: 1 }, (err) => {
                if (!err) actions.getOvertimeBase();
            });
        }
    }

    deleteOvertimeRule(id) {
        const { actions } = this.props;
        actions.deleteOvertimeRule(id, () => {
            this.setState({ confirmDeleteVisible: false, ruleDeleteId: 0 });
            actions.getOvertimeRules();
        });
    }

    render() {
        const { actions, overtimeRule: { overtimeRules, overtimeRulesLoading, overtimeBase, attendanceRules } } = this.props;
        return (
            <div className="background-new">
                <div className="back-new-hd">
                    <h3>是否需要开启加班制度</h3>
                    <Switch
                        id={'overtime'}
                        className={'checkbox-item'}
                        checked={!!overtimeBase.can_overtime}
                        onChangeFunc={() => { this.setCanOvertime(overtimeBase.can_overtime); }}
                        message={`确认${overtimeBase.can_overtime ? '停用' : '启用'}加班制度吗？`}
                    />
                </div>
                <div className="back-new-main">
                    <div className="clock-new-list">
                        <div className="clock-list-hd clearfix">
                            <h4>加班规则列表</h4>
                            <BtnAddOrEditOvertimeRule
                                callbackFunc={() => { actions.updateOvertimeRuleLoadingState(true); actions.getOvertimeRules(); }}
                                addOrEdit={'add'}
                            >
                                <a href="javascript:void(0)" className="btn btn-primary fr">+新建加班规则</a>
                            </BtnAddOrEditOvertimeRule>
                        </div>
                        {overtimeRulesLoading
                            ?
                            <div className="loading-cover">
                                <i className="iconfont icon-solid-loading"></i>
                            </div>
                            :
                            null
                        }
                        <div className="clock-list-table">
                            <table>
                                <tbody>
                                    <tr>
                                        <th>加班规则名称</th>
                                        <th>规则内容</th>
                                        <th>应用范围</th>
                                        <th>操作</th>
                                    </tr>
                                    {!_.isEmpty(overtimeRules)
                                        ?
                                        overtimeRules.map((item, index) => {
                                            return (
                                                <tr key={item.id}>
                                                    <td><span>{item.overtime_rule_title}</span></td>
                                                    <td>
                                                        {item.can_workday_overtime
                                                            ?
                                                            <p>工作日：
                                                            {item.approve_type === 1 ? '加班必须审批，加班时长以审批单为准' : null}
                                                                {item.approve_type === 2 ? '加班必须审批，加班时长以打卡为准，但不能超过审批时长' : null}
                                                                {item.approve_type === 3 ? '加班无需审批，根据打卡时间计算加班时长' : null}
                                                            </p>
                                                            : null
                                                        }
                                                        {item.can_holiday_overtime
                                                            ?
                                                            <p>休息日和节假日：
                                                            {item.holiday_approve_type === 1 ? '加班必须审批，加班时长以审批单为准' : null}
                                                                {item.holiday_approve_type === 2 ? '加班必须审批，加班时长以打卡为准，但不能超过审批时长' : null}
                                                                {item.holiday_approve_type === 3 ? '加班无需审批，根据打卡时间计算加班时长' : null}
                                                            </p>
                                                            : null
                                                        }
                                                    </td>
                                                    <td>
                                                        {!_.isEmpty(item.apply_rule_ids)
                                                            ?
                                                            item.apply_rule_ids.map(id => {
                                                                const rule = attendanceRules.find(rule => rule.id == id);
                                                                return (rule ? <span key={id}>{rule.title}</span> : null);
                                                            })
                                                            : <span className="red">未使用</span>
                                                        }
                                                    </td>
                                                    <td>
                                                        <BtnAddOrEditOvertimeRule
                                                            callbackFunc={() => { actions.updateOvertimeRuleLoadingState(true); actions.getOvertimeRules(); }}
                                                            addOrEdit={'edit'}
                                                            overtimeRuleInfo={item}
                                                        >
                                                            <a href="javascript:void(0)" className="edit">编辑</a>
                                                        </BtnAddOrEditOvertimeRule>
                                                        <a
                                                            href="javascript:void(0)"
                                                            className="omit"
                                                            onClick={() => { this.setState({ confirmDeleteVisible: true, ruleDeleteId: item.id }); }}
                                                        >删除</a>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                        : null
                                    }
                                </tbody>
                            </table>
                        </div>
                        <div className="clock-list-setup">
                            <h5>加班基础规则设置
                                <BtnEditOvertimeBase
                                    callbackFunc={() => { actions.getOvertimeBase(); }}
                                >
                                    <a href="javascript:void(0)">编辑</a>
                                </BtnEditOvertimeBase>
                            </h5>
                            <p>1、加班计算单位：
                                <em>
                                    {overtimeBase.overtime_unit === 1 ? '按分钟' : null}
                                    {overtimeBase.overtime_unit === 2 ? '按小时' : null}
                                    {overtimeBase.overtime_unit === 3 ? '按半天' : null}
                                    {overtimeBase.overtime_unit === 4 ? '按天' : null}
                                </em>
                            </p>
                            <p>2、日时长折算:<em>{overtimeBase.hour_to_day}小时=1天</em></p>
                        </div>
                    </div>
                </div>
                <Confirm
                    modalIsOpen={this.state.confirmDeleteVisible}
                    caption={'删除加班规则'}
                    message={'是否删除加班规则？'}
                    enterFunc={() => { actions.updateOvertimeRuleLoadingState(true); this.deleteOvertimeRule(this.state.ruleDeleteId); }}
                    cancelFunc={() => { this.setState({ confirmDeleteVisible: false }); }}
                    closeModal={() => { this.setState({ confirmDeleteVisible: false }); }}
                />
            </div>
        );
    }
}

OvertimeRule.propTypes = {
    actions: PropTypes.object.isRequired,
    overtimeRule: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
    overtimeRule: state.overtimeRule,
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(overtimeRuleActions, dispatch),
    dispatch: dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(OvertimeRule);