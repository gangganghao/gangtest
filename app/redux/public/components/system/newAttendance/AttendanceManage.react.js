import React, { Component } from 'react';
import { editScheduleModalStyle } from '../../../constants/Constant.js';
import Modal from 'react-modal';
import EditSchedule from './rule/Schedule/EditSchedule.react';

export default class AttendanceManage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editScheduleModalIsOpen:false,
            currentAttendanceId:0,
        }
    }
    updateEditScheduleModalIsOpenStatus(editScheduleModalIsOpen, currentAttendanceId) {
        if (editScheduleModalIsOpen) {
            this.setState({ editScheduleModalIsOpen: true, currentAttendanceId: currentAttendanceId || 0 });
        } else {
            this.setState({ editScheduleModalIsOpen: false, currentAttendanceId: 0 });
        }
    }
    editScheduleModalRender(){
        let {editScheduleModalIsOpen,currentAttendanceId} = this.state;
        if(!editScheduleModalIsOpen)return null;
        return (
            <Modal
                isOpen={true}
                style={editScheduleModalStyle}
                portalClassName="editScheduleModal"
                contentLabel="edit Schedule Modal"
                key={'editScheduleModal'}
            >
                <EditSchedule
                    closeModal={this.updateEditScheduleModalIsOpenStatus.bind(this,false)}
                    enterFunction={this.updateEditScheduleModalIsOpenStatus.bind(this,false)}
                    currentAttendanceId={currentAttendanceId}
                    ruleId={currentAttendanceId}
                />
            </Modal>
        )
    }
    render() {
        let allDoms = React.Children.map(this.props.children, function (child) {
            return React.cloneElement(child, { updateEditScheduleModalIsOpenStatus: this.updateEditScheduleModalIsOpenStatus.bind(this) });
        },this);
        allDoms.push(this.editScheduleModalRender());
        return allDoms;
    }
}