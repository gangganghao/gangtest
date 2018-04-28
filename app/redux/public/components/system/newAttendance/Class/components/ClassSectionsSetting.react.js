import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TimePicker from 'rc-time-picker';
import apiHelper from '../../../../../api/apiHelper';
import * as systemAttHelper from '../../common/systemAttHelper';

class ClassSectionsSetting extends Component {
    setTimeRange(timeMoment, index, key) {
        let { setClassRule, classRule: { section } } = this.props;

        if (!this.checkIsOrder(timeMoment, index, key)) {
            return apiHelper.error('请按时间顺序设置时间点');
        }

        if (this.checkIsSameTime(timeMoment, index, key)) {
            return apiHelper.error('两个时间的不能设置为同一时间');
        }

        section[index][key] = systemAttHelper.transformMomentToTime(timeMoment);
        section = this.setDayAcross(section);
        setClassRule({ section: section });
    }

    // 检查打卡时间是否重复
    checkIsSameTime(timeMoment, index, key) {
        const { classRule: { section } } = this.props;
        let isSameTime = false;
        section.forEach((item, i) => {
            // 如果设置的时间和签到时间一致
            if (systemAttHelper.transformMomentToTime(timeMoment) === item.start_time) {
                if (!(index === i && key === 'start_time')) {
                    isSameTime = true;
                }
                // 如果设置的时间和签退时间一致
            } else if (systemAttHelper.transformMomentToTime(timeMoment) === item.end_time) {
                if (!(index === i && key === 'end_time')) {
                    isSameTime = true;
                }
            }
        });
        return isSameTime;
    }

    // 检查打卡时间是否按顺序
    checkIsOrder(timeMoment, index, key) {
        const { classRule: { section } } = this.props;
        if (
            (   // 如果设置的是休息时间段
                section[index].is_rest &&
                (
                    (
                        // 打卡时间是休息开始时间 && 
                        // (
                        //  (休息结束时间不是次日 && (打卡时间小于于签到时间 || 打卡时间大于休息结束时间)) ||
                        //  (休息结束时间是次日 && (打卡时间小于签到时间 && 打卡时间大于休息结束时间))
                        // )
                        key === 'start_time' && (
                            (
                                !section[index].end_time_across &&
                                (timeMoment.valueOf() < systemAttHelper.transformTimeToMoment(section[index - 1].start_time).valueOf() || timeMoment.valueOf() > systemAttHelper.transformTimeToMoment(section[index].end_time).valueOf())
                            ) || (
                                section[index].end_time_across &&
                                (timeMoment.valueOf() < systemAttHelper.transformTimeToMoment(section[index - 1].start_time).valueOf() && timeMoment.valueOf() > systemAttHelper.transformTimeToMoment(section[index].end_time).valueOf())
                            )
                        )
                    )
                    ||
                    (
                        // 打卡时间是休息结束时间 && 
                        // (
                        //  (签退时间不是次日 && (打卡时间小于休息开始时间 || 打卡时间大于签退时间)) ||
                        //  (签退时间是次日 && (打卡时间大于签退时间 && 打卡时间小于休息开始时间))
                        // )
                        key === 'end_time' &&
                        (
                            (
                                systemAttHelper.transformTimeToMoment(section[index - 1].start_time).valueOf() < systemAttHelper.transformTimeToMoment(section[index - 1].end_time).valueOf() &&
                                (timeMoment.valueOf() < systemAttHelper.transformTimeToMoment(section[index].start_time).valueOf() || timeMoment.valueOf() > systemAttHelper.transformTimeToMoment(section[index - 1].end_time).valueOf())
                            ) || (
                                systemAttHelper.transformTimeToMoment(section[index - 1].start_time).valueOf() > systemAttHelper.transformTimeToMoment(section[index - 1].end_time).valueOf() &&
                                (timeMoment.valueOf() > systemAttHelper.transformTimeToMoment(section[index - 1].end_time).valueOf() && timeMoment.valueOf() < systemAttHelper.transformTimeToMoment(section[index].start_time).valueOf())
                            )
                        )
                    )
                )
            )
            ||
            (
                // 打卡时间不是休息结束时间 
                !section[index].is_rest && (
                    (
                        // 打卡时间是开始时间 && 打卡开始时间不是第一班次 && 
                        // 打卡开始时间是次日 && 打卡开始时间的上一个打卡结束时间是次日 &&
                        // 打卡开始时间小于上一个打卡结束时间
                        key === 'start_time' && index > 0 &&
                        section[index].start_time_across === 1 && section[index - 1].end_time_across === 1 &&
                        timeMoment.valueOf() < systemAttHelper.transformTimeToMoment(section[index - 1].end_time).valueOf()
                    )
                    ||
                    (
                        // 打卡时间是结束时间 && 
                        // 打卡结束时间的上一个打卡开始时间是次日 && 打卡结束时间是次日 && 
                        // 打卡结束时间小于上一个打卡开始时间
                        key === 'end_time' &&
                        section[index].start_time_across === 1 && section[index].end_time_across === 1 &&
                        timeMoment.valueOf() < systemAttHelper.transformTimeToMoment(section[index].start_time).valueOf()
                    )
                )
            )
        ) {
            return false;
        } else {
            return true;
        }
    }

