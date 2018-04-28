import React, { Component } from 'react';
import classNames from 'classnames';
import update from 'immutability-helper';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from "prop-types";
import * as actions from '../../../../actions/newSystemAttendance/RuleActions';
import apiHelper from '../../../../api/apiHelper.js';
import Loading from '../../../common/Loading.react';
import Fixed from './AttendanceType/Fixed.react';
import Free from './AttendanceType/Free.react';
import Schedule from './AttendanceType/Schedule.react';
import AddSsidAddress from './AddSsidAddress.react';
import AddressEdit from './AddressEdit.react';
import OverTimeRuleSelect from './OverTimeRuleSelect.react';
import Modal from 'react-modal';
import { ssidModalStyle, addressModalStyle, deptUserSelectModalStyle, customStyles } from '../../../../constants/Constant.js';
import DeptAndUserSelect from '../../../common/DeptAndUserSelect.react';
import { getOverTimeBaseInfo,getAttendanceRuleDataById } from '../../../../actions/newSystemAttendance/RuleActions';

/**
 * 新建/编辑考勤规则
 * 
 * @class CreateOrEdit
 * @extends {Component}
 */
class CreateOrEdit extends Component {
    constructor(props) {
        super(props);
        this.overTimeRuleArray = window.global.OvertimeRuleProcessor.getOvertimeRules().overtimeRules;
        let overTimeRuleInfo = _.find(this.overTimeRuleArray, { is_default: 1 });//默认的加班规则
        this.state = {
            ruleInfo: {
                default: true,//标识是否被填充过数据
                attendance_type: 1,//考勤类型(编辑规则不允许修改,需要置灰)允许值: 1固定班制, 2排班制, 3自由工时
                working_model: 1,//固定班制，工作日模式(固定班制必填)允许值: 1常规模式, 2大小周模式
                week_type: 2,//固定班制时，当前大小周
                working_date: {//固定班制时，工作日设置
                    big: [0, 0, 0, 0, 0, 0, 0],
                    small: [0, 0, 0, 0, 0, 0, 0],
                    general: [0, 0, 0, 0, 0, 0, 0],
                    class: [],//排班制， 班次Id
                    days: [],//自由工时，没勾选不传
                },
                when_photo: 1,//拍照需求
                can_outwork_attendance: 0,//是否允许外勤卡关联内勤卡 允许值: 1允许, 0不允许
                attendance_begin_time: '08:00',//新一天开始考勤时间（自由工时）
                max_supply_day: 5,
                max_supply_count: 5,
                holiday_auto_rest: 1,//固定班次的时候，法定节假日自动排休
                is_address_attendance: 1,//默认开启考勤地址
                overtime_rule_section_id: !_.isEmpty(overTimeRuleInfo) ? overTimeRuleInfo.id : 0
            },
            maxSupplyDaySetting: true,//最大补卡天数设置是否开启，默认为开启
            maxSupplyCountSetting: true,//最大补卡次数设置是否开启，默认为开启
            ruleInfoLoading: props.params.id > 0 ? true : false,
            isEdit: props.params.id > 0 ? true : false,
            isChange: false,
            sending: false,
            ssidSelectModalIsOpen: false,
            addressSelectModalIsOpen: false,
            editAddressInfo: null,//{currentIndex://当前编辑的索引, addressInfo:{address: '', address_xy: [], distance: 300}
            applicableUserSelectModalIsOpen: false,//考勤适用人员
            unApplicableUserSelectModalIsOpen: false,//无需考勤人员
            overTimeRuleSelectModalIsOpen: false,//考勤规则选择
            canOverTime: 0,//是否开启加班制度 1是 0否
        }
    }
    componentDidMount() {
        getOverTimeBaseInfo((err, overTimeBaseInfo) => {
            if (err) {
                apiHelper.error(err);
                return;
            }
            this.setState({ canOverTime: overTimeBaseInfo.can_overtime });
            let { params } = this.props;
            let { id } = params;
            id = parseInt(id);
            if (id > 0) {//编辑考勤规则
                getAttendanceRuleDataById(id, (err,ruleInfo) => {
                    if (!err) {
                        let maxSupplyDaySetting = false, maxSupplyCountSetting = false;
                        if (ruleInfo.max_supply_day > 0) {
                            maxSupplyDaySetting = true;
                        }
                        if (ruleInfo.max_supply_count > 0) {
                            maxSupplyCountSetting = true;
                        }
                        this.setState({ ruleInfoLoading: false, ruleInfo: ruleInfo, maxSupplyDaySetting, maxSupplyCountSetting });
                    } else {
                        apiHelper.error('该考勤规则已被删除', 3000);
                        let callBackUrl = this.props.location.query.callBackUrl || '/system/newattendance/basesetting';
                        if (_.startsWith(callBackUrl, '#')) {
                            callBackUrl = callBackUrl.substring(1, callBackUrl.length);
                        }
                        this.props.router.push({ pathname: callBackUrl });
                    }
                });
            }
        });
    }
    updateRuleInfo(key, value) {
        let { ruleInfo, isEdit } = this.state;
        if (isEdit && key === 'attendance_type') {
            apiHelper.error('不能编辑考勤类型');
            return;
        }
        let changeOptions = { [key]: value };
        this.setState({ ruleInfo: { ...ruleInfo, ...changeOptions }, isChange: true });
    }
    // region 选择路由
    updateSsidSelectModalIsOpenStatus(ssidSelectModalIsOpen) {
        this.setState({ ssidSelectModalIsOpen: ssidSelectModalIsOpen });
    }
    deleteWifi(index) {
        let { ruleInfo } = this.state;
        let newWifis = [];
        if (!_.isEmpty(ruleInfo.wifis)) {
            newWifis = update(ruleInfo.wifis, { $splice: [[index, 1]] });
        }
        this.updateRuleInfo('wifis', newWifis);
    }
    addSsid(wifiList) {
        let { ruleInfo } = this.state;
        let newWifis = [];
        if (!_.isEmpty(ruleInfo.wifis)) {
            newWifis = _.concat(ruleInfo.wifis, wifiList);
        } else {
            newWifis = wifiList;
        }
        this.updateRuleInfo('wifis', newWifis);
    }
    addRouterRender() {
        let { ssidSelectModalIsOpen, ruleInfo } = this.state;
        if (!ssidSelectModalIsOpen) {
            return null;
        }
        return (
            <Modal
                isOpen={true}
                style={ssidModalStyle}
                contentLabel={"addRouterRender"}
            >
                <AddSsidAddress
                    selectedWifiList={ruleInfo.wifis}
                    updateSsidSelectModalIsOpenStatus={this.updateSsidSelectModalIsOpenStatus.bind(this)}
                    addSsid={this.addSsid.bind(this)}
                />
            </Modal>
        );
    }
    // endregion

