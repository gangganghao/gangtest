import React, { Component } from 'react';
import PropTypes from "prop-types";
import {weekChinese2} from '../../../../../constants/Constant.js';
import DateInput from '../../../../common/validateComponents/Components/Date.js';

class Free extends Component {
    constructor(props) {
        super(props);
        this.state = {
            deleteConfirmIsOpen:false
        }
    }
    selectWeek(weekValue){
        let {ruleInfo,updateRuleInfo} = this.props;
        ruleInfo.working_date = ruleInfo.working_date||{};
        ruleInfo.working_date.days = ruleInfo.working_date.days||[];
        if(_.includes(ruleInfo.working_date.days,weekValue)){
            _.remove(ruleInfo.working_date.days,(d)=>d===weekValue);
        }else{
            ruleInfo.working_date.days.push(weekValue);
        }
        updateRuleInfo('working_date',ruleInfo.working_date);
    }
    getTimeOptions() {
        let retArr = [];
        for (var i = 0; i <= 24; i = i + 0.5) {
            if (i === 0) {
                retArr.push(<option value='0'>--</option>);
                continue;
            }
            retArr.push(<option value={parseInt(i)}>{i}小时</option>);
        }
        return retArr;
    }
    render() {
        let { ruleInfo,updateRuleInfo } = this.props;
        let weekRender = [];
        for (var i = 0; i < 7; i++) {
            let weekValue = i + 1 === 7 ? 0 : i + 1;
            weekRender.push(<li key={i}>
                <label>
                    <input type="checkbox" onChange={this.selectWeek.bind(this,weekValue)} checked={!_.isEmpty(ruleInfo.working_date) && _.includes(ruleInfo.working_date.days, weekValue)} />
                    {weekChinese2[i + 1]}
                </label>
            </li>);
        }
        return [
            <div className="clock-form-menu">
                <h4>5、工作日设置</h4>
                <div className="clock-rule-workday">
                    <ul>
                        {weekRender}
                    </ul>
                </div>
            </div>,
            <div className="clock-form-menu">
                <h4>7、考勤设置</h4>
                <div className="clock-rule-one">
                    每天几点开始新一天的考勤
                <div className="form-control">
                        <DateInput
                            timePicker={false}
                            onChangeFunc={(value) => {
                                updateRuleInfo('attendance_begin_time', value.format('hh:mm'));
                            }}
                            defaultDate={moment(`${moment().format('YYYY-MM-DD')} ${ruleInfo.attendance_begin_time||'09:00'}`).valueOf()}
                            dateFormatStr={'hh:mm'}
                        />
                    </div>
                </div>
                <div className="clock-rule-one">
                    日时长 （仅用于统计报表）
                <select
                        className="form-control"
                        defaultValue={ruleInfo.min_work_time}
                        onChange={(e) => { updateRuleInfo('min_work_time', e.target.value); }}
                    >
                        {this.getTimeOptions()}
                    </select>
                </div>
            </div>
        ];
    }
}
Free.propTypes = {
    ruleInfo: PropTypes.object.isRequired,
    updateRuleInfo: PropTypes.func.isRequired,
};
export default Free;