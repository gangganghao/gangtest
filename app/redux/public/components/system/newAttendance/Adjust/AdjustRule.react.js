import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { createForm } from 'rc-form';
import * as adjustRuleActions from '../../../../actions/newSystemAttendance/adjustRuleActions';
import Switch from '../../../common/Switch.react';
import SingleDateForm from '../../../common/validateComponents/SingleForm/SingleDateForm';
import apiHelper from '../../../../api/apiHelper';

class AdjustRule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            adjustRuleInfo: props.adjustRule.adjustRuleInfo,
            btnSubmitDisabled: false,
        };
    }

    componentDidMount() {
        const { actions } = this.props;
        actions.getAdjustRuleInfo();
    }

    componentWillReceiveProps(nextProps) {
        if (!_.isEqual(this.props.adjustRule.adjustRuleInfo, nextProps.adjustRule.adjustRuleInfo)) {
            this.setState({ adjustRuleInfo: nextProps.adjustRule.adjustRuleInfo });
        }
    }

    setAdjustRule(parameterObj) {
        let adjustRuleInfo = this.state.adjustRuleInfo;
        adjustRuleInfo = Object.assign({}, adjustRuleInfo, parameterObj);
        this.setState({ adjustRuleInfo });
    }

    setCanAdjust(canJustRest) {
        const { actions } = this.props;
        if (canJustRest === 1) {
            actions.setAdjustRuleInfo({ can_adjust_rest: 0 }, (err) => {
                if (!err) actions.getAdjustRuleInfo();
            });
        } else if (canJustRest === 0) {
            actions.setAdjustRuleInfo({ can_adjust_rest: 1 }, (err) => {
                if (!err) actions.getAdjustRuleInfo();
            });
        }
    }

    transformDateStrToMoment(dateStr) {
        let momentObj = moment();
        if (dateStr && typeof dateStr === 'string') {
            momentObj = moment().set({ month: dateStr.split('-')[0], date: dateStr.split('-')[1] });
        }
        return momentObj;
    }

    submit() {
        const { actions } = this.props;
        this.setState({ btnSubmitDisabled: true });
        actions.setAdjustRuleInfo(this.state.adjustRuleInfo, (err) => {
            if (!err) { apiHelper.info('设置成功'); }
            this.setState({ btnSubmitDisabled: false });
        });
    }

    render() {
        const { actions } = this.props;
        const { can_adjust_rest, valid_type, last_day_of_year, valid_day_count, min_adjust_unit, hour_to_day } = this.state.adjustRuleInfo;
        return (
            <div className="background-new">
                <div className="back-new-hd">
                    <h3>是否需要开启调休制度</h3>
                    <Switch
                        id={'overtime'}
                        className={'checkbox-item'}
                        checked={!!can_adjust_rest}
                        onChangeFunc={() => { this.setCanAdjust(can_adjust_rest); }}
                        message={`确认${can_adjust_rest ? '停用' : '启用'}调休制度吗？`}
                    />
                </div>
                <div className="back-new-main">
                    <div className="crm-reason-main">
                        <div className="back-reprule">
                            <h4>1、有效期设置<em>有效期间有效，其它时间作废</em></h4>
                            <div className="crm-white-cont">
                                <label><input type="radio" name="cancel" checked={valid_type === 1} onChange={() => { this.setAdjustRule({ valid_type: 1 }); }} />每年固定时间作废</label>
                                <label><input type="radio" name="cancel" checked={valid_type === 2} onChange={() => { this.setAdjustRule({ valid_type: 2 }); }} />加班多少天后作废</label>
                            </div>
                            <ul>
                                {valid_type === 1 ?
                                    <li>
                                        每年
                                        <div className="form-control">
                                            <SingleDateForm
                                                form={this.props.form}
                                                controlName={'last_day_of_year'}
                                                dateFormatStr={"MM-DD"}
                                                defalutDate={this.transformDateStrToMoment(last_day_of_year).valueOf()}
                                                onChangeBool={true}
                                                onChangeFunc={(controlName, value) => { this.setAdjustRule({ last_day_of_year: `${moment(value).month() + 1}-${moment(value).date()}` }); }}
                                            />
                                        </div>
                                        后作废
                                    </li>
                                    : null
                                }
                                {valid_type === 2 ?
                                    <li>
                                        加班
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={valid_day_count}
                                            onChange={(e) => { this.setAdjustRule({ valid_day_count: Number(e.target.value) }); }}
                                        />
                                        天后作废
                                    </li>
                                    : null
                                }
                            </ul>
                        </div>
                        <div className="back-reprule">
                            <h4>2、最小调休单位</h4>
                            <div className="crm-white-cont">
                                <label><input type="radio" name="time" checked={min_adjust_unit === 1} onChange={() => { this.setAdjustRule({ min_adjust_unit: 1 }); }} />按分钟</label>
                                <label><input type="radio" name="time" checked={min_adjust_unit === 2} onChange={() => { this.setAdjustRule({ min_adjust_unit: 2 }); }} />按小时</label>
                                <label><input type="radio" name="time" checked={min_adjust_unit === 3} onChange={() => { this.setAdjustRule({ min_adjust_unit: 3 }); }} />按半天</label>
                                <label><input type="radio" name="time" checked={min_adjust_unit === 4} onChange={() => { this.setAdjustRule({ min_adjust_unit: 4 }); }} />按天</label>
                            </div>
                        </div>
                        <div className="back-reprule">
                            <h4>3、日时长折算</h4>
                            <ul>
                                <li>
                                    <div className="crm-rule-one">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={hour_to_day}
                                            onChange={(e) => { this.setAdjustRule({ hour_to_day: Number(e.target.value) }); }}
                                        />
                                        小时&nbsp;=&nbsp;1天
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="back-reprule-btn">
                            <button
                                href="javascript:void(0)"
                                className="btn btn-primary"
                                disabled={this.state.btnSubmitDisabled}
                                onClick={() => { this.submit(); }}
                            >保存设置</button>
                        </div>
                    </div>

                </div>
            </div>
        );
    }
}

AdjustRule.propTypes = {
    actions: PropTypes.object.isRequired,
    adjustRule: PropTypes.object.isRequired,
    form: PropTypes.object,
};

const mapStateToProps = (state) => ({
    adjustRule: state.adjustRule,
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(adjustRuleActions, dispatch),
    dispatch: dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(createForm()(AdjustRule));