    // 将需要打卡时间改为次日
    setDayAcross(section) {
        let indexAcross = -1; // 需要跨天的 index
        let keyAcross = ''; // 需要跨天的关键字 'start_time' 或者 'end_time'
        // 找到第一个需要设置为次日的 indexAcross 和 keyAcross
        section.forEach((item, index, array) => {
            if (!item.is_rest) {
                if (systemAttHelper.transformTimeToMoment(item.end_time) < systemAttHelper.transformTimeToMoment(item.start_time)) {
                    indexAcross = index;
                    keyAcross = 'end_time';
                } else if (index > 0 && systemAttHelper.transformTimeToMoment(item.start_time) < systemAttHelper.transformTimeToMoment(section[index - 1].end_time)) {
                    indexAcross = index;
                    keyAcross = 'start_time';
                }
            }
        });
        section = section.map((item, index) => {
            if (!item.is_rest) {
                if (index >= indexAcross && indexAcross !== -1) {
                    // 将第一个需要设置为次日打卡时间后的打卡时间全都改为次日
                    if (keyAcross === 'start_time') {
                        item.start_time_across = 1;
                        item.end_time_across = 1;
                    } else if (keyAcross === 'end_time') {
                        if (index > indexAcross) {
                            item.start_time_across = 1;
                        } else {
                            item.start_time_across = 0;
                        }
                        item.end_time_across = 1;
                    }
                } else {
                    // 如果没有的话就都设置为非次日的
                    item.start_time_across = 0;
                    item.end_time_across = 0;
                }
            } else {
                // 只有一个班次，有休息时间段，签退时间是次日。
                if (systemAttHelper.transformTimeToMoment(section[index - 1].end_time) < systemAttHelper.transformTimeToMoment(section[index - 1].start_time)) {
                    // 休息开始时间小于签退时间
                    if (systemAttHelper.transformTimeToMoment(item.start_time) < systemAttHelper.transformTimeToMoment(section[index - 1].end_time)) {
                        item.start_time_across = 1;
                    } else { item.start_time_across = 0; }
                    // 休息结束时间小于签退时间
                    if (systemAttHelper.transformTimeToMoment(item.end_time) < systemAttHelper.transformTimeToMoment(section[index - 1].end_time)) {
                        item.end_time_across = 1;
                    } else { item.end_time_across = 0; }
                }
            }
            return item;
        });
        return section;
    }

    getWorkTimeStr() {
        const { classRule: { section } } = this.props;
        let totalWorkTime = 0;
        let leftHour = 0;
        let leftMinute = 0;

        section.forEach(item => {
            let sectionWorkTime = Math.abs((systemAttHelper.transformTimeToMoment(item.end_time).valueOf() - systemAttHelper.transformTimeToMoment(item.start_time).valueOf()));
            if (item.start_time_across === 0 && item.end_time_across === 1) sectionWorkTime = 24 * 60 * 60 * 1000 - sectionWorkTime;
            if (item.is_rest === 1) {
                totalWorkTime = totalWorkTime - sectionWorkTime;
            } else {
                totalWorkTime = totalWorkTime + sectionWorkTime;
            }
        });

        leftHour = parseInt(totalWorkTime / 3600000);
        leftMinute = parseInt((totalWorkTime - leftHour * 3600000) / 60000);
        return `${leftHour}小时${leftMinute}分钟`;
    }

    getClockTimeArr(type, sectionItemIndex) {
        const { setClassRule, classRule: { day_count, section } } = this.props;
        let timeArr = Array.apply(null, { length: 73 }).map((item, index) => index * 10);
        const getTimeDiff = (timeEnd, timeStart) => {
            let timeMinuteDiff = Math.abs(((systemAttHelper.transformTimeToMoment(timeEnd).valueOf() - systemAttHelper.transformTimeToMoment(timeStart).valueOf()) / 60000));
            let timeArrLength = parseInt(timeMinuteDiff / 10) + 1;
            return Array.apply(null, { length: timeArrLength }).map((item, index) => index * 10);
        };
        switch (type) {
            case 'ahead_minute':
                if (sectionItemIndex > 0) {
                    timeArr = getTimeDiff(section[sectionItemIndex].start_time, section[sectionItemIndex - 1].end_time);
                }
                break;
            case 'delay_minute':
                if (sectionItemIndex < day_count - 1) {
                    timeArr = getTimeDiff(section[sectionItemIndex + 1].start_time, section[sectionItemIndex].end_time);
                }
                break;
            default:
                break;
        }
        return timeArr;
    }