    // region 选择考勤地址
    /**
     * 打开/关闭添加考勤地点窗口
     * 
     * @param {bool} addressSelectModalIsOpen 
     * @param {object} editAddressInfo 编辑考勤数据 {currentIndex://当前编辑的索引, addressInfo:{address: '', address_xy: [], distance: 300}
     * @memberof CreateOrEdit
     */
    updateAddressSelectModalIsOpenStatus(addressSelectModalIsOpen, editAddressInfo) {
        if (addressSelectModalIsOpen) {
            editAddressInfo = editAddressInfo || { currentIndex: -1, addressInfo: { address: '', address_xy: [], distance: 300 } };
            this.setState({ addressSelectModalIsOpen: true, editAddressInfo: editAddressInfo });
        } else {
            this.setState({ addressSelectModalIsOpen: false, editAddressInfo: null });
        }
    }
    saveAddress(index, selectedInfo) {
        let { ruleInfo } = this.state;
        let newAddressArray = [];
        let addressObj = {
            address: selectedInfo.address,
            longitude: selectedInfo.address_xy[0],
            latitude: selectedInfo.address_xy[1],
            offset: selectedInfo.distance,
        }
        if (!_.isEmpty(ruleInfo.locations)) {
            if (~index) {//编辑
                newAddressArray = update(ruleInfo.locations, { $splice: [[index, 1, addressObj]] });
            } else {//新增
                newAddressArray = _.concat(ruleInfo.locations, addressObj);
            }
        } else {
            newAddressArray = [addressObj];
        }
        this.updateRuleInfo('locations', newAddressArray);
        this.updateAddressSelectModalIsOpenStatus(false, null);
    }
    editAddress(addressObj, index) {
        let editAddressInfo = {
            currentIndex: index,
            addressInfo: {
                address: addressObj.address,
                address_xy: [addressObj.longitude, addressObj.latitude],
                distance: addressObj.offset
            }
        };
        this.updateAddressSelectModalIsOpenStatus(true, editAddressInfo);
    }
    deleteAddress(index) {
        let { ruleInfo } = this.state;
        let newAddressArray = [];
        if (!_.isEmpty(ruleInfo.locations)) {
            newAddressArray = update(ruleInfo.locations, { $splice: [[index, 1]] });
        }
        this.updateRuleInfo('locations', newAddressArray);
    }
    addressSelectModalRender() {
        let { addressSelectModalIsOpen, editAddressInfo } = this.state;
        if (!addressSelectModalIsOpen) {
            return null;
        }
        return (
            <Modal
                isOpen={true}
                style={addressModalStyle}
                portalClassName="ReactModalPortalBmap"
                contentLabel="address Edit Modal"
            >
                <AddressEdit
                    closeModal={this.updateAddressSelectModalIsOpenStatus.bind(this, false)}
                    saveFunc={this.saveAddress.bind(this)}
                    // edit={{address: '', address_xy: [], distance: 300}}
                    edit={editAddressInfo.addressInfo}
                    isNew={editAddressInfo.currentIndex === -1}
                    currentIndex={editAddressInfo.currentIndex}
                    readonly={false}
                />
            </Modal>
        )
    }
    // endregion

