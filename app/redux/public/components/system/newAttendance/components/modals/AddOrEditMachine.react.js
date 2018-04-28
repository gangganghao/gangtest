import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createForm } from 'rc-form';
import Modal from 'react-modal';
import { customStyles } from '../../../../../constants/Constant';
import SingleSelectMulitpleUserForm from '../../../../common/validateComponents/SingleForm/SingleSelectMulitpleUserForm';

class AddOrEditMachine extends Component {
    constructor(props) {
        super(props);
        this.initialMachineInfo = {
            title: '',
            device_type: '1',
            device_id: 0,
            manager_user: []
        };

        let { addOrEdit, machineInfo } = props;

        if (addOrEdit === 'add' || _.isEmpty(machineInfo)) {
            machineInfo = this.initialMachineInfo;
        }

        this.state = {
            machineInfo: machineInfo,
            btnSubmitDisabled: false
        };
    }

    setMachineInfo(parameterObj) {
        let machineInfo = this.state.machineInfo;
        machineInfo = Object.assign({}, machineInfo, parameterObj);
        this.setState({ machineInfo });
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
            actions.addMachine(this.state.machineInfo, callback);
        } else if (addOrEdit === 'edit') {
            actions.editMachine(this.state.machineInfo.id, this.state.machineInfo, callback);
        }
    }

    render() {
        const { addOrEdit, closeModal } = this.props;
        const { title, device_type, device_id, manager_user } = this.state.machineInfo;
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
                                    <em>设备名称</em>
                                    <div className="r">
                                        <input
                                            type="text"
                                            className="form-control"
                                            defaultValue={title}
                                            placeholder="请输入"
                                            onChange={(e) => { this.setMachineInfo({ title: e.target.value }); }}
                                        />
                                    </div>
                                </li>
                                <li>
                                    <em>设备类型</em>
                                    <div className="r">
                                        <select
                                            className="form-control"
                                            defaultValue={device_type}
                                            onChange={(e) => { this.setMachineInfo({ device_type: e.target.value }); }}
                                        >
                                            {
                                                [
                                                    { title: '类型1', value: '1' },
                                                    { title: '类型2', value: '2' },
                                                    { title: '类型3', value: '3' }
                                                ].map((item) => {
                                                    return (
                                                        <option key={item.value} value={item.value}>{item.title}</option>
                                                    );
                                                })}
                                        </select>
                                    </div>
                                </li>
                                <li>
                                    <em>设备序列号</em>
                                    <div className="r">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="请输入"
                                            defaultValue={device_id}
                                            onChange={(e) => { this.setMachineInfo({ device_id: e.target.value }); }}
                                        />
                                        <a href="https://www.shaozi.com" className="c-red"><i className="iconfont icon-pom"></i>查看获取方法</a>
                                    </div>
                                </li>
                                <li>
                                    <em>管理员</em>
                                    <SingleSelectMulitpleUserForm
                                        form={this.props.form}
                                        controlName={'manager_user'}
                                        defaultValue={manager_user}
                                        onChangeBool={true}
                                        onChangeFunc={(controlName, value) => { this.setMachineInfo({ manager_user: value }); }}
                                    />
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
                            >取消</button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

AddOrEditMachine.propTypes = {
    actions: PropTypes.object.isRequired,
    form: PropTypes.object.isRequired,
    addOrEdit: PropTypes.string.isRequired,
    closeModal: PropTypes.func.isRequired,
    callbackFunc: PropTypes.func,
    machineInfo: PropTypes.object,
};

export default createForm()(AddOrEditMachine);