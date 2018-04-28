import PropTypes from 'prop-types';
import React, { Component } from 'react';
import apiHelper from '../../../../api/apiHelper.js';
import Loading from '../../../common/Loading.react';
var wifiscanner = require('node-wifiscanner');

class AddSsidAddress extends Component {
    constructor(props) {
        super(props);
        this.state = {
            wifiList: [],
            saving: false,
            loading: true,
            error: "", //无法获取Wifi的出错提示
        };
    }

    retryScan() {
        let self = this;
        let selectedWifiList = this.props.selectedWifiList;
        wifiscanner.scan(function (err, data) {
            if (err) {
                self.setState({ loading: false, error: "获取wifi mac错误， 请确认此设备是否支持并开启了无线网络连接" });
                return;
            }
            if (data && data.length > 0) {
                if (selectedWifiList && selectedWifiList.length > 0) {
                    let otherWifiList = [];
                    data.map((item) => {
                        if (_.findIndex(selectedWifiList, (s) => { return s.ssid_mac == item.mac; }) > -1) {
                            return;
                        }
                        otherWifiList.push(item);
                    });
                    self.setState({ wifiList: otherWifiList });
                } else {
                    self.setState({ wifiList: data });
                }
            }
            self.setState({ loading: false, error: "" });
        });
    }

    componentDidMount() {
        this.retryScan();
    }

    selectWifi(e, mac) {
        let { wifiList } = this.state;
        let index = _.findIndex(wifiList, (item) => { return item.mac === mac });
        if (index > -1) {
            let newWifiList = _.set(wifiList, [index, 'selected'], e.target.checked);
            this.setState({ wifiList: newWifiList });
        }
    }

    saveWifi() {
        let selectedWifi = [];
        let { wifiList, saving } = this.state;
        this.setState({ saving: true });
        if (_.isEmpty(wifiList)) {
            this.props.updateSsidSelectModalIsOpenStatus(false);
            return;
        }
        if (saving) {
            apiHelper.error("正在保存路由器地址，请稍后",  3000);
            return;
        }
        if (wifiList && wifiList.length > 0) {
            selectedWifi = _.filter(wifiList, (item) => { return item.selected; });
        }
        if (_.isEmpty(selectedWifi) && !_.isEmpty(wifiList)) {
            apiHelper.error("请选择路由器地址", 3000);
            return;
        }
        let wifis = selectedWifi.map((item) => { return { ssid_name: item.ssid, ssid_mac: item.mac } });
        this.props.addSsid(wifis);
        this.props.updateSsidSelectModalIsOpenStatus(false);
        this.setState({ saving: false });
    }

    render() {
        let { updateSsidSelectModalIsOpenStatus } = this.props;
        let { wifiList, loading } = this.state;
        return (
            <div className="modal-dialog dialog-router">
                <div className="modal-content">
                    <div className="modal-header">
                        <a onClick={() => { updateSsidSelectModalIsOpenStatus(false); }} href="javascript:;" draggable="false" className="close" >
                            <i className="iconfont icon-delname"></i>
                        </a>
                        <h4 className="modal-title">添加路由器</h4>
                    </div>
                    <div className="modal-body">
                        <div className="back-add-router" style={{ height: "calc(100% - 22px)" }}>
                            {
                                loading ? <Loading /> :
                                    wifiList && wifiList.length > 0 ?
                                        <ul>
                                            {
                                                (wifiList && wifiList.length > 0) ? wifiList.map((item, key) => {
                                                    return (
                                                        <li key={key}>
                                                            <label>
                                                                <p>{item.ssid}<em>{item.mac}</em></p>
                                                                <input
                                                                    type='checkbox'
                                                                    value=""
                                                                    defaultChecked={item.selected || false}
                                                                    onChange={(e) => { this.selectWifi(e, item.mac); }}
                                                                />
                                                            </label>
                                                        </li>
                                                    )
                                                }) : null
                                            }
                                        </ul>
                                        :
                                        <div className="back-dimi-unknown">
                                            <i className="iconfont icon-inbox"></i>
                                            <p>{this.state.error || "没有搜索到其他路由器，请尝试在任务栏右下角先打开无线网络列表后重试"}<br /></p>
                                            <a onClick={this.retryScan.bind(this)} href="javascript:;" draggable="false" className="btn btn-default">重试</a>
                                        </div>
                            }
                        </div>
                    </div>
                    <div className="modal-footer">
                        <a onClick={this.saveWifi.bind(this)} href="javascript:;" draggable="false" className="btn btn-primary" disabled={loading || wifiList.length == 0}>添加</a>
                        <a onClick={() => { updateSsidSelectModalIsOpenStatus(false) }} href="javascript:;" draggable="false" className="btn btn-default">取消</a>
                    </div>
                </div>
            </div>
        )
    }
}
AddSsidAddress.propTypes = {
    selectedWifiList: PropTypes.array,
    addSsid: PropTypes.func.isRequired,
    updateSsidSelectModalIsOpenStatus: PropTypes.func.isRequired,
};
export default AddSsidAddress;