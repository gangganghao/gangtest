import React, { Component } from 'react';
import PropTypes from "prop-types";
import classNames from 'classnames';
import { Table, Column, ColumnGroup, Cell } from 'fixed-data-table-2';
import { weekChineseShort } from '../../../../../constants/Constant.js';
import apiHelper from '../../../../../api/apiHelper.js';

class ScheduleFixDataTable extends Component {
    constructor(props) {
        super(props);
        let {mouthDayArray} = this.props;
        let width = 0;
        switch (mouthDayArray.length) {
            case 28:
                width = 1242;
                break;
            case 29:
                width = 1382;
                break;
            case 30:
                width = 1322;
                break;
            case 31:
                width = 1362;
        }
        this.state = {
            tableWidth: width
        };
        this.updateTableBoxSize = this.updateTableBoxSize.bind(this);
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.mouthDayArray.length != this.props.mouthDayArray.length) {
            this.updateTableBoxSize();
        }
    }
    componentDidMount() {
        this.updateTableBoxSize();
        window.addEventListener("resize", this.updateTableBoxSize);
    }
    componentWillUnmount() {
        window.removeEventListener("resize", this.updateTableBoxSize);
    }
    updateTableBoxSize() {
        let tableWidth = $('#userScheduleTable').width();
        let { mouthDayArray } = this.props;
        let width = 0;
        switch (mouthDayArray.length) {
            case 28:
                width = 1242;
                break;
            case 29:
                width = 1382;
                break;
            case 30:
                width = 1322;
                break;
            case 31:
                width = 1362;
        }
        tableWidth = tableWidth > width ? tableWidth : width;
        this.setState({ tableWidth });
    }
    render() {
        let { mouthDayArray, scheduleInfo, selectAttendanceClassIsShow, currentInfo,setSchedule,setScheduleX,setScheduleY,getClassNameByAttendanceClassId,getSectionName } = this.props;
        let {tableWidth} = this.state;
        return (
            <Table
                rowsCount={scheduleInfo.schedule_uids.length}
                rowHeight={43}
                groupHeaderHeight={30}
                headerHeight={45}
                height={390}
                width={tableWidth}
            >
                <ColumnGroup
                    fixed={true}
                    header={<Cell>姓名</Cell>}>
                    <Column
                        columnKey="userName"
                        fixed={true}
                        header={<Cell></Cell>}
                        cell={props => {
                            let userId = scheduleInfo.schedule_uids[props.rowIndex];
                            let userInfo = apiHelper.getCurrentUser(userId);
                            return (<Cell
                                {...props}
                                onClick={(e) => { setScheduleX(e, userId); }}
                                className='setScheduleX'
                            >
                                {userInfo.name}<b></b>
                            </Cell>);
                        }}
                        width={100}
                    />
                </ColumnGroup>
                <ColumnGroup
                    header={<Cell>日期/班次</Cell>}>
                    {
                        mouthDayArray && mouthDayArray.map((item, index) => {
                            let userScheduleData = null;
                            return (
                                <Column
                                    columnKey={`dateAndSchedule-${index}`}
                                    header={
                                        <Cell
                                            onClick={(e) => { setScheduleY(e, item.unixTime); }}
                                            className='setScheduleY'
                                        >
                                            {
                                                _.includes([0, 6], item.week) ? <em>
                                                    {item.num}
                                                    <br />
                                                    {weekChineseShort[item.week] || ''}
                                                </em>
                                                    :
                                                    [
                                                        item.num,
                                                        <br />,
                                                        weekChineseShort[item.week] || '',
                                                    ]
                                            }
                                            <b></b>
                                        </Cell>
                                    }
                                    cell={props => {
                                        let userId = scheduleInfo.schedule_uids[props.rowIndex];
                                        if (!_.isElement(scheduleInfo.schedule_data)) {
                                            userScheduleData = _.find(scheduleInfo.schedule_data, { uid: userId });//用户排班对象
                                        }

                                        if (!_.isEmpty(userScheduleData)) {
                                            let userScheduleInfo = _.find(userScheduleData.schedule, { schedule_date: item.unixTime });//用户某日的排班数据
                                            if (!_.isEmpty(userScheduleInfo)) {
                                                return (<Cell
                                                    {...props}
                                                    onClick={(e) => { setSchedule(e, item.unixTime, userId, userScheduleInfo.attendance_class_id); }}
                                                >
                                                    <span className={getClassNameByAttendanceClassId(userScheduleInfo.attendance_class_id)}>
                                                        <em className={classNames({ 'hide': selectAttendanceClassIsShow && userId === currentInfo.userId && item.unixTime === currentInfo.unixTime })}>{getSectionName(userScheduleInfo.attendance_class_id)}</em>
                                                        <i className={classNames('iconfont', 'icon-edit', { 'active': selectAttendanceClassIsShow && userId === currentInfo.userId && item.unixTime === currentInfo.unixTime })}></i>
                                                    </span>
                                                </Cell>);
                                            }
                                        }
                                        return (<Cell
                                            {...props}
                                            onClick={(e) => { setSchedule(e, item.unixTime, userId, 0); }}
                                        >
                                        </Cell>);
                                    }}
                                    width={40}
                                    key={index}
                                />
                            )
                        })
                    }
                </ColumnGroup>
            </Table>
        );
    }
}

ScheduleFixDataTable.propTypes = {
    scheduleInfo: PropTypes.object.isRequired,
    currentInfo: PropTypes.object.isRequired,
    mouthDayArray: PropTypes.array.isRequired,
    selectAttendanceClassIsShow: PropTypes.bool.isRequired,
    setSchedule: PropTypes.func.isRequired,
    setScheduleX: PropTypes.func.isRequired,
    setScheduleY: PropTypes.func.isRequired,
    getClassNameByAttendanceClassId: PropTypes.func.isRequired,
    getSectionName: PropTypes.func.isRequired,
};
export default ScheduleFixDataTable;