    // region 考勤适用部门和人员
    deleteApplicableUser(index) {
        let { ruleInfo } = this.state;
        let newUserArray = [];
        if (!_.isEmpty(ruleInfo.applicable_user)) {
            newUserArray = update(ruleInfo.applicable_user, { $splice: [[index, 1]] });
        }
        this.updateRuleInfo('applicable_user', newUserArray);
    }
    selectApplicableUser(selectItems) {
        let applicableUsers = [];
        if (!_.isEmpty(selectItems)) {//relation_type:1部门 2个人
            if (!_.isEmpty(selectItems.dept)) {
                selectItems.dept.map((deptId) => {
                    applicableUsers.push({ relation_type: 1, relation_id: deptId });
                });
            }
            if (!_.isEmpty(selectItems.user)) {
                selectItems.user.map((userId) => {
                    applicableUsers.push({ relation_type: 2, relation_id: userId });
                });
            }
        }
        this.updateRuleInfo('applicable_user', applicableUsers);
        this.setState({ applicableUserSelectModalIsOpen: false });
    }
    applicableUserSelectModalRender() {
        let { applicableUserSelectModalIsOpen, ruleInfo } = this.state;
        if (!applicableUserSelectModalIsOpen) {
            return null;
        }
        let selectedItems = {};
        if (!_.isEmpty(ruleInfo.applicable_user)) {
            selectedItems = { dept: [], user: [] };
            ruleInfo.applicable_user.map((item) => {
                if (item.relation_type === 2) {
                    selectedItems.user.push(item.relation_id);
                } else if (item.relation_type === 1) {
                    selectedItems.dept.push(item.relation_id);
                }
            })
        }
        return (
            <Modal
                isOpen={true}
                style={deptUserSelectModalStyle}
                portalClassName="applicableUserSelectModal"
                contentLabel="applicable user Modal"
            >
                <DeptAndUserSelect
                    selType="all"
                    multiSelect={true}
                    allowEmpty={true}
                    selectedItems={selectedItems}
                    prohibitRemoveUsers={[]}
                    prohibitRemoveDepts={[]}
                    closeModal={() => { this.setState({ applicableUserSelectModalIsOpen: false }) }}
                    enterFunc={this.selectApplicableUser.bind(this)}
                />
            </Modal>
        )
    }
    // endregion

    // region 无需考勤人员
    deleteUnApplicableUser(index) {
        let { ruleInfo } = this.state;
        let newUserArray = [];
        if (!_.isEmpty(ruleInfo.unapplicable_user)) {
            newUserArray = update(ruleInfo.unapplicable_user, { $splice: [[index, 1]] });
        }
        this.updateRuleInfo('unapplicable_user', newUserArray);
    }
    selectUnApplicableUser(selectItems) {
        this.updateRuleInfo('unapplicable_user', selectItems || []);
        this.setState({ unApplicableUserSelectModalIsOpen: false });
    }
    unApplicableUserSelectModalRender() {
        let { unApplicableUserSelectModalIsOpen, ruleInfo } = this.state;
        if (!unApplicableUserSelectModalIsOpen) {
            return null;
        }
        return (
            <Modal
                isOpen={true}
                style={deptUserSelectModalStyle}
                portalClassName="unapplicableUserSelectModal"
                contentLabel="unapplicable user Modal"
            >
                <DeptAndUserSelect
                    selType="user"
                    multiSelect={true}
                    allowEmpty={true}
                    selectedItems={ruleInfo.unapplicable_user}
                    closeModal={() => { this.setState({ unApplicableUserSelectModalIsOpen: false }) }}
                    enterFunc={this.selectUnApplicableUser.bind(this)}
                />
            </Modal>
        )
    }
    // endregion

    // region 选择加班规则
    overTimeRuleSave(selectedRuleId) {
        this.updateRuleInfo('overtime_rule_section_id', selectedRuleId);
        this.setState({ overTimeRuleSelectModalIsOpen: false });
    }
    overTimeRuleSelectModalRender() {
        let { overTimeRuleSelectModalIsOpen, ruleInfo } = this.state;
        if (!overTimeRuleSelectModalIsOpen) {
            return null;
        }
        return (
            <Modal
                isOpen={true}
                style={customStyles}
                portalClassName="overTimeRuleSelectModalIsOpen"
                contentLabel="overTime Rule Modal"
            >
                <OverTimeRuleSelect
                    closeModal={() => { this.setState({ overTimeRuleSelectModalIsOpen: false }) }}
                    enterFunction={this.overTimeRuleSave.bind(this)}
                    selectedId={ruleInfo.overtime_rule_section_id}
                />
            </Modal>
        )
    }
    getRuleApproveTypeDesc(ruleApproveType) {
        let retStr = '';
        switch (ruleApproveType) {
            case 1:
                retStr = '需审批，以审批单位为准';
                break;
            case 2:
                retStr = '需审批，以打卡为准，但不能超过审批时长';
                break;
            case 3:
                retStr = '无需审批，根据打卡时间计算加班时长';
                break;
        }
        return retStr;
    }
    // endregion

