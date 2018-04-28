/*引用声明*/
var util = require('util');
var zlib = require('zlib');
var events = require('events');
var InfoStore = null;
var getInfoStore = function () {
    if (!InfoStore) {
        InfoStore = require('../data/InfoStore.js');
    }
    return InfoStore;
};
var Database = null;
var getDatabase = function () {
    if (!Database) {
        Database = require('../data/MessageDatabase.js');
    }
    return Database;
};
var RingTones = null;
var getRingTones = function () {
    if (!RingTones) {
        RingTones = require('../data/RingTones.js');
    }
    return RingTones;
};
var szutil = null;
var getSZUtil = function () {
    if (!szutil) {
        szutil = require('../utils/SZUtil.js');
    }
    return szutil;
};

var map = require('../utils/Map.js');
var base = require('./processorbase.js');
var constVar = require('../data/AppConstVar.js');
var MESSAGE_FLAGS = null;
var getMessageFlags = function () {
    if (!MESSAGE_FLAGS) {
        MESSAGE_FLAGS = getDatabase().MESSAGE_FLAGS;
    }
    return MESSAGE_FLAGS;
};
var expressDatabase = require('../data/ExpressDatabase.js')
var Logger = require('../utils/log.js');
var ForwardPanel = require("../ui_controls/ForwardPanel.js");
var _ = require('lodash');
var Database_a = require('../data/Database.js');
var logRing = new Logger("ui/RingTones");
var fs = require('fs');
var SettingManager = require("../data/SettingsManager.js");

/*消息处理器
 * flag=6
 * code=1
 */
