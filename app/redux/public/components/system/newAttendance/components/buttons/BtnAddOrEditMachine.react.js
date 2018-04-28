/**
 * Created by wuzhenquan on 2017/12/5.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as machineSettingActions from '../../../../../actions/newSystemAttendance/machineSettingActions';
import AddOrEditMachine from '../modals/AddOrEditMachine.react';

class BtnAddOrEditMachine extends Component {
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
        const { actions, addOrEdit, callbackFunc, machineInfo } = this.props;
        return (
            <span>
                <span onClick={() => { this.updateModalOpenState(true); }}>
                    {this.props.children}
                </span>
                {this.state.modalOpenState
                    ?
                    <AddOrEditMachine
                        actions={actions}
                        addOrEdit={addOrEdit}
                        closeModal={() => { this.updateModalOpenState(false); }}
                        callbackFunc={callbackFunc}
                        machineInfo={machineInfo}
                    />
                    : null
                }
            </span>
        );
    }
}

BtnAddOrEditMachine.propTypes = {
    actions: PropTypes.object.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]),
    addOrEdit: PropTypes.string.isRequired,
    callbackFunc: PropTypes.func.isRequired,
    machineInfo: PropTypes.object,
};


const mapStateToProps = (state) => ({
    machineSetting: state.machineSetting,
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(machineSettingActions, dispatch),
    dispatch: dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(BtnAddOrEditMachine);