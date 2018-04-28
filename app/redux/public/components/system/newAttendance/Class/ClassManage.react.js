/**
 * Created by wuzhenquan on 2017/11/27.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as classManageActions from '../../../../actions/newSystemAttendance/classManageActions';
import ClassList from './ClassList.react';
import AddOrEditClass from './AddOrEditClass.react';

class ClassManage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            classListVisible: true,
            newClassVisible: false,
            editClassVisible: false,
            classRuleInfo: {}
        };
    }

    editClassRule(classRuleInfo) {
        this.setState({ classRuleInfo: classRuleInfo, classListVisible: false, editClassVisible: true });
    }

    render() {
        const { actions, classManage: { classRules, classRulesLoading } } = this.props;
        if (this.state.classListVisible) {
            return (
                <div className="background-new">
                    <div className="back-new-main">
                        <div className="clock-new-list">
                            <div className="clock-list-hd clearfix">
                                <h4>班次规则列表</h4>
                                <a
                                    href="javascript:void(0)"
                                    className="btn btn-primary fr"
                                    onClick={() => { this.setState({ classListVisible: false, newClassVisible: true }); }}
                                >+新建班次规则</a>
                            </div>
                            <ClassList
                                actions={actions}
                                classRules={classRules}
                                editClassRule={(classRuleInfo) => { this.editClassRule(classRuleInfo); }}
                                listLoading={classRulesLoading}
                            />
                        </div>
                    </div>
                </div>
            );
        }
        // 新建班次
        if (this.state.newClassVisible) {
            return (
                <AddOrEditClass
                    actions={actions}
                    addOrEdit={'add'}
                    backToList={() => { this.setState({ classListVisible: true, newClassVisible: false }); }}
                />
            );
        }
        // 编辑班次
        if (this.state.editClassVisible) {
            return (
                <AddOrEditClass
                    actions={actions}
                    addOrEdit={'edit'}
                    backToList={() => { this.setState({ classListVisible: true, editClassVisible: false }); }}
                    classRuleInfo={this.state.classRuleInfo}
                />
            );
        }
    }
}

ClassManage.propTypes = {
    actions: PropTypes.object.isRequired,
    classManage: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
    classManage: state.classManage,
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(classManageActions, dispatch),
    dispatch: dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(ClassManage);