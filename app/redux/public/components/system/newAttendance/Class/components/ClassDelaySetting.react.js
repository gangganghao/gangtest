import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ClassDelaySetting extends Component {

    addDelayRule() {
        const { setClassRule } = this.props;
        let { classRule: { elastic } } = this.props;
        let elasticNum = elastic.length;
        if (elasticNum > 0) {
            let delay_off_duty_hour = elastic[elasticNum - 1].delay_off_duty_hour + 0.5;
            let delay_on_duty_hour = elastic[elasticNum - 1].delay_on_duty_hour + 0.5;
            elastic = elastic.concat([{ delay_off_duty_hour, delay_on_duty_hour }]);
        }
        setClassRule({ elastic });
    }

    selectOptionsRender(timeNodes, defaultInfo, key, index) {
        const { setClassRule, classRule: { elastic } } = this.props;
        return (
            <select
                className="form-control"
                value={defaultInfo[key]}
                onChange={(e) => {
                    elastic[index][key] = Number(e.target.value);
                    setClassRule({ elastic });
                }}
            >
                {!_.isEmpty(timeNodes)
                    ?
                    timeNodes.map(time => {
                        return (
                            <option key={time} value={time}>{time.toFixed(1)}</option>
                        );
                    })
                    : null
                }
            </select>
        );
    }

    deleteDelayItem(deleteIndex) {
        const { setClassRule, classRule: { elastic } } = this.props;
        setClassRule({ elastic: elastic.filter((item, index) => index !== deleteIndex) });
    }

    render() {
        const { setClassRule, classRule: { elastic } } = this.props;
        return (
            <div className="clock-rule-two">
                <p>
                    <input
                        type="checkbox"
                        defaultChecked={!_.isEmpty(elastic)}
                        onChange={() => {
                            !_.isEmpty(elastic)
                                ?
                                setClassRule({ elastic: [] })
                                :
                                setClassRule({ elastic: [{ delay_off_duty_hour: 3.0, delay_on_duty_hour: 1.0 }] });
                        }}
                    />晚走晚到
                    <em>(第一天下班走太晚，第二天可以晚点到，仅支持固定班制内勤打卡)</em>
                </p>
                {!_.isEmpty(elastic)
                    ?
                    elastic.map((item, index, array) => {
                        return (
                            <div key={index} className="clock-rule-elastic">
                                <span>
                                    规则{index + 1}：
                                    {index > 0 ? <em onClick={() => { this.deleteDelayItem(index); }}>删除</em> : null}
                                </span>
                                <div className="elastic">
                                    第一天下班后晚走
                                    {this.selectOptionsRender(
                                        [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0],
                                        item,
                                        'delay_off_duty_hour',
                                        index
                                    )}
                                    小时，第二天上班可以晚到
                                    {this.selectOptionsRender(
                                        [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5],
                                        item,
                                        'delay_on_duty_hour',
                                        index
                                    )}小时
                                    <p>第一天19:00下班，第二天11:00上班不算迟到</p>
                                </div>
                            </div>
                        );
                    })
                    : null
                }
                {!_.isEmpty(elastic)
                    ?
                    <a
                        href="javascript:void(0)"
                        className="clock-rule-add"
                        onClick={() => { this.addDelayRule(); }}
                    >+添加晚走晚到规则</a>
                    : null
                }
            </div>
        );
    }
}

ClassDelaySetting.propTypes = {
    setClassRule: PropTypes.func.isRequired,
    classRule: PropTypes.object.isRequired,
};

export default ClassDelaySetting;