import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ClassSectionsSetting from './components/ClassSectionsSetting.react';
import ClassDelaySetting from './components/ClassDelaySetting.react';
import Confirm from '../../../common/Confirm.react';
import apiHelper from '../../../../api/apiHelper';
import * as  systemAttHelper from '../common/systemAttHelper';

class AddOrEditClass extends Component {
    constructor(props) {
        super(props);
        this.initialClassRule = {
            title: '',
            day_count: 1,
            check_minute_setting: 0,
            section: [
                { start_time: "09:00", start_time_across: 0, end_time: "18:00", is_rest: 0, end_time_across: 0 },
                { start_time: "12:00", start_time_across: 0, end_time: "13:00", is_rest: 1, end_time_across: 0 }
            ],
            late_allow_count: -1,
            late_allow_minute: -1,
            late_serious_minute: -1,
            late_absent_minute: -1,
            elastic: []
        };

        const { addOrEdit, classRuleInfo } = props;
        let classRule = this.initialClassRule;
        if (addOrEdit === 'edit' && !_.isEmpty(classRuleInfo)) {
            classRule = classRuleInfo;
        }
        this.state = {
            classRule: classRule,
            btnSubmitDisabled: false,
            editConfirmVisible: false,
        };
    }

    setClassRule(parameterObj, callback) {
        const { addOrEdit } = this.props;
        let classRule = this.state.classRule;
        classRule = Object.assign({}, classRule, parameterObj);
        let { section } = classRule;
        if (!_.isEmpty(section) && addOrEdit === 'add') {
            if (parameterObj.day_count === 1) {
                section = [
                    { start_time: "09:00", start_time_across: 0, end_time: "18:00", end_time_across: 0, is_rest: 0, ahead_minute: 0, delay_minute: 0 },
                    { start_time: "12:00", start_time_across: 0, end_time: "13:00", end_time_across: 0, is_rest: 1 }
                ];
            } else if (parameterObj.day_count === 2) {
                section = [
                    { start_time: "09:00", start_time_across: 0, end_time: "12:00", end_time_across: 0, is_rest: 0, ahead_minute: 0, delay_minute: 0 },
                    { start_time: "14:00", start_time_across: 0, end_time: "18:00", end_time_across: 0, is_rest: 0, ahead_minute: 0, delay_minute: 0 },
                ];
            } else if (parameterObj.day_count === 3) {
                section = [
                    { start_time: "09:00", start_time_across: 0, end_time: "11:00", end_time_across: 0, is_rest: 0, ahead_minute: 0, delay_minute: 0 },
                    { start_time: "12:00", start_time_across: 0, end_time: "15:00", end_time_across: 0, is_rest: 0, ahead_minute: 0, delay_minute: 0 },
                    { start_time: "16:00", start_time_across: 0, end_time: "18:00", end_time_across: 0, is_rest: 0, ahead_minute: 0, delay_minute: 0 },
                ];
            }
            classRule = Object.assign({}, classRule, { section });
        }
        this.setState({ classRule }, () => {
            if (typeof callback === 'function') callback();
        });
    }

    submit() {
        const { actions, addOrEdit, backToList } = this.props;
        const callback = (err) => {
            if (!err) { backToList(); actions.getClassRules(); }
        };
        // if (this.checkIsExceed(this.state.classRule.section)) {
        //     return apiHelper.error('第一次和最后一次打卡时间差不能超过24小时');
        // }
        if (addOrEdit === 'add') {
            actions.addClassRule(this.state.classRule, (err) => {
                callback(err);
            });
        } else if (addOrEdit === 'edit') {
            actions.editClassRule(this.state.classRule.id, this.state.classRule, (err) => {
                callback(err);
            });
        }
    }

    checkIsExceed(section) {
        let isExceed = false;
        if (
            section[this.state.classRule.day_count - 1].end_time_across === 1 &&
            systemAttHelper.transformTimeToMoment(section[this.state.classRule.day_count - 1].end_time).valueOf() > systemAttHelper.transformTimeToMoment(section[0].start_time).valueOf()
        ) {
            isExceed = true;
        }
        return isExceed;
    }

    effectNowRender() {
        return (
            <Confirm
                modalIsOpen={true}
                caption={'编辑班次规则'}
                message={'是否立即生效？'}
                enterText={'次日生效'}
                enterFunc={() => { this.setClassRule({ is_effect_now: 0 }, () => { this.submit(); }); }}
                enterText2={'立即生效'}
                enterFunc2={() => { this.setClassRule({ is_effect_now: 1 }, () => { this.submit(); }); }}
                cancelFunc={() => { this.setState({ editConfirmVisible: false }); }}
                closeModal={() => { this.setState({ editConfirmVisible: false }); }}
            />
        );
    }

