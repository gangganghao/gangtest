import React, { Component } from 'react';
import PropTypes from 'prop-types';
import apiHelper from '../../../../api/apiHelper';
import { pagingOptions } from '../../../../constants/Constant';
import GrxPagingBar from '../../../common/GrxPagingBar.react';

class FingerprintList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pageLimit: 25
        };
    }

    componentDidMount() {
        const { actions, machineId } = this.props;
        actions.geFingerPrint({ device_id: machineId, current_page: 1, limit: this.state.pageLimit });
    }

    switchPage(currentPage, limit) {
        const { actions, machineId } = this.props;
        this.setState({ pageLimit: limit });
        actions.geFingerPrint({ device_id: machineId, current_page: currentPage, limit: limit });
    }

    render() {
        const { fingerprints } = this.props;
        const pagingInfo = {
            pageNum: this.state.pageLimit,
            pagingCount: Math.ceil(fingerprints.totalRecordCount / this.state.pageLimit),
            pagingIndex: fingerprints.currentPage,
            totalRecord: fingerprints.totalRecordCount
        };
        return (
            <div className="background-new">
                <div className="back-new-main">
                    <div className="clock-new-list">
                        <div className="clock-list-hd clearfix">
                            <h4><i className="iconfont icon-left-move"></i>已录指纹人员表</h4>
                        </div>
                        <div className="clock-list-table">
                            <table>
                                <tbody>
                                    <tr>
                                        <th>姓名</th>
                                        <th>手机</th>
                                        <th>部门</th>
                                        <th>职务</th>
                                        <th>直接上级</th>
                                    </tr>
                                    {!_.isEmpty(fingerprints.data) && fingerprints.data.map(item => {
                                        let userInfo = apiHelper.getUser(item.userId);
                                        let userLeaderArr = apiHelper.getUserLeaders(item.userId, 'sup', 2);
                                        let userLeaderInfo = !_.isEmpty(userLeaderArr) ? apiHelper.getUser(userLeaderArr[0]) : {};
                                        return (
                                            <tr>
                                                <td>
                                                    <span>{userInfo.name}</span>
                                                </td>
                                                <td><span>{userInfo.mobile}</span></td>
                                                <td><span>{userInfo.deptName}</span></td>
                                                <td><span>{userInfo.isManager ? '主管' : '--'}</span></td>
                                                <td><span>{userLeaderInfo.name}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <GrxPagingBar paging={pagingInfo} pagingOptions={pagingOptions} pagingFn={this.switchPage.bind(this)} />

                    </div>
                </div>
            </div>
        );
    }
}

FingerprintList.propTypes = {
    actions: PropTypes.object.isRequired,
    machineId: PropTypes.number.isRequired,
    fingerprints: PropTypes.array.isRequired,
};

export default FingerprintList;