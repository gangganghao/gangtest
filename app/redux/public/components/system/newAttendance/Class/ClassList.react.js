/**
 * Created by wuzhenquan on 2017/11/29.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as systemAttHelper from '../common/systemAttHelper';
import Confirm from '../../../common/Confirm.react';
import Loading from '../../../common/Loading.react';

class ClassList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            confirmDeleteVisible: false,
            ruleDeleteId: 0
        };
    }

    componentDidMount() {
        const { actions } = this.props;
        actions.getClassRules();
    }

    componentWillUnmount() {
        const { actions } = this.props;
        actions.updateClassRuleLoadingState(true);
    }


    deleteClassRule(id) {
        const { actions } = this.props;
        actions.deleteClassRule(id, () => {
            this.setState({ confirmDeleteVisible: false, ruleDeleteId: 0 });
            actions.updateClassRuleLoadingState(true);
            actions.getClassRules();
        });
    }

    render() {
        const { classRules, editClassRule, listLoading } = this.props;
        if (listLoading) {
            return (
                <div className="crm-reason-main">
                    <Loading />
                </div>
            );
        }
        return (
            <div className="clock-list-table">
                <table>
                    <tbody>
                        <tr>
                            <th>班次名称</th>
                            <th>上下班次数</th>
                            <th>人性化班次</th>
                            <th>弹性班次</th>
                            <th>操作</th>
                        </tr>
                        {!_.isEmpty(classRules)
                            ?
                            classRules.map(rule => {
                                return (
                                    <tr key={rule.id}>
                                        <td><span>{rule.title}</span></td>
                                        <td>
                                            {!_.isEmpty(rule.section) && rule.section.reduce((tempArr, item) => {
                                                if (item.is_rest === 0) {
                                                    tempArr.push(
                                                        [
                                                            <p key={item.start_time}>签到时间{item.start_time}{item.ahead_minute ? `，${item.ahead_minute}分钟前开始打卡` : null}</p>,
                                                            <p key={item.end_time}>签退时间{item.end_time}{item.delay_minute ? `，${item.delay_minute}分钟后停止打卡` : null}</p>
                                                        ]
                                                    );
                                                }
                                                return tempArr;
                                            }, [])}
                                        </td>
                                        <td>
                                            {rule.late_allow_minute != -1 || rule.late_allow_count != -1 ? <p>允许迟到{rule.late_allow_minute}分钟，允许迟到{rule.late_allow_count}次</p> : null}
                                            {rule.late_serious_minute != -1 ? <p>严重迟到{rule.late_serious_minute}分钟</p> : null}
                                            {rule.late_absent_minute != -1 ? <p>旷工迟到{rule.late_absent_minute}分钟</p> : null}
                                        </td>
                                        <td>
                                            {!_.isEmpty(rule.elastic) && rule.elastic.map(item => {
                                                return (
                                                    <span key={item.id}>
                                                        第一天{systemAttHelper.getDelayTimeStr(rule.section[rule.section.length - 1].end_time, item.delay_off_duty_hour)}下班，
                                                        第二天上班{systemAttHelper.getDelayTimeStr(rule.section[0].start_time, item.delay_on_duty_hour)}不算迟到
                                                    </span>
                                                );
                                            })}
                                        </td>
                                        <td>
                                            <a
                                                href="javascript:void(0)"
                                                className="edit"
                                                onClick={() => { editClassRule(rule); }}
                                            >编辑</a>
                                            <a
                                                href="javascript:void(0)"
                                                className="omit"
                                                onClick={() => { this.setState({ confirmDeleteVisible: true, ruleDeleteId: rule.id }); }}
                                            >删除</a>
                                        </td>
                                    </tr>
                                );
                            })
                            : null
                        }
                    </tbody>
                </table>
                <Confirm
                    modalIsOpen={this.state.confirmDeleteVisible}
                    caption={'删除班次规则'}
                    message={'是否删除班次规则？'}
                    enterFunc={() => { this.deleteClassRule(this.state.ruleDeleteId); }}
                    cancelFunc={() => { this.setState({ confirmDeleteVisible: false }); }}
                    closeModal={() => { this.setState({ confirmDeleteVisible: false }); }}
                />
            </div>
        );
    }
}

ClassList.propTypes = {
    actions: PropTypes.object.isRequired,
    classRules: PropTypes.array.isRequired,
    editClassRule: PropTypes.func,
    listLoading: PropTypes.bool,
};

export default ClassList;