    cancleClick() {
        let { location, params, router } = this.props;
        let callBackUrl = location.query.callBackUrl || '/system/newattendance/basesetting';
        if (_.startsWith(callBackUrl, '#')) {
            callBackUrl = callBackUrl.substring(1, callBackUrl.length);
        }
        router.push({ pathname: callBackUrl });
    }
    onSubmit(saveType, e) {
        let { ruleInfo, sending, isChange, isEdit, maxSupplyDaySetting, maxSupplyCountSetting,canOverTime } = this.state;
        if (sending || !isChange) return;
        this.setState({ sending: true });
        if (_.isEmpty(ruleInfo.title)) {
            apiHelper.error('请填写考勤规则名字', 1500);
            this.setState({ sending: false });
            return;
        }
        if (_.isEmpty(ruleInfo.applicable_user)) {
            apiHelper.error('请选择考勤适用人员', 1500);
            this.setState({ sending: false });
            return;
        }
        //补卡设置，复选框没选中，两个值传0，复选框选中的话，里面的值填大于0的整数

        if (!ruleInfo.is_address_attendance && !ruleInfo.is_wifi_attendance) {
            apiHelper.error('请选择考勤方式', 1500);
            this.setState({ sending: false });
            return;
        }
        if (ruleInfo.is_address_attendance && _.isEmpty(ruleInfo.locations)) {//考勤地址打开，但是考勤地址数据为空
            apiHelper.error('请添加考勤地址', 1500);
            this.setState({ sending: false });
            return;
        }
        if (ruleInfo.is_wifi_attendance && _.isEmpty(ruleInfo.wifis)) {//wifi考勤打开，但是wifi地址数据为空
            apiHelper.error('请添加wifi地址', 1500);
            this.setState({ sending: false });
            return;
        }
        if (ruleInfo.attendance_type === 2 && _.isEmpty(ruleInfo.working_date.class)) {//排班制必须要选择考勤班次
            apiHelper.error('请选择考勤班次', 1500);
            this.setState({ sending: false });
            return;
        }
        let reg = /^[1-9]\d*$/;
        if (maxSupplyDaySetting) {
            if (!reg.test(ruleInfo.max_supply_day)) {
                apiHelper.error('异常后最大补卡天数输入有误', 1500);
                this.setState({ sending: false });
                return;
            }
        }
        if (maxSupplyCountSetting) {
            if (!reg.test(ruleInfo.max_supply_count)) {
                apiHelper.error('一个月最大补卡次数输入有误', 1500);
                this.setState({ sending: false });
                return;
            }
        }
        let saveInfo = {
            title: ruleInfo.title,
            applicable_user: ruleInfo.applicable_user,
            unapplicable_user: ruleInfo.unapplicable_user,
            max_supply_day: ruleInfo.max_supply_day, //最大补卡天数
            max_supply_count: ruleInfo.max_supply_count, //最多补卡天数

            when_photo: ruleInfo.when_photo,//拍照需求
            can_outwork_attendance: ruleInfo.can_outwork_attendance,
            attendance_type: ruleInfo.attendance_type,//考勤类型
            is_address_attendance: ruleInfo.is_address_attendance || 0,
            is_wifi_attendance: ruleInfo.is_wifi_attendance || 0,

        };
        if (ruleInfo.is_address_attendance && !_.isEmpty(ruleInfo.locations)) {//考勤地址考勤
            saveInfo.locations = ruleInfo.locations;
        }
        if (ruleInfo.is_wifi_attendance && !_.isEmpty(ruleInfo.wifis)) {//wifi考勤
            saveInfo.wifis = ruleInfo.wifis;
            saveInfo.can_auto_wifi_attendance = ruleInfo.can_auto_wifi_attendance;//WiFi自动打卡
        }
        if (ruleInfo.attendance_type === 1) {//固定班制
            saveInfo.working_model = ruleInfo.working_model;
            saveInfo.working_date = {};//考勤班次
            if (ruleInfo.working_model === 1) {//常规模式
                saveInfo.working_date.general = ruleInfo.working_date.general;
            } else if (ruleInfo.working_model === 2) {//大小周
                saveInfo.working_date.big = ruleInfo.working_date.big;
                saveInfo.working_date.small = ruleInfo.working_date.small;
                saveInfo.week_type = ruleInfo.week_type;
            }
            saveInfo.holiday_auto_rest = ruleInfo.holiday_auto_rest;
            saveInfo.need_check_date = ruleInfo.need_check_date;
            saveInfo.no_check_date = ruleInfo.no_check_date;
            if (canOverTime)
                saveInfo.overtime_rule_section_id = ruleInfo.overtime_rule_section_id;//加班规则

        } else if (ruleInfo.attendance_type === 2) {//排班制
            saveInfo.working_date = {};//考勤班次
            saveInfo.working_date.class = ruleInfo.working_date.class;
            if (canOverTime)
                saveInfo.overtime_rule_section_id = ruleInfo.overtime_rule_section_id;//加班规则
        } else if (ruleInfo.attendance_type === 3) {//自由工时
            saveInfo.working_date = {};//考勤班次
            saveInfo.working_date.days = ruleInfo.working_date.days;
            saveInfo.attendance_begin_time = ruleInfo.attendance_begin_time;//新一天开始考勤时间（自由工时）
            saveInfo.min_work_time = ruleInfo.min_work_time || 0;
        }
        if (maxSupplyDaySetting) {//异常补卡天数未开启的情况下，传0，其他时候传大于等于0的数据
            saveInfo.max_supply_day = ruleInfo.max_supply_day;
        } else {
            saveInfo.max_supply_day = 0;
        }
        if (maxSupplyCountSetting) {//异常补卡次数未开启的情况下，传0，其他时候传大于等于0的数据
            saveInfo.max_supply_count = ruleInfo.max_supply_count;
        } else {
            saveInfo.max_supply_count = 0;
        }
        apiHelper.confirm({
            title: '提示',
            msg: '是否立即生效',
            fun1: () => {
                saveInfo.is_effect_now = 1;
                this.saveAttendanceRuleData(saveInfo, isEdit, saveType);
            },
            btn1Text: "立即生效",
            fun2: () => {
                saveInfo.is_effect_now = 0;
                this.saveAttendanceRuleData(saveInfo, isEdit, saveType);
            },
            btn2Text: "次日生效"
        });
    }
    /**
     * 保存数据
     * 
     * @param {object} saveInfo 待保存的数据
     * @param {bool} isEdit 是否是编辑
     * @param {string} saveType 'goto':保存并继续排班，
     * @memberof CreateOrEdit
     */
    saveAttendanceRuleData(saveInfo, isEdit, saveType) {
        let { updateEditScheduleModalIsOpenStatus } = this.props;
        const saveCallBack = (err, data) => {
            if (err) {
                this.setState({ sending: false });
                apiHelper.error("考勤规则保存出错", 1500);
                return;
            } else {
                this.setState({ sending: false, isChange: false });
                apiHelper.info("保存成功", 1500);
                if (_.has(data, 'overtime_closed') && data.overtime_closed === 1) {//在操作考勤规则的时候，后台的加班制度被关闭了的情况下，弹出此提示
                    apiHelper.confirm({
                        title: '提示',
                        msg: '加班制度已被关闭，此次的加班规则会被重置为默认',
                        fun1: () => {
                            if (saveType === 'goto') {
                                updateEditScheduleModalIsOpenStatus(true, data.rule_id);
                            }
                            setTimeout(this.cancleClick.bind(this),500)
                            return;
                        },
                        btn1Text: "确定"
                    });
                } else {
                    if (saveType === 'goto') {
                        updateEditScheduleModalIsOpenStatus(true, data.rule_id);
                    }
                    setTimeout(this.cancleClick.bind(this),500)
                    // this.cancleClick();
                }
            }
        }
        if (isEdit) {
            this.props.actions.updateAttendanceRule(this.props.params.id, saveInfo, saveCallBack);
        } else {
            this.props.actions.addAttendanceRule(saveInfo, saveCallBack);
        }
    }
    render() {
        let { ruleInfoLoading, isEdit, isChange, sending, ruleInfo, maxSupplyDaySetting, maxSupplyCountSetting, canOverTime } = this.state;
        let overTimeRuleInfo = null;
        if (ruleInfo.overtime_rule_section_id) {
            overTimeRuleInfo = _.find(this.overTimeRuleArray, { id: ruleInfo.overtime_rule_section_id });
        }
        console.log('ruleInfo.title',ruleInfo.title);
        return (
            <div className="background-new">
                <div className="back-new-hd"><h3>{isEdit ? '编辑' : '新建'}考勤规则</h3></div>
                <div className="back-new-main">
                    {
                        ruleInfoLoading ?
                            <Loading />
                            :
                            <div className="back-clock-new">
                                <div className="clock-form-menu">
                                    <h4>1、考勤规则名称</h4>
                                    <input
                                        onChange={(e) => { this.updateRuleInfo('title', e.target.value); }}
                                        value={ruleInfo.title}
                                        type="text"
                                        className="form-control name-long"
                                    />
                                </div>
                                <div className="clock-form-menu">
                                    <h4>2、适用部门及人员</h4>
                                    <dl className="back-edit-head clearfix">
                                        <dd onClick={() => { this.setState({ applicableUserSelectModalIsOpen: true }); }}>
                                            <span><i className="iconfont icon-add"></i></span><strong>添加</strong>
                                        </dd>
                                        {
                                            !_.isEmpty(ruleInfo.applicable_user) ?
                                                ruleInfo.applicable_user.map((item, index) => {
                                                    if (item.relation_type === 2) {//个人
                                                        let userInfo = apiHelper.getCurrentUser(item.relation_id);
                                                        if (_.isEmpty(userInfo)) {
                                                            return null;
                                                        }
                                                        return (
                                                            <dd key={index}>
                                                                <span>
                                                                    <img src={userInfo.src} />
                                                                    <i onClick={this.deleteApplicableUser.bind(this, index)} className="iconfont icon-delname"></i>
                                                                </span>
                                                                <strong>{userInfo.name}</strong>
                                                            </dd>
                                                        )
                                                    } else if (item.relation_type === 1) {//部门
                                                        let deptInfo = apiHelper.getDept(item.relation_id);
                                                        if (_.isEmpty(deptInfo)) {
                                                            return null;
                                                        }
                                                        let imgGroups = [];
                                                        if (!_.isEmpty(deptInfo.members)) {
                                                            for (var i = 0; i < 4; i++) {
                                                                let tempUserId = deptInfo.members[i];
                                                                if (!tempUserId) break;
                                                                imgGroups.push(<img src={window.global.ImageCache.getHeadImageUrl(tempUserId)} />);
                                                            }
                                                        }
                                                        return (
                                                            <dd key={index}>
                                                                <span>
                                                                    {
                                                                        !_.isEmpty(imgGroups) ?
                                                                            <em className="user-group">
                                                                                {imgGroups}
                                                                            </em>
                                                                            :
                                                                            <img src='../image/zu.png' />
                                                                    }
                                                                    <i onClick={this.deleteApplicableUser.bind(this, index)} className="iconfont icon-delname"></i>
                                                                </span>
                                                                <strong>{deptInfo.dName}</strong>
                                                            </dd>
                                                        )
                                                    }
                                                    return null;

                                                })
                                                :
                                                null
                                        }
                                    </dl>
                                </div>
                                <div className="clock-form-menu">
                                    <h4>3、无需考勤人员</h4>
                                    <dl className="back-edit-head clearfix">
                                        <dd onClick={() => { this.setState({ unApplicableUserSelectModalIsOpen: true }); }}>
                                            <span><i className="iconfont icon-add"></i></span><strong>添加</strong>
                                        </dd>
                                        {
                                            !_.isEmpty(ruleInfo.unapplicable_user) ?
                                                ruleInfo.unapplicable_user.map((userId, index) => {
                                                    let userInfo = apiHelper.getCurrentUser(userId);
                                                    if (_.isEmpty(userInfo)) {
                                                        return null;
                                                    }
                                                    return (
                                                        <dd key={index}>
                                                            <span>
                                                                <img src={userInfo.src} />
                                                                <i onClick={this.deleteUnApplicableUser.bind(this, index)} className="iconfont icon-delname"></i>
                                                            </span>
                                                            <strong>{userInfo.name}</strong>
                                                        </dd>
                                                    )
                                                })
                                                :
                                                null
                                        }
                                    </dl>
                                </div>

                                <div className="clock-form-menu">
                                    <h4>4、考勤类型</h4>
                                    <div className="clock-rule-type">
                                        <label><input type="radio" name="attendance_type" defaultChecked={ruleInfo.attendance_type === 1 ? 'defaultChecked' : ''} onChange={(e) => { this.updateRuleInfo('attendance_type', 1); }} />固定班制 (每天考勤时间一样)<em>适用于：IT、金融、文化传媒、事业单位、教育培训等行业</em></label>
                                        <label><input type="radio" name="attendance_type" defaultChecked={ruleInfo.attendance_type === 2 ? 'defaultChecked' : ''} onChange={(e) => { this.updateRuleInfo('attendance_type', 2); }} />排班制 (自定义设置考勤时间)<em>适用于：餐饮、制造、物流贸易、客户服务、医院等行业</em></label>
                                        <label><input type="radio" name="attendance_type" defaultChecked={ruleInfo.attendance_type === 3 ? 'defaultChecked' : ''} onChange={(e) => { this.updateRuleInfo('attendance_type', 3); }} />自由工时(不设置班次，随时打卡)<em>适用于：班次没有规律，装修，家政，物流等计算工作时长的行业</em></label>
                                    </div>
                                </div>
                                {
                                    ruleInfo.attendance_type === 1 ?
                                        <Fixed
                                            ruleInfo={ruleInfo}
                                            updateRuleInfo={this.updateRuleInfo.bind(this)}
                                        />
                                        :
                                        ruleInfo.attendance_type === 2 ?
                                            <Schedule
                                                ruleInfo={ruleInfo}
                                                updateRuleInfo={this.updateRuleInfo.bind(this)}
                                            />
                                            : ruleInfo.attendance_type === 3 ?
                                                <Free
                                                    ruleInfo={ruleInfo}
                                                    updateRuleInfo={this.updateRuleInfo.bind(this)}
                                                />
                                                :
                                                null
                                }
                                <div className="clock-form-menu">
                                    <h4>{ruleInfo.attendance_type === 1 ? 7 : 6}、考勤方式</h4>
                                    <div className="clock-rule-ways">
                                        <div className="clock-way-site">
                                            <span>考勤地址</span>
                                            <div className="checkbox-item sm-checkbox">
                                                <input type="checkbox" id="is_address_attendance" defaultChecked={ruleInfo.is_address_attendance === 1 ? 'defaultChecked' : ''} onChange={(e) => { this.updateRuleInfo('is_address_attendance', e.target.checked ? 1 : 0); }} />
                                                <label htmlFor="is_address_attendance"></label>
                                            </div>
                                            {
                                                ruleInfo.is_address_attendance === 1 ?
                                                    <div className="clock-site-list">
                                                        {
                                                            !_.isEmpty(ruleInfo.locations) ?
                                                                <ul>
                                                                    {
                                                                        ruleInfo.locations.map((item, index) => {
                                                                            return (
                                                                                <li key={index}>
                                                                                    <span>
                                                                                        {item.address}
                                                                                        <em>(有效范围：{item.offset}米)</em>
                                                                                    </span>
                                                                                    <div className="clock-workope">
                                                                                        <a onClick={this.editAddress.bind(this, item, index)} href="javascript:;" draggable='false' className="edit"><i className="iconfont icon-edit"></i>编辑</a>
                                                                                        <a onClick={this.deleteAddress.bind(this, index)} href="javascript:;" draggable='false' className="del"><i className="iconfont icon-delete"></i>删除</a>
                                                                                    </div>
                                                                                </li>
                                                                            );
                                                                        })
                                                                    }
                                                                </ul>
                                                                :
                                                                null
                                                        }
                                                        <a onClick={this.updateAddressSelectModalIsOpenStatus.bind(this, true, null)} href="javascript:;" draggable='false'>+ 添加考勤地点</a>
                                                    </div>
                                                    :
                                                    null
                                            }

                                        </div>
                                        <div className="clock-way-site">
                                            <span>Wifi考勤</span>
                                            <div className="checkbox-item sm-checkbox">
                                                <input type="checkbox" id="is_wifi_attendance" defaultChecked={ruleInfo.is_wifi_attendance === 1 ? 'defaultChecked' : ''} onChange={(e) => { this.updateRuleInfo('is_wifi_attendance', e.target.checked ? 1 : 0); }} />
                                                <label htmlFor="is_wifi_attendance"></label>
                                            </div>
                                            {
                                                ruleInfo.is_wifi_attendance === 1 ?
                                                    <div className="clock-site-list">
                                                        {
                                                            !_.isEmpty(ruleInfo.wifis) ?
                                                                <ul>
                                                                    {
                                                                        ruleInfo.wifis.map((item, index) => {
                                                                            return (
                                                                                <li key={index}>
                                                                                    <span>
                                                                                        {item.ssid_name}
                                                                                        <em>({item.ssid_mac})</em>
                                                                                    </span>
                                                                                    <div className="clock-workope">
                                                                                        <a onClick={this.deleteWifi.bind(this, index)} href="javascript:;" draggable='false' className="del"><i className="iconfont icon-delete"></i>删除</a>
                                                                                    </div>
                                                                                </li>
                                                                            );
                                                                        })
                                                                    }
                                                                </ul>
                                                                :
                                                                null
                                                        }

                                                        <a onClick={this.updateSsidSelectModalIsOpenStatus.bind(this, true)} href="javascript:;" draggable='false'>+ 添加wifi考勤</a>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                defaultChecked={ruleInfo.can_auto_wifi_attendance === 1 ? 'defaultChecked' : ''}
                                                                onChange={(e) => { this.updateRuleInfo('can_auto_wifi_attendance', e.target.checked ? 1 : 0); }}
                                                            />
                                                            wifi自动快速打卡<em>(仅对第1次上班打卡有效)</em>
                                                        </label>
                                                    </div>
                                                    :
                                                    null
                                            }
                                        </div>
                                        <div className="clock-way-site">
                                            <span>拍照要求</span>
                                            <label><input type="radio" name="tack" defaultChecked={ruleInfo.when_photo === 1 ? 'defaultChecked' : ''} onChange={(e) => { this.updateRuleInfo('when_photo', 1); }} />不强制拍照</label>
                                            <label><input type="radio" name="tack" defaultChecked={ruleInfo.when_photo === 2 ? 'defaultChecked' : ''} onChange={(e) => { this.updateRuleInfo('when_photo', 2); }} />强制拍照</label>
                                            <label><input type="radio" name="tack" defaultChecked={ruleInfo.when_photo === 3 ? 'defaultChecked' : ''} onChange={(e) => { this.updateRuleInfo('when_photo', 3); }} />位置异常后拍照</label>
                                        </div>
                                        <div className="clock-way-site">
                                            <span>内勤签到、签退卡是否允许关联外勤卡</span>
                                            <label><input type="radio" name="can_outwork_attendance" defaultChecked={ruleInfo.can_outwork_attendance === 1 ? 'defaultChecked' : ''} onChange={(e) => { this.updateRuleInfo('can_outwork_attendance', 1); }} />允许</label>
                                            <label><input type="radio" name="can_outwork_attendance" defaultChecked={ruleInfo.can_outwork_attendance === 0 ? 'defaultChecked' : ''} onChange={(e) => { this.updateRuleInfo('can_outwork_attendance', 0); }} />不允许</label>
                                        </div>
                                    </div>
                                </div>
                                {
                                    _.includes([1, 2], ruleInfo.attendance_type) ?
                                        <div className="clock-form-menu">
                                            <h4>{ruleInfo.attendance_type === 1 ? 8 : 7}、补卡设置<em>(出现迟到、早退、旷工、忘记打卡等情况的时候可以进行补卡)</em></h4>
                                            <div className="clock-rule-one">
                                                <input
                                                    type="checkbox"
                                                    checked={maxSupplyDaySetting}
                                                    onChange={(e) => { this.setState({ maxSupplyDaySetting: e.target.checked }); }}
                                                />
                                                出现异常之后
                                                <input type="number"
                                                    className="form-control"
                                                    value={ruleInfo.max_supply_day || ''}
                                                    onChange={(e) => { this.updateRuleInfo('max_supply_day', e.target.value); }}
                                                    disabled={!maxSupplyDaySetting}
                                                />
                                                天内可以进行补卡
                                            </div>
                                            <div className="clock-rule-one">
                                                <input
                                                    type="checkbox"
                                                    checked={maxSupplyCountSetting}
                                                    onChange={(e) => { this.setState({ maxSupplyCountSetting: e.target.checked }); }}
                                                />
                                                一个月可以补卡
                                                <input type="number"
                                                    className="form-control"
                                                    value={ruleInfo.max_supply_count || ''}
                                                    onChange={(e) => { this.updateRuleInfo('max_supply_count', e.target.value); }}
                                                    disabled={!maxSupplyCountSetting}
                                                />次
                                            </div>
                                        </div>
                                        :
                                        null
                                }
                                {
                                    canOverTime && _.includes([1, 2], ruleInfo.attendance_type) ?
                                        <div className="clock-form-menu">
                                            <h4>{ruleInfo.attendance_type === 1 ? 9 : 8}、加班规则</h4>
                                            {
                                                ruleInfo.overtime_rule_section_id && !_.isEmpty(overTimeRuleInfo)
                                                    ?
                                                    <div className="clock-over-work">
                                                        <span>{overTimeRuleInfo.overtime_rule_title}
                                                            <a onClick={() => { this.setState({ overTimeRuleSelectModalIsOpen: true }); }} href="javascript:;" draggable='false' >更改</a>
                                                            <a onClick={() => { this.updateRuleInfo('overtime_rule_section_id', 0); }} href="javascript:;" draggable='false' >清除</a>
                                                        </span>
                                                        <p>工作日：{this.getRuleApproveTypeDesc(overTimeRuleInfo.approve_type)}</p>
                                                        <p>休息日和节假日：{this.getRuleApproveTypeDesc(overTimeRuleInfo.holiday_approve_type)}</p>
                                                    </div>
                                                    :
                                                    <a onClick={() => { this.setState({ overTimeRuleSelectModalIsOpen: true }); }} href="javascript:;" draggable='false' className="btn-white-blue">+添加加班规则</a>
                                            }
                                        </div>
                                        :
                                        null
                                }
                            </div>
                    }
                </div>
                <div className="back-new-foot clearfix">
                    <div className="fr">
                        {
                            ruleInfo.attendance_type === 2 ? <a onClick={this.onSubmit.bind(this, 'goto')} disabled={sending || !isChange} href="javascript:;" draggable='false' className="btn btn-primary">保存并继续排班</a> : null
                        }
                        <a onClick={this.onSubmit.bind(this, '')} disabled={sending || !isChange} href="javascript:;" draggable='false' className="btn btn-primary">保存</a>
                        <a onClick={this.cancleClick.bind(this)} href="javascript:;" draggable='false' className="btn btn-default">取消</a>
                    </div>
                </div>
                {this.addRouterRender()}
                {this.addressSelectModalRender()}
                {this.applicableUserSelectModalRender()}
                {this.unApplicableUserSelectModalRender()}
                {this.overTimeRuleSelectModalRender()}
            </div>
        );
    }
}
const mapStateToProps = (state) => ({
    ruleInfo: state.rule.ruleInfo
});
const mapDispatchToProps = (dispatch) => ({
    actions: bindActionCreators(actions, dispatch),
    dispatch: dispatch
});
CreateOrEdit.propTypes = {
    // ruleId:PropTypes.number.isRequired,
    ruleInfo: PropTypes.object,
    actions: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    updateEditScheduleModalIsOpenStatus: PropTypes.func.isRequired,//该函数是从父组件自动传进来的，不必手动处理
};
export default connect(mapStateToProps, mapDispatchToProps)(CreateOrEdit);