    render() {
        const { addOrEdit, backToList } = this.props;
        const { title, day_count, check_minute_setting, late_allow_count, late_allow_minute, late_serious_minute,
            late_absent_minute, elastic } = this.state.classRule;

        return (
            <div className="background-new">
                <div className="back-new-hd"><h3>{addOrEdit === 'add' ? '新建' : '编辑'}班次规则</h3></div>
                <div className="back-new-main">
                    <div className="back-clock-new">
                        <div className="clock-form-menu">
                            <h4>1、班次名称</h4>
                            <input
                                type="text"
                                className="form-control name-long"
                                defaultValue={title}
                                onChange={(e) => { this.setClassRule({ title: e.target.value }); }}
                            />
                        </div>
                        <div className="clock-form-menu">
                            <h4>2、一天内上下班次数</h4>
                            <div className="clock-form-degree clearfix">
                                <label><input type="radio" name="dayCount" defaultChecked={day_count === 1} onChange={() => { this.setClassRule({ day_count: 1 }); }} />一次</label>
                                <label><input type="radio" name="dayCount" defaultChecked={day_count === 2} onChange={() => { this.setClassRule({ day_count: 2 }); }} />二次</label>
                                <label><input type="radio" name="dayCount" defaultChecked={day_count === 3} onChange={() => { this.setClassRule({ day_count: 3 }); }} />三次</label>
                                <label><input type="checkbox" defaultChecked={check_minute_setting === 3} onChange={() => { this.setClassRule({ check_minute_setting: check_minute_setting ? 0 : 1 }); }} />打卡时段设置</label>
                            </div>
                            <ClassSectionsSetting
                                classRule={this.state.classRule}
                                setClassRule={(obj) => { this.setClassRule(obj); }}
                            />
                        </div>
                        <div className="clock-form-menu">
                            <h4>3、人性化班次</h4>
                            <div className="clock-rule-one">
                                <input
                                    type="checkbox"
                                    defaultChecked={late_allow_count !== -1 && late_allow_minute !== -1}
                                    onChange={() => {
                                        late_allow_count === -1 || late_allow_minute === -1
                                            ?
                                            this.setClassRule({ late_allow_count: 5, late_allow_minute: 10 })
                                            :
                                            this.setClassRule({ late_allow_count: -1, late_allow_minute: -1 });
                                    }}
                                />
                                每月允许迟到
                                <input
                                    type="text"
                                    className="form-control"
                                    defaultValue={late_allow_count === -1 ? 5 : late_allow_count}
                                    onChange={(e) => { Number(e.target.value) && this.setClassRule({ late_allow_count: Number(e.target.value) }); }}
                                />次，
                                每次允许迟到
                                <input
                                    type="text"
                                    className="form-control"
                                    defaultValue={late_allow_minute === -1 ? 10 : late_allow_minute}
                                    onChange={(e) => { Number(e.target.value) && this.setClassRule({ late_allow_minute: Number(e.target.value) }); }}
                                />分钟
                            </div>
                            <div className="clock-rule-one">
                                <input
                                    type="checkbox"
                                    defaultChecked={late_serious_minute !== -1}
                                    onChange={() => {
                                        late_serious_minute === -1
                                            ?
                                            this.setClassRule({ late_serious_minute: 30 })
                                            :
                                            this.setClassRule({ late_serious_minute: -1 });
                                    }}
                                />
                                迟到
                                <input
                                    type="text"
                                    className="form-control"
                                    defaultValue={late_serious_minute === -1 ? 30 : late_serious_minute}
                                    onChange={(e) => { Number(e.target.value) && this.setClassRule({ late_serious_minute: Number(e.target.value) }); }}
                                />分钟以上算严重迟到
                            </div>
                            <div className="clock-rule-one">
                                <input
                                    type="checkbox"
                                    defaultChecked={late_absent_minute !== -1}
                                    onChange={() => {
                                        late_absent_minute === -1
                                            ?
                                            this.setClassRule({ late_absent_minute: 60 })
                                            :
                                            this.setClassRule({ late_absent_minute: -1 });
                                    }}
                                />
                                迟到
                                <input
                                    type="text"
                                    className="form-control"
                                    defaultValue={late_absent_minute === -1 ? 60 : late_absent_minute}
                                    onChange={(e) => { Number(e.target.value) && this.setClassRule({ late_absent_minute: Number(e.target.value) }); }}
                                />分钟以上算旷工
                            </div>
                            <ClassDelaySetting
                                classRule={this.state.classRule}
                                setClassRule={(obj) => { this.setClassRule(obj); }}
                            />
                        </div>
                    </div>
                </div>
                <div className="back-new-foot clearfix">
                    <div className="fr">
                        <a
                            href="javascript:void(0)"
                            className="btn btn-primary"
                            disabled={this.state.btnSubmitDisabled}
                            onClick={() => { addOrEdit === 'add' ? this.submit() : this.setState({ editConfirmVisible: true }); }}
                        >保存</a>
                        <a href="javascript:void(0)" className="btn btn-default" onClick={() => { backToList(); }}>取消</a>
                    </div>
                </div>
                {addOrEdit === 'edit' && this.state.editConfirmVisible
                    ?
                    this.effectNowRender()
                    : null
                }
            </div>
        );
    }
}

AddOrEditClass.propTypes = {
    actions: PropTypes.object.isRequired,
    addOrEdit: PropTypes.string,
    backToList: PropTypes.func.isRequired,
    classRuleInfo: PropTypes.object,
};

export default AddOrEditClass;