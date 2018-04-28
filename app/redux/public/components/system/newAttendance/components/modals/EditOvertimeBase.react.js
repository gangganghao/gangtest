import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import { customStyles } from '../../../../../constants/Constant';

class EditOvertimeBase extends Component {
    constructor(props) {
        super(props);
        this.state = {
            overtimeBase: props.overtimeBase,
            btnSubmitDisabled: false
        };
    }

    setOvertimeBase(parameterObj) {
        let overtimeBase = this.state.overtimeBase;
        overtimeBase = Object.assign({}, overtimeBase, parameterObj);
        this.setState({ overtimeBase });
    }

    submit() {
        const { actions, callbackFunc, closeModal } = this.props;
        actions.editOvertimeBase(this.state.overtimeBase, (err) => {
            this.setState({ btnSubmitDisabled: false });
            if (!err) {
                callbackFunc && callbackFunc();
                closeModal();
            }
        });
    }

    render() {
        const { callbackFunc, closeModal } = this.props;
        const { overtimeBase: { overtime_unit, hour_to_day } } = this.state;
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
                            <h4 className="modal-title">加班规则基础设置</h4>
                        </div>
                        <div className="modal-body new-form">
                            <ul className="form-list">
                                <li>
                                    <em>加班计算单位</em>
                                    <div className="r">
                                        <select
                                            className="form-control"
                                            defaultValue={overtime_unit}
                                            onChange={(e) => { this.setOvertimeBase({ overtime_unit: Number(e.target.value) }); }}
                                        >
                                            {
                                                [
                                                    { title: '按分钟', value: 1 },
                                                    { title: '按小时', value: 2 },
                                                    { title: '按半天', value: 3 },
                                                    { title: '按天', value: 4 }
                                                ].map((item) => {
                                                    return (
                                                        <option key={item.value} value={item.value}>{item.title}</option>
                                                    );
                                                })
                                            }
                                        </select>
                                        {overtime_unit === 1 ? <p>员工加班时长，如实计算，例如：加班90分钟=90分钟</p> : null}
                                        {overtime_unit === 2 ? <p>员工加班时长，以小时为单位计算，不足的不计算，例如：加班1.68小时=1.5小时</p> : null}
                                        {overtime_unit === 3 ? <p>员工加班时长，以半天为单位计算，不足的不计算，例如：加班0.95天=0.5天</p> : null}
                                        {overtime_unit === 4 ? <p>员工加班时长，以天为单位计算，不足的不计算，例如：加班1.90天=1天</p> : null}
                                    </div>
                                </li>
                                <li>
                                    <em>日时长折算</em>
                                    <div className="r">
                                        <span className="inlineblock">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={hour_to_day}
                                                onChange={(e) => { this.setOvertimeBase({ hour_to_day: Number(e.target.value) }); }}
                                            />
                                        </span>
                                        小时 = 1天
                                    </div>
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
                            <button
                                type="button"
                                className="btn btn-default"
                                onClick={() => { closeModal(); }}
                            >
                                取消
                        </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

EditOvertimeBase.propTypes = {
    actions: PropTypes.object.isRequired,
    closeModal: PropTypes.func.isRequired,
    callbackFunc: PropTypes.func,
    overtimeBase: PropTypes.object.isRequired,
};

export default EditOvertimeBase;