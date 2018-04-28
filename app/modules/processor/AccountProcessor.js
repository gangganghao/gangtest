var util = require('util');
var zlib = null;
var getZlib = function () {
    if (!zlib) {
        zlib = require('zlib');
    }
    return zlib;
};
var events = require('events');
var szutil = null;
var getSzutil = function () {
    if (!szutil) {
        szutil = require('../utils/SZUtil.js');
    }
    return szutil;
};
var InfoStore = null;
var getInfoStore = function () {
    if (!InfoStore) {
        InfoStore = require('../data/InfoStore.js');
    }
    return InfoStore;
};
var SettingsManager = require('../data/SettingsManager.js');

var restClient = null;
var getRestClient = function () {
    if (!restClient) {
        restClient = require('../apis/RESTClient.js');
    }
    return restClient;
};

var base = require('../processor/processorbase.js');
var accountInfo = require('../data/AccountInfo');
var MsgCrypto = null;
var getMsgCrypto = function () {
    if (!MsgCrypto) {
        MsgCrypto = require('../network/MsgCrypto');
    }
    return MsgCrypto;
};
var store = require('../utils/store');
var Logger = require('../utils/log.js');
var logger = new require('../utils/log.js')("AccountProcessor");
/*
 *帐号数据交互处理器
 */
