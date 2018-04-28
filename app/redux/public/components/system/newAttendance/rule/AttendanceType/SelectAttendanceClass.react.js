import React, { Component } from 'react';
import PropTypes from "prop-types";
import apiHelper from '../../../../../api/apiHelper.js';

class SelectAttendanceClass extends Component {
    constructor(props) {
        super(props);
        let classArray = window.global.AttendanceClassProcessor.getAttendanceClasses().attendanceClasses;
        this.state = {
            keyWord: '',
            selectClassIds: props.selecteds||[],
            classArray:classArray,
            allClassArray:classArray
        }
    }
    submit(e) {
        let { selectClassIds } = this.state;
        if(_.isEmpty(selectClassIds)){
            apiHelper.error('请选择考勤班次',1500);
            return;
        }
        let { enterFunction } = this.props;
        enterFunction(selectClassIds);
    }
    
    getTimeAcrossName(type) {
        let retStr = '';
        switch (type) {
            case 0:
                retStr = '';
                break;
            case 1:
                retStr = '次日';
                break;
            case 2:
                retStr = '后天';
                break;
        }
        return retStr;
    }
    getSectionName(sections) {
        let retArray = [];
        if (!_.isEmpty(sections)) {
            sections.map((item) => {
                if (item.is_rest === 0)
                    retArray.push(`${this.getTimeAcrossName(item.start_time_across)}${item.start_time}-${this.getTimeAcrossName(item.end_time_across)}${item.end_time}`)
            }, this);
        }
        return retArray;
    }
    onSearchInputChange(e){
        var value = e.target.value;
        let classArray = window.global.AttendanceClassProcessor.getAttendanceClasses().attendanceClasses;
        if (!value) {
            this.setState({ keyWord: '', classArray });
        } else {
            let newClassArray = _.filter(classArray, (c) => _.includes(c.title, value));
            this.setState({ keyWord: value, classArray: newClassArray });
        }
    }
    onRowClick(id) {
        let { multiple } = this.props;
        let { selectClassIds, isAllChecked } = this.state;
        if (multiple) {//多选
            if (_.includes(selectClassIds, id)) {//取消勾选
                _.remove(selectClassIds, (t) => t === id);
                this.setState({ selectClassIds});
            } else {
                selectClassIds.push(id);
                this.setState({ selectClassIds });
            }
        } else {//单选
            !_.includes(selectClassIds, id)&&this.setState({ selectClassIds: [id] });
        }
    }
    isAllRowsChecked(selectedIds) {
        const { allClassArray } = this.state;
        return (
            allClassArray.length === selectedIds.length &&
            _.map(allClassArray, "id").every(value => _.includes(selectedIds, value)) // 列表的 id 是否和选中的 id 完全一致
        );
    }
    selectedAllRows(e){
        const { allClassArray,selectClassIds } = this.state;
        if(e.target.checked && _.isEmpty(selectClassIds)){//选中
            !_.isEmpty(allClassArray)&&this.setState({ selectClassIds:_.map(allClassArray, "id")});
        }else{
            this.setState({ selectClassIds:[]});
        }
    }
    render() {
        let { closeModal,multiple } = this.props;
        let { allClassArray,classArray,selectClassIds, } = this.state;
       let isAllChecked = this.isAllRowsChecked(selectClassIds);
       console.log('isAllChecked && selectClassIds.length',isAllChecked,selectClassIds);
        return (
            <div className="modal-content">
                <div className="modal-header">
                    <a onClick={closeModal} href="javascript:;" draggable="false" className="close"><i className="iconfont icon-delname"></i></a>
                    <h4 className="modal-title">选择班次</h4>
                </div>
                <div className="modal-body">
                    <div className="tool-box clearfix">
                        <div className="search-box">
                            <span className="inputbox">
                                <input className="form-control" type="text" placeholder="搜索班次名称" onChange={this.onSearchInputChange.bind(this)} ref='searchInput' />
                                <i className="iconfont icon-search"></i>
                            </span>
                        </div>
                    </div>
                    <div className="table-box clearfix">
                        <div className="table-cont">
                            <table>
                                <colgroup>
                                    <col width="2%" />
                                    <col width="18%" />
                                    <col width="80%" />
                                </colgroup>
                                <tbody>
                                    <tr>
                                        <th>
                                            {
                                                multiple ?
                                                    <input
                                                        type="checkbox"
                                                        className={(!isAllChecked && selectClassIds.length > 0) ? "select" : ""}
                                                        onChange={(e) => { this.selectedAllRows(e); }}
                                                        checked={isAllChecked}
                                                    />
                                                    : null
                                            }
                                        </th>
                                        <th>
                                            <span>班次名称</span>
                                        </th>
                                        <th>
                                            <span>考勤时间</span>
                                        </th>
                                    </tr>
                                    {
                                        !_.isEmpty(classArray) ? classArray.map((item, index) => {
                                            return (
                                                <tr onClick={this.onRowClick.bind(this,item.id)} key={index}>
                                                    <td>
                                                        {
                                                            multiple ?
                                                                <input
                                                                    type="checkbox"
                                                                    checked={_.includes(selectClassIds, item.id)}
                                                                />
                                                                :
                                                                <input
                                                                    type="radio"
                                                                    name="attendanceClass"
                                                                    checked={_.includes(selectClassIds, item.id)}
                                                                />
                                                        }
                                                    </td>
                                                    <td>
                                                        <span>{item.title}</span>
                                                    </td>
                                                    <td>
                                                        <span>{this.getSectionName(item.section).join(' ')}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                            :
                                            null
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={this.submit.bind(this)} className="btn btn-primary" value="submit">确定</button>
                    <button onClick={closeModal} type="button" className="btn btn-default">取消</button>
                </div>
            </div>
        );
    }
}

SelectAttendanceClass.propTypes = {
    closeModal: PropTypes.func,//关闭窗口
    enterFunction: PropTypes.func,//保存回调
    selecteds:PropTypes.array,//已选数据
    multiple:PropTypes.bool.isRequired,//是否支持多选
};
SelectAttendanceClass.defaultProps = {
    multiple: false
}
export default SelectAttendanceClass;