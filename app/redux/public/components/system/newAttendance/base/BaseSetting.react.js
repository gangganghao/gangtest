import React, { Component } from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actions from '../../../../actions/newSystemAttendance/BaseSettingActions';
import PropTypes from "prop-types";
import apiHelper from '../../../../api/apiHelper.js';
import Loading from '../../../common/Loading.react';

class BaseSetting extends Component {
    constructor(props) {
        super(props);
        this.state = {
            baseSettingInfo: {
                on_duty_remind_time: 10,//上班打卡前几分钟提醒
                off_duty_remind_time: 10,//下班后几分钟打卡提醒
                is_watermarking: 0,//拍照是否加水印 1是 0否

                is_remind_leader: 1,//外勤打卡是否需要通知上级 1是 0否
                is_photo: 0,//外勤是否强制拍照(含备注) 1是 0否
                is_micro_adjust: 0,//是否允许微调： 1允许 0不允许
                adjust_range: 50,//微调范围:米 is_micro_adjust=1 有效
            },
            isChange: false,
            sending: false,
        }
    }
    componentWillReceiveProps(nextProps, nextState) {
        if (nextProps.baseSetting.baseSettingInfo !== this.props.baseSetting.baseSettingInfo) {
            this.setState({ baseSettingInfo: nextProps.baseSetting.baseSettingInfo, isChange: false });
        }
    }
    componentDidMount() {
        this.props.actions.getBaseSettingInfo();
    }
    getTimeOptions() {
        let retArr = [];
        for (var i = 0; i <= 120; i = i + 5) {
            if (i === 0) {
                retArr.push(<option value='0'>--</option>);
                continue;
            }
            retArr.push(<option value={parseInt(i)}>{i}分钟</option>);
        }
        return retArr;
    }
    updateBaseSettingInfo(key, value) {
        let { baseSettingInfo } = this.state;
        let changeOptions = { [key]: parseInt(value) };
        if (key === 'is_micro_adjust' && value && !baseSettingInfo.adjust_range) {//微调范围没有值的时候，增加默认值
            changeOptions['adjust_range'] = 50;
        }
        this.setState({ baseSettingInfo: { ...baseSettingInfo, ...changeOptions }, isChange: true });
    }
    saveBaseSettingInfo() {
        let { baseSettingInfo, sending } = this.state;
        if (sending) return;
        this.setState({ sending: true });
        var saveValues = {
            on_duty_remind_time: baseSettingInfo.on_duty_remind_time,
            off_duty_remind_time: baseSettingInfo.off_duty_remind_time,
            is_watermarking: baseSettingInfo.is_watermarking,
            is_remind_leader: baseSettingInfo.is_remind_leader,
            is_photo: baseSettingInfo.is_photo,
            is_micro_adjust: baseSettingInfo.is_micro_adjust,
            adjust_range: baseSettingInfo.adjust_range,
        }
        this.props.actions.saveBaseSettingInfo(saveValues, (err) => {
            if (err) {
                this.setState({ sending: false });
                apiHelper.error("考勤基础设置保存出错", 1500);
                return;
            } else {
                this.setState({ sending: false, isChange: false });
                apiHelper.info("保存成功", 1500);
            }
        })
    }
    render() {
        let { baseSettingInfo } = this.state;
        // if(_.isEmpty(baseSettingInfo))return null;
        console.log('baseSettingInfo', baseSettingInfo);
        let { on_duty_remind_time, off_duty_remind_time, is_watermarking, is_remind_leader, is_photo, is_micro_adjust, adjust_range, isChange, sending } = baseSettingInfo;
        return (
            <div className="backs-subsech">
                <div className="backs-new">
                    <div className="crm-reasons">
                        {
                            _.isEmpty(baseSettingInfo) ?
                                <div className="crm-reason-main">
                                    <Loading />
                                </div>
                                :
                                <div className="crm-reason-main">
                                    <div className="back-reprule">
                                        <h4>1、打卡提醒时间</h4>
                                        <div className="clock-rule-one clock-rule-padd">
                                            <p>上班前
                                    <select
                                                    className="form-control"
                                                    value={on_duty_remind_time}
                                                    onChange={(e) => { this.updateBaseSettingInfo('on_duty_remind_time', e.target.value); }}
                                                >
                                                    {this.getTimeOptions()}
                                                </select>
                                                分钟提醒 ，
                                    </p>
                                            <p>下班后
                                    <select
                                                    className="form-control"
                                                    value={off_duty_remind_time}
                                                    onChange={(e) => { this.updateBaseSettingInfo('off_duty_remind_time', e.target.value); }}
                                                >
                                                    {this.getTimeOptions()}
                                                </select>
                                                分钟提醒
                                    </p>
                                        </div>
                                    </div>
                                    <div className="back-reprule">
                                        <h4>2、拍照的照片是否增加水印<em>(时间/地点/logo)</em></h4>
                                        <div className="checkbox-item">
                                            <input
                                                type="checkbox"
                                                value={is_watermarking === 1 ? 'on' : 'off'}
                                                checked={is_watermarking === 1}
                                                id="isWaterMarking"
                                                onChange={(e) => { this.updateBaseSettingInfo('is_watermarking', e.target.checked ? 1 : 0); }}
                                            />
                                            <label htmlFor="isWaterMarking" data-off="未启用" data-on="已启用"></label>
                                        </div>
                                    </div>
                                    <div className="back-reprule">
                                        <h4>3、外勤设置</h4>
                                        <div className="checkbox-post">
                                            <h5>a、通知上级</h5>
                                            <div className="checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    id="isRemindLeader"
                                                    value={is_remind_leader === 1 ? 'on' : 'off'}
                                                    checked={is_remind_leader === 1}
                                                    onChange={(e) => { this.updateBaseSettingInfo('is_remind_leader', e.target.checked ? 1 : 0); }}
                                                />
                                                <label htmlFor="isRemindLeader" data-off="未启用" data-on="已启用"></label>
                                            </div>
                                        </div>
                                        <div className="checkbox-post">
                                            <h5>b、强制拍照(含备注)</h5>
                                            <div className="checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    value={is_photo === 1 ? 'on' : 'off'}
                                                    checked={is_photo === 1}
                                                    id="isPhoto"
                                                    onChange={(e) => { this.updateBaseSettingInfo('is_photo', e.target.checked ? 1 : 0); }}
                                                />
                                                <label htmlFor="isPhoto" data-off="未启用" data-on="已启用"></label>
                                            </div>
                                        </div>
                                        <div className="checkbox-post">
                                            <h5>c、允许微调</h5>
                                            <div className="checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    value={is_micro_adjust === 1 ? 'on' : 'off'}
                                                    checked={is_micro_adjust === 1}
                                                    id="isMicroAdjust"
                                                    onChange={(e) => { this.updateBaseSettingInfo('is_micro_adjust', e.target.checked ? 1 : 0); }}
                                                />
                                                <label htmlFor="isMicroAdjust" data-off="未启用" data-on="已启用"></label>
                                            </div>
                                            {
                                                is_micro_adjust ?
                                                    <ul>
                                                        <li>
                                                            微调范围
                                                    <select
                                                                className="form-control"
                                                                defaultValue={adjust_range}
                                                                onChange={(e) => { this.updateBaseSettingInfo('adjust_range', e.target.value); }}
                                                            >
                                                                <option value='50'>50米</option>
                                                                <option value='100'>100米</option>
                                                                <option value='200'>200米</option>
                                                                <option value='300'>300米</option>
                                                                <option value='400'>400米</option>
                                                                <option value='500'>500米</option>
                                                                <option value='600'>600米</option>
                                                                <option value='700'>700米</option>
                                                                <option value='800'>800米</option>
                                                                <option value='900'>900米</option>
                                                                <option value='1000'>1000米</option>
                                                                <option value='1000'>1500米</option>
                                                                <option value='2000'>2000米</option>
                                                                <option value='3000'>3000米</option>
                                                            </select>
                                                        </li>
                                                    </ul>
                                                    :
                                                    null
                                            }
                                        </div>
                                    </div>
                                </div>
                        }
                        <div className="crm-pipe-btn clearfix">
                            <a
                                draggable='false'
                                href="javascript:;"
                                className="btn fr"
                                disabled={sending || !this.state.isChange}
                                onClick={this.saveBaseSettingInfo.bind(this)}
                            >
                                保存
                        </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


const mapStateToProps = (state) => ({
    baseSetting: state.baseSetting
});
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(actions, dispatch),
    dispatch: dispatch
});
BaseSetting.propTypes = {
    baseSetting: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
};
export default connect(mapStateToProps, mapDispatchToProps)(BaseSetting);