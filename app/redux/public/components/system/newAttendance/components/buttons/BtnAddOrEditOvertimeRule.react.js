import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as overtimeRuleActions from '../../../../../actions/newSystemAttendance/overtimeRuleActions';
import AddOrEditOvertimeRule from '../modals/AddOrEditOvertimeRule.react';

class BtnAddOrEditOvertimeRule extends Component {
    constructor(props) {
        super(props);
        this.state = {
            modalOpenState: false
        };
    }

    updateModalOpenState(openState) {
        this.setState({ modalOpenState: openState });
    }
    render() {
        const { actions, addOrEdit, callbackFunc, overtimeRuleInfo, overtimeRule } = this.props;
        return (
            <span>
                <span onClick={() => { this.updateModalOpenState(true); }}>
                    {this.props.children}
                </span>
                {this.state.modalOpenState
                    ?
                    <AddOrEditOvertimeRule
                        actions={actions}
                        addOrEdit={addOrEdit}
                        closeModal={() => { this.updateModalOpenState(false); }}
                        callbackFunc={callbackFunc}
                        overtimeRuleInfo={overtimeRuleInfo}
                        attendanceRules={overtimeRule.attendanceRules}
                    />
                    : null
                }
            </span>
        );
    }
}

BtnAddOrEditOvertimeRule.propTypes = {
    actions: PropTypes.object.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]),
    addOrEdit: PropTypes.string.isRequired,
    callbackFunc: PropTypes.func.isRequired,
    overtimeRuleInfo: PropTypes.object,
    overtimeRule: PropTypes.object.isRequired,
};


const mapStateToProps = (state) => ({
    overtimeRule: state.overtimeRule,
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(overtimeRuleActions, dispatch),
    dispatch: dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(BtnAddOrEditOvertimeRule);