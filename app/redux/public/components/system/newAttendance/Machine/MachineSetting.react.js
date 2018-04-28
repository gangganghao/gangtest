import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import apiHelper from '../../../../api/apiHelper';
import * as machineSettingActions from '../../../../actions/newSystemAttendance/machineSettingActions';
import BtnAddOrEditMachine from '../components/buttons/BtnAddOrEditMachine.react';
import Confirm from '../../../common/Confirm.react';
import FingerprintList from './FingerprintList.react';

class MachineSetting extends Component {
    constructor(props) {
        super(props);
        this.state = {
            machineDeleteId: 0,
            confirmDeleteVisible: false,
            recordedUserListMachineId: 0,
            showRecordedUserList: false
        };
    }

    componentDidMount() {
        const { actions } = this.props;
        actions.getMachines();
    }

    deleteMachine(id) {
        const { actions } = this.props;
        actions.deleteMachine(id, (err) => {
            if (!err) {
                this.setState({ confirmDeleteVisible: false, machineDeletedId: 0 });
                actions.getMachines();
            }
        });
    }

    render() {
        const { actions, machineSetting: { machines, fingerprints } } = this.props;
        if (this.state.showRecordedUserList && this.state.recordedUserListMachineId) {
            return (
                <FingerprintList
                    actions={actions}
                    machineId={this.state.recordedUserListMachineId}
                    fingerprints={fingerprints}
                />
            );
        }
        return (
            <div className="background-new">
                <div className="back-new-main">
                    <div className="clock-new-list">
                        <div className="clock-list-hd clearfix">
                            <h4>考勤机</h4>
                            <div className="fr">
                                <a href="javascript:void(0)" onClick={() => { this.setState({ recordedUserListMachineId: 1, showRecordedUserList: true }); }}>已录指纹人员表</a>
                                <BtnAddOrEditMachine
                                    addOrEdit={'add'}
                                    callbackFunc={() => { actions.getMachines(); }}
                                >
                                    <a href="javascript:void(0)" className="btn btn-primary">+新增考勤机</a>
                                </BtnAddOrEditMachine>
                            </div>
                        </div>
                        <div className="clock-list-table">
                            <table>
                                <tbody>
                                    <tr>
                                        <th>设备名称</th>
                                        <th>设备类型</th>
                                        <th>管理员</th>
                                        <th>绑定时间</th>
                                        <th>链接状态</th>
                                        <th>操作</th>
                                    </tr>
                                    {machines.map(item => {
                                        return (
                                            <tr key={item.id}>
                                                <td><span>{item.title}</span></td>
                                                <td><span>{item.device_type}</span></td>
                                                <td>
                                                    <span>
                                                        {!_.isEmpty(item.manager_user)
                                                            ?
                                                            item.manager_user.map(userId => {
                                                                apiHelper.getUser(userId).name;
                                                            })
                                                            : null
                                                        }
                                                    </span>
                                                </td>
                                                <td><span>{moment(Number(item.create_time)).format('YYYY-MM-DD')}</span></td>
                                                <td><span>{item.status === 1 ? '在线' : '不在线'}</span></td>
                                                <td>
                                                    <BtnAddOrEditMachine
                                                        addOrEdit={'edit'}
                                                        callbackFunc={() => { actions.getMachines(); }}
                                                        machineInfo={item}
                                                    >
                                                        <a href="javascript:void(0)" className="edit">编辑</a>
                                                    </BtnAddOrEditMachine>
                                                    <a
                                                        href="javascript:void(0)"
                                                        className="omit"
                                                        onClick={() => { this.setState({ confirmDeleteVisible: true, machineDeleteId: item.id }); }}
                                                    >解绑</a>
                                                </td>
                                            </tr>
                                        );
                                    })
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <Confirm
                    modalIsOpen={this.state.confirmDeleteVisible}
                    caption={'删除加班规则'}
                    message={'是否删除加班规则？'}
                    enterFunc={() => { this.deleteMachine(this.state.machineDeleteId); }}
                    cancelFunc={() => { this.setState({ confirmDeleteVisible: false }); }}
                    closeModal={() => { this.setState({ confirmDeleteVisible: false }); }}
                />
            </div>
        );
    }
}

MachineSetting.propTypes = {
    actions: PropTypes.object.isRequired,
    machineSetting: PropTypes.object.isRequired,
};


const mapStateToProps = (state) => ({
    machineSetting: state.machineSetting,
});

const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(machineSettingActions, dispatch),
    dispatch: dispatch
});

export default connect(mapStateToProps, mapDispatchToProps)(MachineSetting);