var MessageProcessor = function (netClient) {
    /*基础消息处理*/
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    var logger = new Logger("MessageProcessor");
    var self = this;
    var _msgSentMap = new map.Map();
    var _msgQueue = new Array();
    var _msgUIReady = false;
    var _chatSessionMap = new map.Map();
    var _recevieMessageError = new map.Map();
    var _chatSessionMaxTime = new Array();
    var _msgOfflineReady = false;
    var _noticeAll = false;
    //var _userLastMsgTime = 0;
    //var _groupLastMsgTime = 0;
    //var _broadcastLastMsgTime = 0;
    //var timestampMsgIds = new Array();
    var _getHistoryMore = null;
    var _getMsgReceipt = {};
    var recevieErrorMsg = [];
    self.updateId = 0;
    self._netClient = netClient;

    /**
     * 接收消息的处理器1，获取到新的消息执行相应的操作
     */
    this.functions['1'] = function (msgPack) {
        logger.info("functions['1'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            try {
                var messagePack = JSON.parse(msgPack.getData());
                processOnlineMessage(messagePack, constVar.sess_type.user);
            } catch (e) {
                logger.error("functions['1']", e);
            }
        }
    };

    /**
     * 消息处理器2，获取到新的群消息执行相应的操作
     */
    this.functions['2'] = function (msgPack) {
        logger.info("functions['2'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            try {
                var messagePack = JSON.parse(msgPack.getData());
                processOnlineMessage(messagePack, constVar.sess_type.group);
            } catch (e) {
                logger.error("functions['2']", e);
            }
        }
    };

    /**
     * 公司通知信息
     */
    this.functions['3'] = function (msgPack) {
        logger.info("functions['3'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            try {
                var messagePack = JSON.parse(msgPack.getData());
                processOnlineMessage(messagePack, constVar.sess_type.notice);
            } catch (e) {
                logger.error(e);
            }
        }
    }

    /**
     * 离线个人消息
     */
    this.functions['4'] = function (msgPack) {
        logger.info("functions['4'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            try {
                var data = JSON.parse(msgPack.getData());
                processHistoryMessage(data.datas, constVar.sess_type.user);
            } catch (e) {
                logger.error(e);
            }
        }
    }

    /**
     * 离线时收到的群信息
     */
    this.functions['5'] = function (msgPack) {
        logger.info("functions['5'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            try {
                var data = JSON.parse(msgPack.getData());
                processHistoryMessage(data.datas, constVar.sess_type.group);
            } catch (e) {
                logger.error(e);
            }
        }
    }

    /**
     * 离线时收到的公司通知信息
     */
    this.functions['6'] = function (msgPack) {
        logger.info("functions['6'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            try {
                var data = JSON.parse(msgPack.getData());
                processHistoryMessage(data.datas, constVar.sess_type.notice);
            } catch (e) {
                logger.error(e);
            }
        }
    }

    /**
     *离线的回执, 更新已读数
     */
    this.functions['7'] = function (msgPack) {
        logger.info("functions['7'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            var result = JSON.parse(msgPack.getData());
            logger.debug('receipt offline message', result);
            if (result.datas != null) {
                result.datas.forEach(function (item) {
                    setFlag(item);
                    getDatabase().SetMessageReceived(item.receiptMsgId, item.receiptNum, item.msg_flag)
                });
            }
        }
    }
    /**
     * 拿到群组消息的回执列表
     * @param msgPack
     */
    this.functions['8'] = function (msgPack) {
        logger.info("functions['8'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            try {
                var data = JSON.parse(msgPack.getData());
                logger.debug("functions['8']", data);
                _getMsgReceipt[data.msgId](data.receiptArray);
                _getMsgReceipt[data.msgId] = null;
            } catch (e) {
                logger.error("functions['8']", e);
            }
        }
    }

    /**
     *系统通知信息
     */
    this.functions['9'] = function (msgPack) {
        logger.info("functions['9'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            var msgArr = JSON.parse(msgPack.getData());
        }
    }

    /**
     *离线时收到的公司通知信息
     */
    this.functions['10'] = function (msgPack) {
        logger.info("functions['10'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            var msgArr = JSON.parse(msgPack.getData());
            if (msgArr != null) {
                for (var i in msgArr) {
                    //processMessage(msgArr[i], 3);
                }
            }
        }
    }

    /**
     *获取个人历史消息
     */
    this.functions['11'] = function (msgPack) {
        logger.info("functions['11'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            try {
                var data = JSON.parse(msgPack.getData());
                processHistoryMessage(data.datas, constVar.sess_type.user);
            } catch (e) {
                logger.error(e);
            }
        }
    }

    /**
     *获取历史群组消息
     */
    this.functions['12'] = function (msgPack) {
        logger.info("functions['12'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            try {
                var data = JSON.parse(msgPack.getData());
                processHistoryMessage(data.datas, constVar.sess_type.group);
            } catch (e) {
                logger.error(e);
            }
        }
    }

    /**
     *获取历史公司消息
     */
    this.functions['13'] = function (msgPack) {
        logger.info("functions['13'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            try {
                var data = JSON.parse(msgPack.getData());
                processHistoryMessage(data.datas, constVar.sess_type.notice);
            } catch (e) {
                logger.error(e);
            }
        }
    }

    /**
     *获取历史回执列表消息
     */
    this.functions['14'] = function (msgPack) {
        logger.info("functions['10'] msg.getLength=" + msgPack.getLength());
        if (msgPack.getStatusCode() == 0) {
            var msgArr = JSON.parse(msgPack.getData());
            if (msgArr != null) {
                for (var i in msgArr) {
                    //processMessage(msgArr[i], 3);
                }
            }
        }
    }

    /**
     *获取历史全网消息
     */
    this.functions['15'] = function (msgPack) {

    }

    this.functions['17'] = function (msgPack) {
        if (msgPack.getStatusCode() == 0) {
            zlib.unzip(msgPack.getRawData(), function (error, buffer, test) {
                var payload = JSON.parse(buffer.toString());
                var receipts = [];
                if (payload.receipts != null && self.updateId != 0) {
                    for (var i = 0; i < payload.receipts.length; i++) {
                        var item = payload.receipts[payload.receipts.length - 1 - i];
                        messageReceivedProcess(item, true, false);
                    }
                }
                var receiptMsgIds = _.map(payload.receipts, 'receiptMsgId');
                var dataMsgIds = _.map(payload.datas, 'msgId');

                if (payload.receipts != null && self.updateId != 0) {
                    //获取所有回执消息
                    getDatabase().getMsgByIds(receiptMsgIds, function (msgs) {
                        msgs.forEach(function (msg) {
                            if (dataMsgIds.indexOf(msg.id) == -1) {
                                var receiptMsg = _.find(payload.receipts, function (rec) { return rec.receiptMsgId == msg.id });
                                setFlag(receiptMsg);
                                // setFlag(receiptMsg);
                                var localMsg = getDatabase().msg2obj(msg);
                                localMsg.realType = localMsg.type;
                                localMsg.isHistory = true;
                                localMsg.type = 37;
                                //todo 判断服务端传过来的状态
                                localMsg.msg_flag = receiptMsg.msg_flag;
                                localMsg.sessionId = getChatSessionId(localMsg);

                                receipts.push(localMsg);
                            }
                        });
                        handleOfflineMessage(payload, receipts, receiptMsgIds);
                    });
                } else {
                    handleOfflineMessage(payload, receipts, receiptMsgIds);
                }
            });
        }
    };

    /**
     * 获取未读消息数量
     */
    this.functions['18'] = function (msgPack) {
        if (msgPack.getStatusCode() == 0) {
            var data = JSON.parse(msgPack.getData());
            //更新未读数
            self.emit("updateUnreadCount", data);
        }
    };

    /**
     * 设置忽略状态
     */
    this.functions['19'] = function (msgPack) {
        logger.info(msgPack.getData());
        if (msgPack.getStatusCode() == 0) {

        }
    };

    /**
     * 批量上传已读回执
     */
    this.functions['20'] = function (msgPack) {
        logger.info(msgPack.getData());
        if (msgPack.getStatusCode() == 0) {
            var receiptMsgs = JSON.parse(msgPack.getData()).receipts;
            for (var i = 0; i < receiptMsgs.length; i++) {
                if (receiptMsgs[i].readState != 2) {
                    recevieMessage(receiptMsgs[i]);
                } else {
                    try {
                        var receiptMsg = JSON.parse(msgPack.getData());
                        receiptMsg = receiptMsg.receipts[0];
                        var content = JSON.parse(receiptMsg.content);
                    } catch (e) {
                        global.error(e);
                    }
                    var readState = receiptMsg.readState;
                    getDatabase().getMsgById(content.receiptMsgId, function (res) {
                        if (res === null) {
                            return null;
                        }
                        res.receiptType = content.receiptType;
                        getDatabase().getLastMessagesByMsg(function (msgs) {
                            for (var i = 0; i < msgs.length; i++) {
                                var tempMsg = msgs[i];
                                if (content) {
                                    for (var key in content) {
                                        tempMsg[key] = content[key];
                                    }
                                }
                                tempMsg["readState"] = readState;
                                messageReceivedProcess(tempMsg, false);
                            }
                        }, res);
                    });

                    if (receiptMsg.timestamp != 0 && _msgUIReady) {
                        getDatabase().setConfig('Message.offline.updateId', receiptMsg.timestamp);
                    }
                }

            }

        }
    };

    /**
     * 消息撤回通知
     */
    this.functions['21'] = function (msgPack) {
        if (msgPack.getStatusCode() == 0) {
            var msgRecall = JSON.parse(msgPack.getData());
            var revokes = [];
            msgRecall.revokes.forEach(function (msg) {
                revokes.push(getDatabase().revokes2obj(msg));
            });
            getDatabase().setRevokes(revokes, function () {
                getDatabase().getMsgById(revokes[0].id, function (res) {
                    if (res === null) {
                        return null;
                    }
                    if (res.sessionId == global.getAccountId()) {
                        self.emit("revokesMessage", revokes, res.msgTo);
                    } else {
                        self.emit("revokesMessage", revokes, res.sessionId);
                    }
                })

            })
        } else {
            var messageCode = {
                "14017": "消息超过可撤回时间",
                "14019": "不在该群无法撤回",
            };
            self.emit("errorMessage", messageCode[msgPack.getStatusCode()] === undefined ? "关键参数缺失" : messageCode[msgPack.getStatusCode()]);
        }
    };

    /**
     * 消息全标已读
     */
    this.functions['22'] = function (msgPack) {
        if (msgPack.getStatusCode() == 0) {
            var data = JSON.parse(msgPack.getData());
            //global.MessageProcessor.getUnreadCount(["24"]);
            getDatabase().setNotReadMsgAsReadBySessionId(data.sourceId, function () {
                //self.getUnreadCount(["24"]);
                //self.emit("allReadMessage", data.sourceId);
            })
        } else {
        }
    };

    function recevieMessage(receiptMsg, retryCount = 0) {
        var timeout = _recevieMessageError.get(JSON.parse(receiptMsg.content).receiptMsgId);
        if (timeout) {
            clearTimeout(timeout);
            _recevieMessageError.remove(JSON.parse(receiptMsg.content).receiptMsgId);
        }
        getDatabase().getMsgById(JSON.parse(receiptMsg.content).receiptMsgId, function (res) {
            if (res === null) {
                if (retryCount < 5) {
                    var tim = setTimeout(function () { recevieMessage(receiptMsg, retryCount + 1) }, 1000);
                    _recevieMessageError.put(JSON.parse(receiptMsg.content).receiptMsgId, tim);
                } else {
                    logger.error("can not find recevieMessage" + receiptMsg);
                }
                return;
            }

            var content = JSON.parse(receiptMsg.content);
            var readState = receiptMsg.readState;

            var tempMsg = res;
            if (content) {
                for (var key in content) {
                    tempMsg[key] = content[key];
                }
            }
            res.receiptType = content.receiptType;
            tempMsg["readState"] = readState;
            messageReceivedProcess(tempMsg, false);

            readState == 2 && handleHistoryMessage(res, content, readState);
        });
    }

    function handleHistoryMessage(msg, content, readState) {
        getDatabase().getLastMessagesByMsg(function (msgs) {
            for (var j = 0; j < msgs.length; j++) {
                var tempMsg = msgs[j];
                if (content) {
                    for (var key in content) {
                        tempMsg[key] = content[key];
                    }
                }
                tempMsg.receiptMsgId = msgs[j].id;
                tempMsg["readState"] = readState;
                messageReceivedProcess(tempMsg, false);
            }
        }, msg);
    }

    function insertFileMsgs(msgs, callback) {
        try {
            var fileMsg = [];
            getDatabase().getFileMsgIds(_.map(msgs, "msg_id"), function (fileIdArray) {
                var fileIds = _.map(fileIdArray, "msgId");
                msgs.map(function (msg) {
                    if (fileIds.includes(msg.msg_id)) {
                        return;
                    }
                    var content;
                    try {
                        content = JSON.parse(msg.content)
                    } catch (error) {
                        return;
                    }
                    if (msg.type == 57) {
                        _.filter(content.rich, function (c) { return c.type == 2 }).map(function (r, index) {
                            var fileSrc = r.fileSrc || '';
                            var imagePath = global.ImageCache.GetMsgImageThumbPath(r.key);
                            if (fs.existsSync(imagePath)) {
                                fileSrc = imagePath;
                            }
                            fileMsg.push({ md5: r.key, msgId: msg.msg_id, path: fileSrc, type: msg.type, sessionId: msg.sessionId, msgTime: msg.msg_time, position: (r.position || index) });
                        })
                    } else {
                        var fileSrc = content.fileSrc || '';
                        var imagePath = msg.type == 54 ? global.ImageCache.GetExpressPath(content.imageMD5) : global.ImageCache.GetMsgImageThumbPath(content.imageMD5);

                        if (fs.existsSync(imagePath)) {
                            fileSrc = imagePath;
                        }
                        fileMsg.push({ md5: content.imageMD5, msgId: msg.msg_id, path: fileSrc, type: msg.type, sessionId: msg.sessionId, msgTime: msg.msg_time, position: 0 });
                    }
                });
                getDatabase().insertFiles(fileMsg, function () { callback && callback() });
            });
        } catch (error) {
            global.log("MessageProcessor:insertFileMsgs", error)
        }

    }

    function handleOfflineMessage(payload, receipts, receiptMsgIds) {
        try {
            var msgs = [];
            var revokes = [];
            var historys = [];
            if (payload.datas != null) {
                for (var i = 0; i < payload.datas.length; i++) {
                    var item = payload.datas[payload.datas.length - 1 - i];
                    var localMsg = MsgRemoteToLocal(item, item.messageCode);
                    msgs.push(localMsg);
                    var hasReceiptMsg = receiptMsgIds.indexOf(localMsg.msg_id) != -1;

                    var readState = 0;
                    if (localMsg.msg_from == global.getAccountId()) { //如果自己发送的消息通过shouldRecvNum，receiptNum判断
                        readState = localMsg.shouldRecvNum == localMsg.receiptNum ? 1 : 0;
                    } else {//他人发送的消息通过readState判断
                        readState = localMsg.readState;
                    }

                    localMsg.readState = receiptMsgIds.indexOf(localMsg.msg_id) != -1 ? 1 : readState;

                    localMsg.needPopTips = false;
                    localMsg.isHistory = false;
                    setFlag(localMsg);
                    localMsg.sessionId = getChatSessionId(localMsg);
                    var mapMsg = _chatSessionMap.get(localMsg.sessionId);

                    if (mapMsg != null) {
                        mapMsg.push(localMsg);
                        _chatSessionMap.put(localMsg.sessionId, mapMsg);
                    } else {
                        // if (localMsg.sessionId != 24) {
                        historys.push({ seq: 0, historyId: localMsg.sessionId, historyType: localMsg.recv_type, data: { msgNum: 0, topIndex: null } });
                        _chatSessionMap.put(localMsg.sessionId, [localMsg]);
                        // }
                    }
                    if (item.handleType && item.handleType === 1) {
                        revokes.push(getDatabase().revokes2obj(item));
                    }
                }
            }

            if (payload.revokes !== undefined && payload.revokes !== null) {
                var promises = [];
                payload.revokes.forEach(function (item) {
                    revokes.push(getDatabase().revokes2obj(item));
                    promises.push(new Promise(function (resolve) {
                        getDatabase().getMsgById(item.msgId, function (msg) {
                            var localMsg = getDatabase().revokes2obj(item);
                            resolve({
                                msg: localMsg,
                                id: getChatSessionId(getDatabase().msg2obj(msg))
                            })
                        });
                    }));
                });
                Promise.all(promises).then(function (res) {
                    res.forEach(function (item, i) {
                        self.emit("revokesMessage", [item.msg], item.id);
                    })
                })

            }

            getDatabase().setRevokes(revokes, function () {
            });
            global.MessageDatabase.getHistories(function (results) {
                if (results.length == 0) {
                    global.MessageDatabase.insertHistorys(historys, function () {
                        insertMsgRecords(msgs, receipts, payload)
                    });
                } else {
                    insertMsgRecords(msgs, receipts, payload);
                }
            });
        } catch (e) {
            global.error("MessageProcessor:handleOfflineMessage", e.stack);

        }
    }

    /**
    *全标已读
    * sourceId  消息来源  个人 就是from id; 组就是 to Id; 也就是群组id 公司就是 广播id 比如 24
    * messageCode 1//个人，2/／群组（群组，公司群），3/／公司（既广播）int类型
    */
    this.allReadMessage = function (sourceId, messageCode) {
        self._netClient.send(6, 22, { sourceId, messageCode });
    }

    /**
     * 列表准备好之后调用此函数在ui_main.js当中调用
     */
    this.noticeUIReady = function (isReady = true) {
        _msgUIReady = isReady;
        if (isReady) {
            processCachedMsgIfReady();
        }
    }

    /**
     *获取离线消息
     */
    this.getOfflineMessage = function (callback) {
        getDatabase().getConfig('Message.offline.updateId', function (result) {
            getOfflineMessage(parseInt(result && result.value) || 0)
        });
    }

    /**
     *或者指定会话未读数
     */
    // this.getUnreadCount = function (seesionIds) {
    //{"tos":["100000000","e48bf18c9a3627aac245dd420998d51a"]}
    // self._netClient.send(6, 18, { tos: seesionIds });
    // }

    this.getMessageReciverByMsgId = function (msgId, callback) {
        self._netClient.send(6, 8, { msgId: msgId });
        _getMsgReceipt[msgId] = callback;
    }

    this.sendReceiptMessage = function (msgContent, to) {
        if (msgContent.receiptTo != 24) {
            var msg = {
                from: global.getAccountId(),
                to: to,
                content: JSON.stringify(msgContent),
                msgId: getSZUtil().createUUID(),
                device: getInfoStore().GetMachineUUID()
            };
            self._netClient.sendNeedConfirm(6, 20, { receipts: [msg] }, true);
            getDatabase().setNotReadMsgAsReadByMsgIds([msgContent.receiptMsgId], 2, 1, function () { });
        }
    }

    this.sendReceiptMessages = function (msgs) {
        if (msgs.length > 0) {
            var receipts = [];
            var msgIds = [];
            msgs.forEach(function (msg) {
                if (msg.msgContent.receiptTo != 24) {
                    var receipt = {
                        from: global.getAccountId(),
                        to: msg.to,
                        content: JSON.stringify(msg.msgContent),
                        msgId: getSZUtil().createUUID(),
                        device: getInfoStore().GetMachineUUID()
                    };
                    msgIds.push(msg.msgContent.receiptMsgId);
                    receipts.push(receipt);
                }
            });
            receipts.length > 0 && self._netClient.sendNeedConfirm(6, 20, { receipts: receipts }, true);
            msgIds.length > 0 && getDatabase().setNotReadMsgAsReadByMsgIds(msgIds, 2, 1, function () { });
        }
    }

    this.sendIgoneMessage = function (msgContent, to) {
        var msg = {
            from: global.getAccountId(),
            to: to,
            content: JSON.stringify(msgContent),
            device: getInfoStore().GetMachineUUID(),
            msgId: getSZUtil().createUUID(),
            readState: 2
        };
        self._netClient.sendNeedConfirm(6, 20, { receipts: [msg] }, true);
    }


    /*发送消息的全局接口
     *message  消息内容
     *to       发送给谁
     *type     消息类型
     *sendtime 发送时间
     */
    this.sendMessage = function (msgContent, to, type) {
        return sendMessageOverServer(msgContent, to, type, 1);
    }

    /*发送消息的全局接口
     *message  消息内容
     *to       发送给谁
     *type     消息类型
     *sendtime 发送时间
     */
    this.sendGroupMessage = function (msgContent, to, type) {
        return sendMessageOverServer(msgContent, to, type, 2);
    }

    /**
     * 发送消息的全局接口
     * message  消息内容
     * to       发送给谁
     * type     消息类型
     * sendtime 发送时间
     */
    this.sendCompanyMessage = function (msgContent, to, type) {
        return sendMessageOverServer(msgContent, to, type, 3);
    }

    /**
     * 从存储的消息中读取没有显示过的消息
     * vid              读取访客的visitorId
     * fun_read_history 发现未读消息之后的处理函数
     */
    this.readMessageNotRead = function (fid, showLastMsgNum, sessionType) {
        //var resultsTemp = null;
        if (showLastMsgNum < 10) {
            showLastMsgNum = 10;
        } else if (showLastMsgNum > 30) {
            showLastMsgNum = 30;
        }
        var uid = sessionType != 1 ? "" : global.getAccountId();
        getDatabase().getMsgLastRecord(fid, uid, showLastMsgNum, function (rows) {
            logger.info("readMessageNotRead length=" + rows.length);
            var hasReadSplit = false;
            rows.forEach(function (row) {
                var record = getDatabase().msg2obj(row);
                setHasRead(record);
                record.isHistory = true;

                if (record.hasRead && hasReadSplit) {
                    hasReadSplit = true;
                    processMessage({
                        msg_from: uid,
                        msg_to: fid,
                        sessionId: fid,
                        type: 1002,  //以上是历史消息分割线
                        recv_type: sessionType,
                        content: "以上是历史消息",
                        isHistory: true
                    });
                }

                record.sessionId = getChatSessionId(record);
                processMessage(record);
                if (record.msg_flag == getMessageFlags().myMsgFailed) {
                    self.showMsgSendFailed(record.recv_type, record.msg_to, record.msg_id, record.content, true, record.type);
                }
            });

            processMessage({
                msg_from: uid,
                msg_to: fid,
                type: 1003,  //滚动到最下面
                recv_type: sessionType,
                isHistory: true,
                sessionId: fid
            });
            getDatabase().setNotReadMsgAsRead(fid, uid);
        });

    }


    this.setNotReadMsgAsReadByMsgId = function (msgId) {
        getDatabase().setNotReadMsgAsReadByMsgId(msgId);
    };

    this.setNumNotice = function (type, num) {
        self.emit("noticeNum", type, num);
        //getWindow("main").webContents.send("noticeNum", type, num);
    }

    this.sendEnable = function () {
        return self._netClient.isConnected();
    }

    //获取历史消息
    this.getHistoryMessagesMore = function (fid, sessionType, msgId) {
        var code = sessionType + 10;
        _getHistoryMore = { ugid: fid, msg_id: msgId, sessionType: sessionType };
        if (msgId) {
            getDatabase().getTimestampByMsgId(msgId, function (timestamp) {
                // getDatabase().getMessagesBeforeMsg(fid, timestamp, 20, function (res) {
                //     processHistoryMessage(res,sessionType);
                // });
                self._netClient.send(6, code, { length: 20, updateId: timestamp, queryId: fid });
            });
        } else {
            var szApi = require('../apis/api.js');
            szApi.getServerDate(function (timestamp) {
                // getDatabase().getMessagesBeforeMsg(fid, timestamp, 20, function (res) {
                //     global.log(res);
                // });
                self._netClient.send(6, code, { length: 20, updateId: timestamp, queryId: fid });
            });
        }
    };

    this.showMsgSendFailed = function (type, msg_to, msg_id, content, isHistory, real_type = 5) {
        var message = {
            recv_type: type,
            msg_from: global.getAccountId(),
            realType: real_type,
            msg_to: msg_to,
            sessionId: msg_to,
            msg_id: msg_id,
            content: content,
            isHistory: isHistory,
            type: 1004
        }
        self.emit("message", message);
        //getWindow("main").webContents.send("message", message);
    }

    this.showSecretaryMsg = function (secretaryId, msg_num, isClear) {
        self.emit("message", {
            type: 1006,
            sessionId: 1,
            msg_num,
            isClear
        });
        // getWindow("main").webContents.send("message", {
        //     type: 1006,
        //     sessionId: secretaryId,
        //     msg_num,
        //     isClear
        // });
    }

    this.showRemindMsg = function (secretaryId, msg_num, isClear) {
        self.emit("message", {
            type: 1007,
            sessionId: secretaryId,
            msg_num,
            isClear
        });
    }

    function getChatSessionId(msg, code) {
        var sessionId = "";
        if (constVar.sess_type.user == msg.recv_type) {
            if (msg.msg_from == global.getAccountId()) {
                sessionId = msg.msg_to;
            } else {
                sessionId = msg.msg_from;
            }
        } else {
            sessionId = msg.msg_to;
        }
        return sessionId;
    }

    function messageReceivedProcess(receiptMsg, isHistory, isend = true) {
        var hasRead = receiptMsg.readState == 2 ? getMessageFlags().ignore : getMessageFlags().read;
        if (receiptMsg.receiptMsgId) {
            getDatabase().SetMessageReceived(receiptMsg.receiptMsgId, receiptMsg.receiptNum, hasRead, function (result) {
                if (result) {
                    var localMsg = getDatabase().msg2obj(result);
                    localMsg.realType = localMsg.type;
                    receiptMsg.msg_to = result.msg_to;
                    receiptMsg.msg_from = result.msg_from;
                    setFlag(receiptMsg);
                    localMsg.isHistory = isHistory;
                    localMsg.type = 37;
                    localMsg.msg_flag = hasRead;
                    localMsg.sessionId = getChatSessionId(localMsg);
                    processMessage(localMsg, isend);
                    return localMsg;
                } else {
                    logger.error("can not find reseipt msgId=" + receiptMsg.receiptMsgId);
                }
            });
        } else {
            setFlag(receiptMsg);
            var localMsg = getDatabase().msg2obj(receiptMsg);
            localMsg.realType = localMsg.type;
            localMsg.isHistory = isHistory;
            localMsg.type = 37;
            // localMsg.msg_flag = receiptMsg.msg_flag;
            localMsg.msg_flag = hasRead;
            localMsg.sessionId = getChatSessionId(localMsg);
            receiptMsg = localMsg;
            processMessage(localMsg, isend);
            return localMsg;
        }
    }

    function processOnlineMessage(msg, code) {
        var localMsg = MsgRemoteToLocal(msg, code);
        var unRecord = [46, 47, 48, 49, 50, 52, 56];
        var id;
        if (msg.type == 46) {//聊天消息，ack包中返回新msgId,原msgID由客户端生成，现转到由服务端生成后返回客户端
            //storeMessage(localMsg);
            getDatabase().getMsgById(localMsg.oldMsgId, function (res) {
                if (res === null) {
                    return null;
                }

                if ([36, 57, 54].includes(res.msgType)) {
                    var filelocalMsg = getDatabase().msg2obj(res);
                    filelocalMsg.sessionId = getChatSessionId(filelocalMsg);
                    filelocalMsg.msg_id = localMsg.msg_id;
                    filelocalMsg.msg_time = msg.timestamp;
                    insertFileMsgs([filelocalMsg]);
                }

                localMsg.real_type = res.msgType;
                localMsg.msg_from = res.msgFrom;
                localMsg.msg_to = res.msgTo;
                localMsg.msg_time = msg.timestamp;
                localMsg.sessionId = getChatSessionId(localMsg);
                if (_msgUIReady) {
                    if (msg.timestamp != 0) {
                        getDatabase().setConfig('Message.offline.updateId', msg.timestamp);
                    }
                } else {
                    _msgQueue.push(localMsg);
                }
                id = localMsg.msg_to;
                code != 3 && Database_a.setRecentChat(id, _.now(), code);
                processMessage(localMsg);
            })

        } else {
            if (localMsg.msg_from != global.getAccountId()) {
                localMsg.needPopTips = true;
                localMsg.msg_flag = getMessageFlags().unRead;
            } else {
                localMsg.needPopTips = false;
                localMsg.mDeviceSend = true;
                localMsg.msg_flag = getMessageFlags().myMsgNotRead;
                localMsg.changeRead = true;
            }
            localMsg.sessionId = getChatSessionId(localMsg);
            setHasRead(localMsg);

            if ([36, 57, 54].includes(localMsg.type)) {
                insertFileMsgs([localMsg]);
            }

            if (_msgUIReady) {
                storeMessage(localMsg, function () { });
                if (msg.timestamp != 0) {
                    getDatabase().setConfig('Message.offline.updateId', msg.timestamp);
                }
                processMessage(localMsg);
            } else {
                _msgQueue.push(localMsg);
            }
        }
        if (unRecord.indexOf(parseInt(msg.type)) === -1) {
            try {
                id = localMsg.msg_from;
                if (localMsg.msg_from == global.loginUser.id || code == 2) id = localMsg.msg_to;
                code != 3 && Database_a.setRecentChat(id, _.now(), code);
            } catch (e) {
                global.error("MessageProcessor:processOnlineMessage", e)
            }
        }
    }

    function moreHistoryMsgControl(noMoreMsg) {
        processMessage({
            msg_id: _getHistoryMore.msg_id,
            sessionId: _getHistoryMore.ugid,
            msg_to: _getHistoryMore.ugid,
            msg_from: global.getAccountId(),
            recv_type: _getHistoryMore.sessionType,
            type: 1001,//判断是否有更多消息了
            noMoreMsg: noMoreMsg,
            isHistory: true
        });

        _getHistoryMore = null;
    }

    function historySplitLine() {
        processMessage({
            msg_from: global.getAccountId(),
            msg_to: _getHistoryMore.ugid,
            sessionId: _getHistoryMore.ugid,
            type: 1005,  //上次加载到这里
            recv_type: _getHistoryMore.sessionType,
            isHistory: true
        });
    }

    /**
     * 加载历史消息
     * @param msgArray 加载历史消息
     * @param sessionType
     */
    function processHistoryMessage(msgArray, sessionType) {
        if (msgArray != null) {
            if (msgArray.length != 0 && _getHistoryMore) {
                historySplitLine();
            }
            var msgs = [], noReadMsg = [], sessionId;
            for (var i = 0; i < msgArray.length; i++) {
                var localMsg = MsgRemoteToLocal(msgArray[i], sessionType);
                msgs.push(localMsg);
                setFlag(localMsg);

                localMsg.isHistory = true;
                localMsg.needPopTips = false;
                localMsg.sessionId = getChatSessionId(localMsg);
                sessionId = localMsg.sessionId;

                if (localMsg.msg_flag == getMessageFlags().ignore || localMsg.msg_flag == getMessageFlags().unRead) {
                    if (localMsg.msg_from != global.getAccountId()) {
                        var content = {
                            receiptMsgId: localMsg.msg_id,
                            receiptTo: (localMsg.recv_type == 1 ? global.getAccountId() : localMsg.sessionId),
                            receiptType: localMsg.recv_type
                        };
                        noReadMsg.push({ msgContent: content, to: localMsg.msg_from });
                    }
                    localMsg.msg_flag = getMessageFlags().read;
                    localMsg.hasRead = true;
                }

                var mapMsg = _chatSessionMap.get(localMsg.sessionId);
                if (mapMsg != null) {
                    mapMsg.push(localMsg);
                    _chatSessionMap.put(localMsg.sessionId, mapMsg);
                } else {
                    _chatSessionMap.put(localMsg.sessionId, [localMsg]);
                }

                processMessage(localMsg, false);
            }
            var cmapMsg = _chatSessionMap.get(sessionId);
            var historyControl = {
                msg_id: _getHistoryMore.msg_id,
                sessionId: _getHistoryMore.ugid,
                msg_to: _getHistoryMore.ugid,
                msg_from: global.getAccountId(),
                recv_type: _getHistoryMore.sessionType,
                type: 1001,//判断是否有更多消息了
                noMoreMsg: msgArray.length == 0,
                isHistory: true
            };

            if (mapMsg != null && _getHistoryMore) {
                cmapMsg.push(historyControl);
                _chatSessionMap.put(sessionId, cmapMsg);
            } else if (msgArray.length == 0) {
                _chatSessionMap.put(_getHistoryMore.ugid, [historyControl]);
            }
            _getHistoryMore = null;
            if (noReadMsg.length > 0) {
                self.sendReceiptMessages(noReadMsg);
            }
            insertMsgRecords(msgs, [], null);
            //moreHistoryMsgControl(msgArray.length == 0, sessionType);
        }
    }

    function processCachedMsgIfReady() {
        if (_msgUIReady) {
            while (_msgQueue.length != 0) {
                var msg = _msgQueue.shift();
                if (msg != null) {
                    storeMessage(msg, function () { });
                    processMessage(msg);
                }
            }
        }
    }

    function getOfflineMessage(timestamp) {
        self.updateId = timestamp;
        self._netClient.send(6, 17, { updateId: timestamp });
    }

    this.sendImageOrFileMessage = function (msg, spaceSize) {
        var newMsg = {
            from: msg.msg_from,
            to: msg.msg_to,
            type: msg.type,
            content: msg.content,
            msgId: msg.msg_id,
            device: msg.device,
            timestamp: msg.timestamp,
            spaceSize: spaceSize
        };

        self._netClient.sendNeedConfirm(6, msg.recv_type, newMsg);
    }

    this.sendRichMessage = function (msg) {
        //去除fileSRC
        var content = JSON.parse(msg.content);
        content.rich = [];
        JSON.parse(msg.content).rich.map(function (r) {
            if (r.type == 2) {
                delete r.fileSrc;
            }
            content.rich.push(r);
        });
        var newMsg = {
            from: msg.msg_from,
            to: msg.msg_to,
            type: msg.type,
            content: JSON.stringify(content),
            msgId: msg.msg_id,
            device: msg.device,
            timestamp: msg.timestamp
        };

        self._netClient.sendNeedConfirm(6, msg.recv_type, newMsg);
    }

    this.SeeNotNoticeMessage = function () {

    }

    this.sendFileOrImagePrepare = function (fileSrc, fid, type, sessType, showImageTips = false) {
        var message = { fileSrc: fileSrc };
        var msg = {
            from: global.getAccountId(),
            to: fid,
            type: type,
            content: JSON.stringify(message),
            msgId: getSZUtil().createUUID(),
            device: getInfoStore().GetMachineUUID(),
            timestamp: Date.now()
        };

        var localMsg = MsgRemoteToLocal(msg, sessType);
        localMsg.sessionId = getChatSessionId(localMsg);
        _msgSentMap.put(localMsg.msg_id, localMsg);

        localMsg.msg_flag = getMessageFlags().myMsgFailed;
        localMsg.needSend = true;
        localMsg.showImageTips = showImageTips;
        storeMessage(localMsg, function () { });
        processMessage(localMsg);
    }

    this.sendRichPrepare = function (message, fid, type, sessType) {
        var msg = {
            from: global.getAccountId(),
            to: fid,
            type: type,
            content: JSON.stringify(message),
            msgId: getSZUtil().createUUID(),
            device: getInfoStore().GetMachineUUID(),
            timestamp: Date.now()
        };

        var localMsg = MsgRemoteToLocal(msg, sessType);
        localMsg.sessionId = getChatSessionId(localMsg);
        _msgSentMap.put(localMsg.msg_id, localMsg);
        localMsg.msg_flag = getMessageFlags().myMsgFailed;
        localMsg.needSend = true;

        storeMessage(localMsg, function () { });
        processMessage(localMsg);
    }

    //转发
    this.forward = function (id, type) {
        global.MessageDatabase.getMessageByMsgId(id, function (res) {
            ForwardPanel(res.content, type);
        });
    };

    function sendMessageOverServer(msgContent, to, type, send_type) {
        var spaceSize = 0;
        if (type == 5) {
            spaceSize = new Buffer(msgContent.text).length;
        } else if (type == 54) {
            spaceSize = msgContent.size;
            delete msgContent.size;
        }

        var msg = {
            from: global.getAccountId(),
            to: to,
            type: type,
            content: JSON.stringify(msgContent),
            msgId: getSZUtil().createUUID(),
            device: getInfoStore().GetMachineUUID(),
            spaceSize: spaceSize
        };

        if (msgContent === "") {
            msg.content = "";
        }


        if (!(type == 19 || type == 22)) {
            msg.timestamp = Date.now();

            var localMsg = MsgRemoteToLocal(msg, send_type);
            _msgSentMap.put(localMsg.msg_id, localMsg);
            localMsg.msg_flag = getMessageFlags().myMsgFailed;
            localMsg.sessionId = getChatSessionId(localMsg);

            storeMessage(localMsg, function () {
                self._netClient.sendNeedConfirm(6, send_type, msg);
            });
            processMessage(localMsg);
        } else {
            self._netClient.sendNeedConfirm(6, send_type, msg);
        }
        return localMsg;
    }

    function MsgRemoteToLocal(remoteMsg, code) {
        var localMsg = {}
        if (remoteMsg.content && remoteMsg.type != 52) {
            var receiptContent = JSON.parse(remoteMsg.content);

            for (var key in receiptContent) {
                if (key != "msgId") {
                    remoteMsg[key] = receiptContent[key];
                    localMsg[key] = receiptContent[key];
                }
            }
        }

        localMsg.msg_id = remoteMsg.msgId;
        localMsg.msg_from = remoteMsg.from;
        localMsg.msg_to = remoteMsg.to;
        localMsg.recv_type = code;
        localMsg.msg_time = remoteMsg.timestamp;
        localMsg.type = remoteMsg.type;
        localMsg.content = remoteMsg.content;
        localMsg.device = remoteMsg.device;
        localMsg.readState = remoteMsg.readState;
        localMsg.receiptNum = remoteMsg.receiptNum;
        localMsg.shouldRecvNum = remoteMsg.shouldRecvNum;
        localMsg.lastReceiptTime = remoteMsg.lastReceiptTime;
        localMsg.oldMsgId = remoteMsg.oldMsgId;
        localMsg.handleType = remoteMsg.handleType ? remoteMsg.handleType : 0;
        localMsg.sound = remoteMsg.sound;

        return localMsg;
    }

    function setFlag(localMsg) {
        if (!isToMeMessage(localMsg)) {
            if (localMsg.readState == 1) {
                localMsg.msg_flag = getMessageFlags().read;
            } else if (localMsg.readState == 2) {
                localMsg.msg_flag = getMessageFlags().ignore;
            } else {
                localMsg.msg_flag = getMessageFlags().unRead;
            }
        } else {
            if (localMsg.readState == 1) {
                localMsg.msg_flag = getMessageFlags().myMsg;
            } else if (localMsg.readState == 2) {
                localMsg.msg_flag = getMessageFlags().ignore;
            } else {
                localMsg.msg_flag = getMessageFlags().myMsgNotRead;
            }
        }
        setHasRead(localMsg);
    }

    function setHasRead(localMsg) {
        if (localMsg.recv_type != constVar.sess_type.notice) {
            localMsg.hasRead = !(localMsg.msg_flag == getMessageFlags().unRead || localMsg.msg_flag == getMessageFlags().myMsgNotRead);
        } else {
            localMsg.hasRead = !(localMsg.msg_flag == getMessageFlags().ignore || localMsg.msg_flag == getMessageFlags().unRead || localMsg.msg_flag == getMessageFlags().myMsgNotRead);
        }
    }

    function isToMeMessage(msg) {
        return msg.msg_from == global.getAccountId();
    }

    function processMessage(localMsg, isSend = true) {
        logger.debug('processMessage', localMsg);
        if (localMsg.sound && SettingManager.getIsRing()) {
            logRing.info("RingFrom: message", localMsg);
            getRingTones().playSounds(localMsg.sound);
        }
        switch (localMsg.type) {
            case 5:
            case 36:
            case 54://表情
            case 19:
            case 21:
            case 22:
            case 38:
            case 45:
            case 46://发出消息的回应，替换本地的msg_id为服务器的msg_id
            case 57:
                var storedMsg = _msgSentMap.get(localMsg.oldMsgId);
                if (storedMsg != null) {
                    localMsg.msg_from = storedMsg.msg_from;
                    localMsg.msg_to = storedMsg.msg_to;
                    localMsg.sessionId = storedMsg.msg_to;
                    _msgSentMap.remove(localMsg.oldMsgId);
                }
                getDatabase().setMsgSent(localMsg.oldMsgId, localMsg.msg_id,
                    localMsg.msg_time, localMsg.shouldRecvNum);
                break;
            case 47:
                break;
            case 48://话题
            case 49://通知
            case 50://投票
            case 51://通知确认
            case 52:
            case 53:

            case 201:
            case 202:
            case 203:
            case 204:
            case 205:
            case 206:
                break;
        }
        if (isSend) {
            self.emit("message", localMsg);
        }

        //getWindow("main").webContents.send("message", localMsg);
    }

    function storeMessage(msg, callback) {
        getDatabase().insertMsgRecords([msg], callback);
    }
    this.revokesMessage = function (msgId) {
        self._netClient.sendNeedConfirm(6, 21, {
            revokes: [
                {
                    msgId: msgId,
                    handleType: 1
                }
            ]

        });
    }

    this.sendExpress = function (md5, tab_id) {
        expressDatabase.getExpressByMd5(md5, tab_id, function (res) {
            if (res && res.length > 0) {
                self._netClient.sendNeedConfirm(6, 1, {
                    revokes: [
                        {
                            imageMD5: md5,
                            colId: tab_id,
                            width: res.width,
                            height: res.height,
                            title: res.title,
                            fileType: res.type
                        }
                    ]

                });
            }
        })
    }

    function insertMsgRecords(msgs, receipts, payload) {
        function emitMessages(needUpdate) {
            if (_chatSessionMap.size() == 0) {
                self.emit("messages", null, receipts);
            } else {
                self.emit("messages", _chatSessionMap, receipts);

                _chatSessionMap.clear();
            }

            if (payload && payload.updateId != 0 && msgs.length > 0) {
                self.updateId = payload.updateId;
                global.MessageDatabase.setConfig('Message.offline.updateId', payload.updateId);
            }
        }

        if (msgs.length != 0) {
            global.MessageDatabase.insertMsgRecords(msgs, function (res) {
                var filemsgs = _.filter(msgs, function (m) { return [36, 57, 54].includes(m.type) && m.handleType != 1 });
                if (filemsgs.length > 0) {
                    insertFileMsgs(filemsgs, function () {
                        emitMessages(res > 0);
                    });
                } else {
                    emitMessages(res > 0);
                }
            });
        } else {
            emitMessages(msgs.length > 0);
        }
    }

};
/*
 *继承事件类
 */
util.inherits(MessageProcessor, events.EventEmitter);


/*全局声明*/
module.exports = MessageProcessor;
