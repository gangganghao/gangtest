import React, { Component } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from "prop-types";
import * as actions from '../../../../actions/newSystemAttendance/RuleActions';
import apiHelper from '../../../../api/apiHelper.js';
import Loading from '../../../common/Loading.react';
import AttendanceListItem from './AttendanceListItem.react';
import { editScheduleModalStyle } from '../../../../constants/Constant.js';
import Modal from 'react-modal';
import EditSchedule from './Schedule/EditSchedule.react';

class AttendanceList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ruleListLoading: true,
            searchKey: '',
            currentAttendanceId: 0,
            editScheduleModalIsOpen: false,
        }
    }
    componentWillReceiveProps(nextProps, nextState) {

    }
    componentDidMount() {
        this.props.actions.getAttendanceRuleData(() => {
            this.setState({ ruleListLoading: false });
        });
    }
    newAttendanceRule(id) {
        this.props.router.push({ pathname: `/system/newattendance/createoredit/${id || 0}`, query: { callBackUrl: window.location.hash } });
    }
    editAttendanceSchedule(id) {
        this.props.router.push({ pathname: `/system/newattendance/editschedule/${id || 0}`, query: { callBackUrl: window.location.hash } });
    }
    // updateEditScheduleModalIsOpenStatus(editScheduleModalIsOpen, currentAttendanceId) {
    //     if (editScheduleModalIsOpen) {
    //         this.setState({ editScheduleModalIsOpen: true, currentAttendanceId: currentAttendanceId || 0 });
    //     } else {
    //         this.setState({ editScheduleModalIsOpen: false, currentAttendanceId: 0 });
    //     }
    // }
    onScheduleSave() {

    }
    // editScheduleModalRender(){
    //     let {editScheduleModalIsOpen,currentAttendanceId} = this.state;
    //     if(!editScheduleModalIsOpen)return null;
    //     return (
    //         <Modal
    //             isOpen={true}
    //             style={editScheduleModalStyle}
    //             portalClassName="editScheduleModal"
    //             contentLabel="edit Schedule Modal"
    //         >
    //             <EditSchedule
    //                 closeModal={this.updateEditScheduleModalIsOpenStatus.bind(this,false)}
    //                 enterFunction={this.onScheduleSave.bind(this)}
    //                 currentAttendanceId={currentAttendanceId}
    //                 ruleId={currentAttendanceId}
    //             />
    //         </Modal>
    //     )
    // }
    render() {
        let { ruleListLoading } = this.state;
        let { attendanceRule, actions, updateEditScheduleModalIsOpenStatus } = this.props;
        let { ruleList } = attendanceRule;

        return (
            <div className="background-new">
                <div className="back-new-main">
                    <div className="clock-new-list">
                        <div className="clock-list-hd clearfix">
                            <h4>考勤规则列表</h4>
                            <div className="fr">
                                <div className="task-search">
                                    <i className="iconfont icon-search"></i>
                                    <input type="text" className="form-control" value="" placeholder="搜索..." /><i className="iconfont icon-thinclose hide"></i>
                                </div>
                                <a onClick={() => { this.newAttendanceRule() }} draggable='false' href="javascript:;" className="btn btn-primary">+新建考勤规则</a>
                            </div>
                        </div>
                        <div className="clock-list-table">
                            {
                                ruleListLoading ?
                                    <Loading />
                                    :
                                    <table>
                                        <tbody>
                                            <tr>
                                                <th>设备名称</th>
                                                <th>适用人员</th>
                                                <th>考勤类型</th>
                                                <th>考勤时间</th>
                                                <th>操作</th>
                                            </tr>
                                            {
                                                ruleList && ruleList.map((ruleItem, index) => {
                                                    return (
                                                        <AttendanceListItem
                                                            actions={actions}
                                                            ruleItem={ruleItem}
                                                            newAttendanceRule={this.newAttendanceRule.bind(this)}
                                                            updateEditScheduleModalIsOpenStatus={updateEditScheduleModalIsOpenStatus}
                                                            key={index}
                                                        />
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
const mapStateToProps = (state) => ({
    attendanceRule: state.rule
});
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(actions, dispatch),
    dispatch: dispatch
});
AttendanceList.propTypes = {
    attendanceRule: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    router: PropTypes.object,
    updateEditScheduleModalIsOpenStatus: PropTypes.func.isRequired,//该函数是从父组件自动传进来的，不必手动处理
};
export default connect(mapStateToProps, mapDispatchToProps)(AttendanceList);
