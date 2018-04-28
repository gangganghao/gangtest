var events = require('events');
var base = require('./processorbase.js');
var Logger = require('../utils/log.js');
var Database = require('../data/Database.js');
var getDatabase = function () {
    if (!Database) {
        Database = require('../data/Database.js');
    }
    return Database;
};

var util = require('util');
var restClient = null;
var getRESTClient = function () {
    if (!restClient) {
        restClient = require('../apis/RESTClient.js');
    }
    return restClient;
};

var logger = new Logger("PushNotifyProcessor");
var logRing = new Logger("ui/RingTones");
var RingTones = require("../data/RingTones");
var SettingManager = require("../data/SettingsManager.js");

var PushNotifyProcessor = function () {
    var self = this;
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    /**
     * 新增消息通知
     */
    this.functions['1'] = function (item) {
        self.newNotify(item)
    };
    this.functions['9'] = function (item) {
        self.newNotify(item)
    };
    //哨子资讯
    this.functions['11'] = function (item) {
        self.newNotify(item)
    }

    /**
     * 已读消息回执
     */
    //小秘书
    this.functions['2'] = function () {
        self.initNotify(1);
    };
    //数据简报
    this.functions['8'] = function () {
        self.initNotify(2);
    };
    //哨子资讯
    this.functions['10'] = function () {
        self.initNotify(4);
    };

    /**
     * 不在小秘书显示的通知
     */
    this.functions['3'] = function (item) {
        var data = JSON.parse(item.getData());
        if (data.moduleType == 30200) { 
            if (data.hasOwnProperty('extra')) {
                var tempExtra = JSON.parse(data.extra);
                var extraTab = tempExtra[0] && tempExtra[0].tab ? tempExtra[0].tab : 1;
                switch (extraTab) {
                    case 2: 
                        global.RoleProcessor.initRole();//更新职能权限增量
                        break;
                    case 3: 
                        global.DataRoleProcessor.initDataRole();//更新角色权限增量
                        break;
                    default:
                        self.emit("setUserConfig");//个人配置更新
                        break;
                }
            }
            self.emit("systemNotification", data, 3);
            
        } else {//其他
            self.emit("systemNotification", data, 3);
        }
    };

    this.functions['4'] = function (msg) {
        logger.info("PushNotifyProcessor.js:function 4", 'PushNotifyProcessor:10');
        if (msg.getStatusCode() == 0) {
            var identity = JSON.parse(msg.getData()).identity;

            if (identity[3] == 1) {
                global.UserLeaderProcessor.initUserLeader();//增量更新（人员与上级关系）
            }

            global.FriendsProcessor.getIncrement(identity);//增量更新（部门、人员、部门与人员关系）
            self.emit("systemNotification", msg, 4);
        }
    }

    this.initNotify = function (type, isLogin) {
        if (typeof type == "boolean") {
            isLogin = !!type;
            type = undefined;
        }
        //  global.MessageProcessor.showSecretaryMsg(1, 0);
        var d1 = new Promise(function (resolve, reject) {
            if (type !== 1 && type !== undefined) {
                resolve();
                return;
            }
            getRESTClient().GetNotify(function (res) {
                if (res === null) {
                    resolve();
                    return;
                }
                var secretarys = (res.insert || []).concat(res.update || []);
                global.FuncTabList.msgTab.find("li[sessionId='1']").attr("maxTime", res.max_identity);
                if (secretarys.length > 0) {
                    getDatabase().insertSecretarys(secretarys, [], function () {
                        resolve(res.unreadMessageTotal ? res.unreadMessageTotal.count : 0);
                    }, 1);
                    if (!isLogin) {
                        if (res.update) {
                            self.emit("systemNotification", res.update, 2);
                        }
                        if (res.insert) {
                            res.insert.forEach(function (item) {
                                self.emit("systemNotification", item, 5);
                            })
                        }
                    }
                } else {
                    resolve();
                }
            }, "secretary");
        });
        var d2 = new Promise(function (resolve, reject) {
            if (type !== 2 && type !== undefined) {
                resolve();
                return;
            }
            getRESTClient().GetNotify(function (res) {
                if (res === null) {
                    resolve();
                    return;
                }
                var remind = (res.insert || []).concat(res.update || []);
                if (remind.length > 0) {
                    getDatabase().insertSecretarys(remind, [], function () {
                        resolve(res.unreadMessageTotal ? res.unreadMessageTotal.count : 0);
                    }, 3);
                    if (!isLogin) {
                        if (res.update) {
                            self.emit("systemNotification", res.update, 2);
                        }
                        if (res.insert) {
                            res.insert.forEach(function (item) {
                                self.emit("systemNotification", item, 5);
                            })
                        }
                    }
                } else {
                    resolve();
                }
            }, "remind");
        });
        var d4 = new Promise((resolve, reject) => {
            if (type !== 4 && type !== undefined) {
                resolve();
                return;
            }
            getRESTClient().GetNotify(function (res) {
                if (res === null) {
                    resolve();
                    return;
                }
                var news = (res.insert || []).concat(res.update || []);
                if (news.length > 0) {
                    getDatabase().insertSecretarys(news, [], function () {
                        resolve(res.unreadMessageTotal ? res.unreadMessageTotal.count : 0);
                    }, 4);
                    if (!isLogin) {
                        if (res.update) {
                            self.emit("systemNotification", res.update, 2);
                        }
                        if (res.insert) {
                            res.insert.forEach(function (item) {
                                self.emit("systemNotification", item, 5);
                            })
                        }
                    }
                } else {
                    resolve();
                }
            }, "news");
        })

        Promise.all([d1, d2, d4]).then(function (res) {
            var superscript = [];
            res.forEach(function (item, i) {
                if (item !== undefined) {
                    superscript.push({
                        notify_type: i !== 0 ? i + 2 : 1,
                        total: item
                    });
                }
            })
            global.SecretaryEvent.setter(superscript);
        });

    };

    this.newNotify = function (item) {
        global.FuncTabList.msgTab.find("li[sessionId='1']").attr("maxTime", new Date().getTime());
        var notify_name, where,
            data = JSON.parse(item.getData());
        switch (data.notifyType) {
            case 1:
                notify_name = "secretary";
                where = { secretaryId: data.secretaryId };
                break;
            case 3:
                notify_name = "remind";
                where = { briefreportId: data.briefreportId };
                break;
            case 4:
                notify_name = "news";
                where = { operationId: data.operationId };
                break;
            default:
                notify_name = "secretary";
                where = { secretaryId: data.secretaryId };
        }
        getDatabase().getWhereSecretaries(where, function (res) {
            if (res.length == 0) {
                getDatabase().insertOrUpdateSecretary(data, function () {
                    if (data.sound && SettingManager.getIsRing()) {
                        logRing.info("RingFrom: secretary", item.getData())
                        RingTones.playSounds(data.sound);
                    }
                    getDatabase().setConfig(notify_name + ".maxIdentity", data.insertTime);
                    self.emit("systemNotification", data, 1);
                    global.SecretaryEvent.addOne(notify_name);
                });
            }
        }, data.notifyType)

    }
};

function remoteMsgToLocal(dataItem) {
    var model = {};
    model.title = dataItem.title;
    model.content = dataItem.content;
    model.sourceType = dataItem.sourceType;
    model.compId = dataItem.compId;
    model.uid = dataItem.userId;
    model.orgId = dataItem.orgId;
    model.levelType = dataItem.levelType;
    model.fromUid = dataItem.fromUid;
    model.biz = dataItem.biz;
    return model;
}

/*
 *继承事件类
 */
util.inherits(PushNotifyProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(PushNotifyProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = PushNotifyProcessor;