var AccountProcessor = function (netClient) {
    events.EventEmitter.call(this);
    base.ProcessorBase.call(this);

    var self = this;
    var _noticefun = null;
    var _mstatus = -2;
    self._netClient = netClient;

    /*登录消息处理*/
    this.functions['1'] = function (msg) {
        logger.info("AccountProcessor 1 received message:getLength" + msg.getLength()
            + "   getStatusCode:" + msg.getStatusCode());
        if (msg.getStatusCode() != 0) {
            logger.error("登录错误：status code:" + msg.getStatusCode() + ", error message:" + msg.getData());
            var data = JSON.parse(msg.getData());
            self.emit("denied", data);
        } else {
            var data = JSON.parse(msg.getData());
            logger.info(data.key);
            global.xorkey = data.key;
            getMsgCrypto().setXORCrypto(data.key);
            self.emit("authed");
        }
    };

    //用户在线状态变更
    this.functions['2'] = function (msg) {
        logger.info("AccountProcessor 2 received message:");
        if (msg.getStatusCode() == 0) {
            var statusMsg = JSON.parse(msg.getData());
            if (statusMsg != null) {
                logger.info("AccountProcessor.js", statusMsg);
                if (_noticefun != null && statusMsg.uid.toString() == accountInfo.getUID()) {
                    accountInfo.setStatus(statusMsg.status);
                    accountInfo.setMStatus(statusMsg.mStatus);
                    _noticefun();
                }

                var friend = global.FriendsProcessor.getFriend(statusMsg.uid);

                if (friend == null) {
                    friend = { Id: statusMsg.uid };
                    global.FriendsProcessor.putFriend(statusMsg.uid, friend);
                    global.FriendsProcessor.getFriendInfo(statusMsg.uid);
                }

                friend.Status = statusMsg.status;
                friend.MStatus = statusMsg.mStatus;

                var isOnline = ((statusMsg.status == null ? 0 : statusMsg.status)
                    + (statusMsg.mStatus == null ? 0 : statusMsg.mStatus)) != 0;

                if (isOnline != friend.isOnline) {
                    friend.isOnline = isOnline;
                    self.emit("status", friend);
                }
            }
        }
    };

    this.functions['3'] = function (msg) {
        logger.info("AccountProcessor 3 received message:" + msg.getLength());
        if (msg.getStatusCode() == 0) {
            var data = JSON.parse(msg.getData());
            if (data.accountId == accountInfo.getLoginId()) {
                if (_noticefun != null) {
                    _noticefun(data.mstatus);
                }

                if (msg.mstatus != null) {
                    _mstatus = data.mstatus;
                }
            }
        } else {
            logger.error(msg.getData());
        }
    };

    this.functions['4'] = function (msg) {
        logger.info("AccountProcessor 4 received message:" + msg.getData());
    };

    this.functions['5'] = function (msg) {
        var msgData = msg.getData() || "{}";
        var data = JSON.parse(msgData);
        logger.info("AccountProcessor 5 received message:" + msgData);
        self.emit("otherLogin", data ? data.title : "");
    };
    //获取该公司下所有人员的在线状态
    this.functions['7'] = function (msg) {
        logger.debug("AccountProcessor.js:function 7", 'AccountProcessor:7');
        if (msg.getStatusCode() == 0) {
            getZlib().unzip(msg.getRawData(), function (error, buffer, test) {
                var items = JSON.parse(buffer.toString());
                logger.debug("AccountProcessor.js:function 7", items);
                if (items != null) {
                    global.FriendsProcessor.forEachFriend(function (friend) {

                        var data = items[friend.Id];
                        var isOnlineBefore = ((friend.Status == null ? 0 : friend.Status) + (friend.MStatus == null ? 0 : friend.MStatus)) != 0;
                        if (data != null) {
                            friend.Status = data.status;
                            friend.MStatus = data.mStatus;
                            friend.isOnline = (data.status + data.mStatus) != 0;
                        } else {
                            friend.Status = 0;
                            friend.MStatus = 0;
                            friend.isOnline = false;
                        }
                        if (isOnlineBefore != friend.isOnline) {
                            self.emit("status", friend);
                        }
                    });
                }
            })
        }
    };

    this.getUsersStatus = function () {
        self._netClient.send(1, 7, null);
    }

    this.sendUserQuit = function () {
        self._netClient.send(1, 4, null);
    }


    this.setMyStatus = function (status, callback) {
        logger.debug("setMyStatus", status);
        self._netClient.send(1, 2, { status: status });
    }

    this.userConfig = function (params, callback) {
        var secretKey;
        var thisAccountData = getInfoStore().GetUserInfoByLoginId(params.loginId);
        if (params.isSecretKey) {
            secretKey = params.password;
        } else if (params.remPasswd && thisAccountData != null) {
            accountInfo.setPasswordInfo(thisAccountData.passwordMD5, thisAccountData.password_length);
            secretKey = thisAccountData.passwordMD5;
            logger.debug("login", JSON.stringify(thisAccountData.SettingData));
        } else {
            secretKey = accountInfo.setPassword(params.password);
        }
        getRestClient().UserConfig(params.loginId, secretKey, function (err, response) {
            if (!err) {
                callback(null, response.data);
            } else {
                callback(err, null);
            }
        });
    };

    this.setUserConfig = function () {
        require('../apis/api.js').get({ m: 'Department', a: 'UserConfig' }).then(function (res) {
            var config = res.data;
            accountInfo.setLastLoginEmail(config.last_login_email);
            accountInfo.setAdmin(config.is_admin);
            accountInfo.setUserConfig(config);

            var companyId = accountInfo.getCompanyId();
            if (companyId) {//公司ID存在
                if (config.login_img) {
                    //需要显示启动页，将远程图片下载到本地
                    if (!require('fs').existsSync(global.nwAppPath + '/CompanyImages')) {//文件夹不存在，则新建
                        require('fs').mkdirSync(global.nwAppPath + '/CompanyImages');
                    }
                    global.ImageCache.downloadServerImg(config.login_img, global.nwAppPath + '/CompanyImages/' + companyId + '/loading.jpg');
                } else {
                    //无需显示启动页，删除本地图片
                    global.ImageCache.deleteLocalFile(global.nwAppPath + '/CompanyImages/' + companyId + '/loading.jpg');
                }
            }

            var thisAccountData = getInfoStore().GetUserInfoByLoginId(accountInfo.getLoginId());
            if (thisAccountData != null) {
                SettingsManager.initStoredData(thisAccountData.SettingData);
            }
        }).catch(function (err) {
            logger.error("更新用户配置错误：", err);
        });
    }

    this.PwdResetSmsCode = function (mobile, callback) {
        getRestClient().PwdResetSmsCode(mobile, function (err, response) {
            if (!err) {
                callback(response);
            } else {
                self.emit("loginError", err);
            }
        });
    };

    this.ExperienceSmsCode = function (mobile, callback) {
        getRestClient().ExperienceSmsCode(mobile, function (err, response) {
            if (!err) {
                callback(response);
            } else {
                self.emit("loginError", err);
            }
        });
    };

    this.resetPwd = function (mobile, sms_valid_code, new_pwd_one, new_pwd_two, callback) {
        getRestClient().PwdReset(mobile, new_pwd_one, new_pwd_two, sms_valid_code, function (err, response) {
            if (!err) {
                callback(response);
            } else {
                self.emit("loginError", err);
            }
        });
    };

    this.changeCompany = function (loginData, callback) {
        accountInfo.setPasswordMd5(loginData.password);
        LoginAccountServer(loginData.loginId, loginData.password, loginData.companyId, null, null, callback);
    }

    /*登录
     *loginId        登录帐号
     *password       登录密码
     *classState     登陆后帐号状态
     *logincallback  登录之后的调用函数
     */
    this.login = function (loginId, password, companyId, useRemPasswd, remPasswd, autoLogin, callback) {
        try {
            var secretKey;
            var thisAccountData = getInfoStore().GetUserInfoByLoginId(loginId);
            if (useRemPasswd && thisAccountData != null) {
                accountInfo.setPasswordInfo(thisAccountData.passwordMD5, thisAccountData.password_length);
                secretKey = thisAccountData.passwordMD5;
                logger.debug("login", JSON.stringify(thisAccountData.SettingData));
            } else {
                secretKey = accountInfo.setPassword(password);
            }

            if (thisAccountData != null) {
                SettingsManager.initStoredData(thisAccountData.SettingData);
            }
            // console.log(SettingsManager.getMyStatus);
            // if (SettingsManager.getMyStatus != 4) {
            var status = 4;
            SettingsManager.setMyStatus(status);
            LoginAccountServer(loginId, secretKey, companyId, remPasswd, autoLogin, callback)
        } catch (err) {
            global.error("AccountProcessor:login", err)
        }

    }

    this.loginDemo = DemoLoginAccountServer;

    this.initLoginData = function (user, saveSotre) {
        accountInfo.setLoginId(user.loginId);
        accountInfo.setUID(user.id);
        accountInfo.setCompanyId(user.companyId);
        accountInfo.setSig(user.token);
        accountInfo.setCryptoKey(user.crypto_key);
        accountInfo.setLoginStatus(true);
        accountInfo.setOrgVersion(user.org_version);
        accountInfo.setAdmin(user.is_admin);
        accountInfo.setRole(user.role_id);
        accountInfo.setApiHost(user.api_host);
        accountInfo.setImHostList(user.im_host_list);
        accountInfo.setImPort(user.im_port);
        accountInfo.setLastLoginEmail(user.last_login_email);
        accountInfo.setTimerIsOpen(user.timer_is_open);
        accountInfo.setTimerRate(user.timer_rate);
        accountInfo.setActivityWaterMmark(user.activity_water_mark);
        accountInfo.setLoginImg(user.login_img);

        if (user.company_id && user.loginId) {//公司ID和登录号码存在
            if (user.login_img) {
                //需要显示启动页，将远程图片下载到本地
                if (!require('fs').existsSync(global.nwAppPath + '/CompanyImages')) {//文件夹不存在，则新建
                    require('fs').mkdirSync(global.nwAppPath + '/CompanyImages');
                }
                global.ImageCache.downloadServerImg(user.login_img, global.nwAppPath + '/CompanyImages/' + user.company_id + '/loading.jpg');

                var companyImgStore = store.get('userCompanyInfo');//获取本地缓存的用户&公司信息
                if (!companyImgStore) {
                    companyImgStore = {
                        [user.loginId]: [user.company_id + '']
                    };
                } else {
                    if (companyImgStore[user.loginId] && companyImgStore[user.loginId] instanceof Array) {
                        if (companyImgStore[user.loginId].indexOf(user.company_id + '') == -1) {
                            companyImgStore[user.loginId].push(user.company_id + '');
                        }
                    } else {
                        companyImgStore[user.loginId] = [user.company_id + ''];
                    }
                }
                store.set('userCompanyInfo', companyImgStore);//缓存本地
            } else {
                //无需显示启动页，删除本地图片
                global.ImageCache.deleteLocalFile(global.nwAppPath + '/CompanyImages/' + user.company_id + '/loading.jpg');
            }
        }

        var thisAccountData = getInfoStore().GetUserInfoByLoginId(user.loginId);
        if (thisAccountData != null) {
            SettingsManager.initStoredData(thisAccountData.SettingData, saveSotre);
        }

        self.emit("logined", user.id, user.companyId);
    }

    this.clearLoginData = function () {
        accountInfo.setLoginId(null);
        accountInfo.setUID(null);
        accountInfo.setCompanyId(null);
        accountInfo.setSig(null);
        accountInfo.setCryptoKey(null);
        accountInfo.setLoginStatus(null);
        accountInfo.setOrgVersion(null);
        accountInfo.setImHost(null);
        accountInfo.setImPort(null);
        accountInfo.setAdmin(null);
        accountInfo.setRole(null);
        accountInfo.setApiHost(null);

        accountInfo.setLastLoginEmail(null);
        accountInfo.setTimerIsOpen(null);
        accountInfo.setTimerRate(null);
        accountInfo.setActivityWaterMmark(null);
        accountInfo.setLoginImg(null);
    }

    function LoginAccountServer(loginId, password, companyId, remPasswd, autoLogin, callback) {
        accountInfo.setLoginId(loginId);
        //platform: develop_ios，publish_ios，develop_win32，publish_win32，develop_darwin，publish_darwin，develop_android，publish_android
        getRestClient().Login(loginId, password, companyId, function (err, response) {
            try {
                if (!err) {
                    LoginAction(response, loginId, function () {
                        remPasswd != null && SettingsManager.setRememberPwd(remPasswd);
                        autoLogin != null && SettingsManager.setAutoLogin(autoLogin);
                    }, !(remPasswd == null && autoLogin == null))

                } else {
                    self.emit("loginError", err);
                }
                callback && callback(err);
            } catch (err) {
                global.error("AccountProcessor:LoginAccountServer", err)
            }

        });
    }

    function DemoLoginAccountServer(loginId, code, callback) {

        getRestClient().DemoLogin(function (err, response) {
            if (!err) {
                global.setting.newApi = response.data.api_host + "/";
                LoginAction(response, loginId);
                callback && callback();
            } else {
                self.emit("loginError", err);
            }
        });
    }

    function LoginAction(response, loginId, attachFunc, saveSotre = true) {
        logger.info("LoginAccountServer" + JSON.stringify(response));

        var user = response.data;
        var companyId = user.company_id;
        accountInfo.setUID(user.id);
        accountInfo.setCompanyId(companyId);
        accountInfo.setSig(user.token);
        // accountInfo.setRole(user.role_id);
        accountInfo.setCryptoKey(user.crypto_key);
        accountInfo.setOrgVersion(user.org_version);
        accountInfo.setLoginStatus(true);
        accountInfo.setImHostList(user.im_host_list);
        accountInfo.setImPort(user.im_port);
        accountInfo.setApiHost(user.api_host);
        accountInfo.setModuleHost(user.module_host);
        accountInfo.setOSS(user.oss);
        accountInfo.setOtherConfig(user.other_config);

        attachFunc && attachFunc();
        SettingsManager.setQuitLogin(false);
        SettingsManager.setIsLogout(false);

        saveSotre && accountInfo.storeAccountSetting();

        getRestClient().AccountConfig(user.token, function (aerr, result) {
            try {
                if (!aerr) {
                    var userData = result.data;
                    accountInfo.setAdmin(userData.is_admin);
                    accountInfo.setRole(userData.role_id);
                    accountInfo.setUserConfig(userData);

                    user.loginId = loginId;
                    user.companyId = companyId;
                    user.is_admin = userData.is_admin;
                    user.role_id = userData.role_id;
                    user.data_is_password = userData.data_is_password;
                    user.last_login_email = userData.last_login_email;
                    user.timer_is_open = userData.timer_is_open;
                    user.timer_rate = userData.timer_rate;
                    user.activity_water_mark = userData.activity_water_mark;
                    user.login_img = userData.login_img;

                    global.loginUser = user;
                    self.initLoginData(user, saveSotre);
                }
            } catch (err) {
                global.error("AccountProcessor:LoginAction", err)
            }
        });

    }

    //注册到im服务器
    this.loginToIMServer = function () {
        var data = {
            device_id: getInfoStore().GetMachineUUID(),
            platform: getSzutil().getPlatformCode(),
            uid: accountInfo.getUID(),
            company_id: accountInfo.getCompanyId(),
            php_version: global.setting.version,
            sig: accountInfo.getSig(),
            state: SettingsManager.getMyStatus()
        };
        getMsgCrypto().resetKey(accountInfo.getCryptoKey());
        self._netClient.send(1, 1, data);
    }
}

util.inherits(AccountProcessor, events.EventEmitter);
util.inherits(AccountProcessor, base.ProcessorBase);

module.exports = AccountProcessor;
