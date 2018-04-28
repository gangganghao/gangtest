import PropTypes from 'prop-types';
import React, { Component } from 'react';
import apiHelper from '../../../../api/apiHelper.js';

class UsersView extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }
    render() {
        let { closeModal, ruleUsers } = this.props;
        let userInfoArray = apiHelper.getUserInfo(ruleUsers,null);
        return (
            <div className="modal-content">
                <div className="modal-header">
                    <a onClick={closeModal} href="javascript:;" draggable="false" className="close">
                        <i className="iconfont icon-delname"></i>
                    </a>
                    <h4 className="modal-title">适用人员</h4>
                </div>
                <div className="modal-body">
                    {
                        !_.isEmpty(userInfoArray) ?
                            <ul className="groups-member view-owner">
                                {
                                    userInfoArray.map((user, index) => {
                                        let headImg = window.global.ImageCache.getHeadImageUrl(user.id);
                                        return (
                                            <li key={index}>
                                                <div className="member-head">
                                                    <img src={headImg} />
                                                </div>
                                                <p>{user.username}</p>
                                            </li>
                                        );
                                    })
                                }
                            </ul>
                            :
                            null
                    }

                </div>
                <div className="modal-footer">
                    <button onClick={closeModal} type="button" className="btn btn-default">关闭</button>
                </div>
            </div>
        )
    }
}
UsersView.propTypes = {
    ruleUsers: PropTypes.array,
    closeModal: PropTypes.bool.isRequired,
};
export default UsersView;