    selectOptionsRender(timeNodes = [], defaultInfo, key, sectionItemIndex) {
        const { setClassRule, classRule: { section } } = this.props;
        return (
            <select
                className="form-control"
                value={defaultInfo[key]}
                onChange={(e) => {
                    section[sectionItemIndex][key] = Number(e.target.value);
                    setClassRule({ section });
                }}
            >
                {timeNodes.map(time => <option key={time} value={time}>{time === 0 ? '--' : time}</option>)}
            </select>
        );
    }

    restItemRender() {
        const { classRule: { section } } = this.props;
        const restItemIndex = section.findIndex(item => item.is_rest === 1);
        return (
            <li>
                <div className="clock-sign-time">
                    休息开始&nbsp;
                    <div className="form-control">
                        <TimePicker
                            showSecond={false}
                            value={systemAttHelper.transformTimeToMoment(section[restItemIndex].start_time)}
                            onChange={(value) => { this.setTimeRange(value, restItemIndex, 'start_time'); }}
                        />
                        <i className="iconfont icon-history"></i>
                    </div>
                    {section[restItemIndex].start_time_across ? <span className="clock-next">次日</span> : null}
                </div>
                <div className="clock-sign-time">
                    休息结束&nbsp;
                    <div className="form-control">
                        <TimePicker
                            showSecond={false}
                            value={systemAttHelper.transformTimeToMoment(section[restItemIndex].end_time)}
                            onChange={(value) => { this.setTimeRange(value, restItemIndex, 'end_time'); }}
                        />
                        <i className="iconfont icon-history"></i>
                    </div>
                    {section[restItemIndex].end_time_across ? <span className="clock-next">次日</span> : null}
                </div>
            </li>
        );
    }

    sectionItemRender(sectionInfo, index) {
        const { classRule: { day_count, check_minute_setting } } = this.props;
        return (
            [
                <p key={`title${index}`}>
                    <em>
                        {index === 0 ? '第一次' : null}
                        {index === 1 ? '第二次' : null}
                        {index === 2 ? '第三次' : null}
                    </em>
                </p>,
                <ul key={`setting${index}`}>
                    <li>
                        <div className="clock-sign-time">
                            签到时间&nbsp;
                            <div className="form-control">
                                <TimePicker
                                    showSecond={false}
                                    value={systemAttHelper.transformTimeToMoment(sectionInfo.start_time)}
                                    onChange={(value) => { this.setTimeRange(value, index, 'start_time'); }}
                                />
                                <i className="iconfont icon-history"></i>
                            </div>
                            {sectionInfo.start_time_across ? <span className="clock-next">次日</span> : null}
                            {check_minute_setting
                                ?
                                <div className="clock-add-time">
                                    {this.selectOptionsRender(
                                        this.getClockTimeArr('ahead_minute', index),
                                        sectionInfo,
                                        'ahead_minute',
                                        index
                                    )}
                                    分钟前开始打卡
                                </div>
                                : null
                            }
                        </div>
                        <div className="clock-sign-time">
                            签退时间&nbsp;
                            <div className="form-control">
                                <TimePicker
                                    showSecond={false}
                                    value={systemAttHelper.transformTimeToMoment(sectionInfo.end_time)}
                                    onChange={(value) => { this.setTimeRange(value, index, 'end_time'); }}
                                />
                                <i className="iconfont icon-history"></i>
                            </div>
                            {sectionInfo.end_time_across ? <span className="clock-next">次日</span> : null}
                            {check_minute_setting
                                ?
                                <div className="clock-add-time">
                                    {this.selectOptionsRender(
                                        this.getClockTimeArr('delay_minute', index),
                                        sectionInfo,
                                        'delay_minute',
                                        index
                                    )}
                                    分钟后结束打卡
                                </div>
                                : null
                            }
                        </div>
                    </li>
                    {day_count === 1 ? this.restItemRender() : null}
                </ul>
            ]
        );
    }

    render() {
        const { classRule } = this.props;
        const { day_count, section } = classRule;
        return (
            <div className={`clock-form-duty ${day_count === 2 ? 'one-corner' : null} ${day_count === 3 ? 'two-corner' : null}`}>
                {!_.isEmpty(section)
                    ?
                    section.map((item, index) => {
                        if (item.is_rest !== 1) {
                            return (this.sectionItemRender(item, index));
                        } else {
                            return null;
                        }
                    })
                    : null}
                <p>合计工作时长{this.getWorkTimeStr()}<em>(考勤统计工作时长及请假出差外出统计，会以此时间为准)</em></p>
            </div>
        );
    }
}

ClassSectionsSetting.propTypes = {
    classRule: PropTypes.object.isRequired,
    setClassRule: PropTypes.func.isRequired,
};

export default ClassSectionsSetting;