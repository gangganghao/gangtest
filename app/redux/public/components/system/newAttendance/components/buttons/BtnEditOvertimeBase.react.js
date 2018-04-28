/**
 * Created by wuzhenquan on 2017/12/5.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as overtimeRuleActions from '../../../../../actions/newSystemAttendance/overtimeRuleActions';
import EditOvertimeBase from '../modals/EditOvertimeBase.react';

class BtnEditOvertimeBase extends Component {
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
        const { actions, callbackFunc, overtimeRule: { overtimeBase } } = this.props;
        return (
            <span>
                <span onClick={() => { this.updateModalOpenState(true); }}>
                    {this.props.children}
                </span>
                {this.state.modalOpenState
                    ?
                    <EditOvertimeBase
                        actions={actions}
                        closeModal={() => { this.updateModalOpenState(false); }}
                        callbackFunc={callbackFunc}
                        overtimeBase={overtimeBase}
                    />
                    : null
                }
            </span>
        );
    }
}

BtnEditOvertimeBase.propTypes = {
    actions: PropTypes.object.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]),
    callbackFunc: PropTypes.func.isRequired,
};


const mapStateToProps = (state) => ({
    overtimeRule: state.overtimeRule,
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(overtimeRuleActions, dispatch),
    dispatch: dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(BtnEditOvertimeBase);