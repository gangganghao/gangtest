var util = require('util');
var events = require('events');
var map = require('../utils/Map.js');
var base = require('./processorbase.js');
var Database = require('../data/MessageDatabase');
var getDatabase = function () {
    if (!Database) {
        Database = require('../data/MessageDatabase');
    }
    return Database;
};
var logger = new require('../utils/log.js')('GroupsProcessor');
var GroupsProcessor = function (netClient) {
    this._groupsMap = new map.Map(); //存储访客显示控制类
    var self = this;
    /*基础消息处理*/
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);
    self._netClient = netClient;
    var callbackMap = {};
    /**
     *  管理群用户---添加、删除
     */
    this.functions['1'] = function (msg) {
        logger.info("functions[1]" + msg.getLength());
        try {
            if (msg.getStatusCode() == 0) {
                var item = JSON.parse(msg.getData());
                logger.info("functions[1]", item);
                var group = self.getGroup(item.groupId) || {};
                var newMemberIdArray = [].concat(item.members || []);
                var oldMemberIdArray = [].concat(group.members || []);

                if (newMemberIdArray.indexOf(global.getAccountId()) == -1) {
                    group.quitType = 1;
                    self.emit('destroyGroup', group);
                } else {
                    group.quitType = 0;
                }

                remoteToLocal(item, group);
                self.putGroup(group.groupId, group);
                getDatabase().insertOrUpdateGroup(group);

                self.emit('groups', [group], 'changeMember');

                if (callbackMap["manageGroup"] != null) {
                    callbackMap["manageGroup"](group);
                    callbackMap["manageGroup"] = null;
                }
            } else {
                logger.error("functions[1] got an error!");
                if (callbackMap["manageGroup"] != null) {
                    callbackMap["manageGroup"](null);
                    callbackMap["manageGroup"] = null;
                }
            }
        } catch (e) {
            logger.error("functions['1']", e);
        }
    };

    /**
     *接收所有群组更新
     */
    this.functions['2'] = (msg) => {
        logger.info("functions[2]" + msg.getLength());
        try {
            if (msg.getStatusCode() == 0) {
                var data = JSON.parse(msg.getData());
                getDatabase().setConfig("group.maxIdentity", data.maxIdentity);
                global.MessageInit && self.emit("messageInt");
                global.MessageInit = false;
                var groups = [];
                data.update.forEach(function (item) {
                    var group = self._groupsMap.get(item.groupId) || {};
                    remoteToLocal(item, group);

                    if (group.members.indexOf(global.getAccountId()) != -1) {
                        group.quitType = 0;
                    }
                    groups.push(group);
                    self.putGroup(group.groupId, group);
                });

                data.insert.forEach(function (item) {
                    var group = self._groupsMap.get(item.groupId) || {};
                    remoteToLocal(item, group);

                    if (group.members.indexOf(global.getAccountId()) != -1) {
                        group.quitType = 0;
                    }
                    groups.push(group);
                    self.putGroup(group.groupId, group);
                });

                data.delete.forEach(function (item) {
                    var group = self._groupsMap.get(item.groupId) || {};
                    remoteToLocal(item, group);
                    group.quitType = 3;
                    groups.push(group);
                    self.putGroup(group.groupId, group);
                    self.emit('destroyGroup', group);
                });

                getDatabase().insertGroups(groups);

                var groupArray = new Array();
                for (var k in self._groupsMap.values()) {
                    var group = self._groupsMap.values()[k];
                    if (group.quitType == 0) {
                        groupArray.push(group);
                    }
                }

                groupArray.sort(function (g1, g2) {
                    return g1.createTime < g2.createTime;
                });
                self.emit('groups', groupArray);
            } else {
                logger.error("functions[2] got an error");
            }
        } catch (e) {
            logger.error("functions['2']", e);
        }

    };

    /**
     *群组更新名字，主动或者被动更新
     */
    this.functions['3'] = function (msg) {
        logger.info("functions[3]" + msg.getLength());
        try {
            if (msg.getStatusCode() == 0) {
                var item = JSON.parse(msg.getData());
                logger.debug("functions[3]", item);
                var group = self.getGroup(item.groupId);
                if (group) {
                    remoteToLocal(item, group);
                    self.putGroup(group.groupId, group);
                    getDatabase().insertOrUpdateGroup(group);
                    self.emit('groups', [group], 'changeName');
                }

                if (callbackMap["renameGroup"] != null) {
                    callbackMap["renameGroup"](group);
                    callbackMap["renameGroup"] = null;
                }
                getDatabase().setConfig("group.maxIdentity", item.lastUpdateTime);
            } else {
                logger.error("functions[3] got an error!")
                if (callbackMap["renameGroup"] != null) {
                    callbackMap["renameGroup"](null);
                    callbackMap["renameGroup"] = null;
                }
            }
        } catch (e) {
            logger.error("functions['3']", e);
        }
    };

    this.functions['4'] = function (msg) {
        logger.info("functions[4]" + msg.getLength());
        try {

        } catch (e) {
            logger.error("functions['4']", e);
        }
    };
    var changeCreatorCallbackMap = {};
    /**
     * 主动转让群，被动更新群主
     */
    this.functions['5'] = function (msg) {
        logger.info("functions[5]" + msg.getLength());
        try {
            if (msg.getStatusCode() == 0) {
                var res = JSON.parse(msg.getData());
                var group = self.getGroup(res.groupId);
                group.creator = res.newCreator;
                self.putGroup(group.groupId, group);
                self.emit('groups', [group], 'changeCreator');
                getDatabase().insertOrUpdateGroup(group);

                if (callbackMap["changeCreator"] != null) {
                    callbackMap["changeCreator"](res);
                    callbackMap["changeCreator"] = null;
                }
                getDatabase().setConfig("group.maxIdentity", res.lastUpdateTime);
            } else {
                logger.error("functions[1] got an error!");
                if (callbackMap["changeCreator"] != null) {
                    callbackMap["changeCreator"](null);
                    callbackMap["changeCreator"] = null;
                }
            }
        } catch (e) {
            logger.error("functions['5']", e);
        }
    };
    /**
     * 解散群
     */
    this.functions['6'] = function (msg) {
        logger.info("functions[6]" + msg.getLength());
        try {
            if (msg.getStatusCode() == 0) {
                var item = JSON.parse(msg.getData());
                var group = self.getGroup(item.groupId) || {};
                group.quitType = 2;
                remoteToLocal(item, group);
                self.emit('destroyGroup', group);

                getDatabase().destroyGroup(item.groupId, 2);
                getDatabase().setConfig("group.maxIdentity", item.lastUpdateTime);

                if (callbackMap["destroyGroup"] != null) {
                    callbackMap["destroyGroup"](item);
                    callbackMap["destroyGroup"] = null;
                }
            } else {
                logger.error("functions[6] got an error!");
                if (callbackMap["destroyGroup"] != null) {
                    callbackMap["destroyGroup"](null);
                    callbackMap["destroyGroup"] = null;
                }
            }
        } catch (e) {
            logger.error("functions[6]", e);
        }
    };
    /**
     * 主动退群
     * 仅群主不允许退
     */
    this.functions['7'] = function (msg) {
        logger.info("functions[7]" + msg.getData());
        try {
            if (msg.getStatusCode() == 0) {
                var item = JSON.parse(msg.getData());

                var group = self.getGroup(item.groupId);
                if (group) {
                    if (item.userId == global.getAccountId()) {
                        group.quitType = item.quitType;
                        if (item.quitType == 1 || item.quitType == 3) {//踢出群
                            self.emit('destroyGroup', group);
                        }
                        getDatabase().destroyGroup(group.groupId, item.quitType);
                        getDatabase().setConfig("group.maxIdentity", item.lastUpdateTime);

                        if (callbackMap["quitGroup"] != null) {
                            callbackMap["quitGroup"](item);
                            callbackMap["quitGroup"] = null;
                        }
                    } else {
                        var index = group.members.indexOf(item.userId);
                        if (index != -1) {
                            group.members.splice(index, 1);
                            self.putGroup(group.groupId, group);
                            self.emit('groups', [group], "quitGroup");

                            getDatabase().insertOrUpdateGroup(group);
                            getDatabase().setConfig("group.maxIdentity", item.lastUpdateTime);
                        }
                    }
                }
            } else {
                logger.error("functions[7] got an error!");
                if (callbackMap["quitGroup"] != null) {
                    callbackMap["quitGroup"](null);
                    callbackMap["quitGroup"] = null;
                }
            }
        } catch (e) {
            logger.error("functions[7]", e);
        }
    };

    function GenGroupName(group) {
        var groupName = group.gName;
        if (groupName == null || groupName == "") {
            groupName = "";
            for (var i = 0; i < group.members.length && i < 4; i++) {
                var fobj = global.FriendsProcessor.getFriend(group.members[i]);
                groupName += ((fobj != null ? fobj.Name : group.members[i]) + ",");
            }
            groupName = groupName.substring(0, groupName.length - 1);
            if (group.members.length > 4) {
                groupName += " 等...";
            }
        }
        return groupName;
    }

    this.changeGroupName = function (groupId, groupName, callback) {
        self._netClient.send(11, 3, { "groupId": groupId, "gName": groupName, "groupName": groupName });
        callbackMap["renameGroup"] = callback;
    };

    this.createGroup = function (idArr, groupName, callback) {
        //global.debug(0, "GroupsProcessor.js:createGroup", idArr);
        var gid = self.hasGroup(idArr);
        if (gid == "") {
            if (groupName == null) {
                groupName = GenGroupName({ members: idArr });
            }
            var dat = { "groupId": "", "operate": "create", "data": idArr, gName: groupName };
            self._netClient.send(11, 1, dat);
            callbackMap["manageGroup"] = callback;
        } else {
            self.emit('groups', [self.getGroup(gid)]);
        }
    };

    this.changeGroup = function (gid, addIdArr, delIdArr, callback) {
        var dat = { "groupId": gid, "operate": "change", "add": addIdArr, "delete": delIdArr };
        self._netClient.send(11, 1, dat);
        callbackMap["manageGroup"] = callback;
    };

    this.destroyGroup = function (gid, callback) {
        var data = { "groupId": gid };
        self._netClient.send(11, 6, data);
        callbackMap["destroyGroup"] = callback;
    };

    this.setGroupSilence = function (gid, isSilence) {
        if (self.getGroup(gid)) {
            self.getGroup(gid).isSilence = isSilence;
            self.emit('changeGroupSilence', self.getGroup(gid));
            getDatabase().setGroupSilence(gid, isSilence ? 1 : 0);
        }
    };

    this.getGroupSilence = function (gid) {
        return self.getGroup(gid).isSilence;
    };

    this.changeGroupManager = function (gid, adminId, callback) {
        var data = { "groupId": gid, "creator": adminId };
        self._netClient.send(11, 5, data);
        callbackMap["changeCreator"] = callback;
    };

    /**
     *向容器中添加该fid的访客控制类对象
     *key        访客的FriendId
     *Friend    访客控制类
     */
    this.putGroup = function (key, Group) {
        self._groupsMap.put(key, Group);
    };

    this.initGroups = function (callback) {
        getDatabase().getGroupAll(function (rows) {
            var groups = rows.map(function (row) {
                self.putGroup(row.id, getDatabase().group2obj(row));
                return row;
            });
            callback && callback(groups);
        });
    };

    this.quitGroup = function (groupId, callback) {
        self._netClient.send(11, 7, { groupId: groupId });
        callbackMap["quitGroup"] = callback;
    };

    /**
     *向服务器发送获增量数据
     */
    this.GetGroupsFromServer = function (cb) {
        getDatabase().getConfig('group.maxIdentity', function (result) {
            self._netClient.send(11, 2, { updateId: parseInt(result && result.value) || 0 }, cb);
        })
    };

    /**
     *获取该fid的访客控制类对象
     */
    this.getGroup = function (key) {
        return self._groupsMap.get(key);
    };

    this.hasGroup = function (group) {
        var groupSorted = group.sort();
        var keys = self._groupsMap.keys();
        for (var i = 0; i < keys.length; i++) {
            var groupTemp = self._groupsMap.get(keys[i]).members;
            if (groupTemp.quitType == 0 && compareGroup(groupSorted, groupTemp.sort())) {
                return keys[i];
            }
        }
        return "";
    };

    function compareGroup(item1, item2) {
        if (item1.length == item2.length) {
            for (var i = 0; i < item1.length; i++) {
                if (item1[i] != item2[i]) {
                    return false;
                }
            }
        } else {
            return false;
        }
        return true;
    }

    /*
     * 遍历访客控制类对象
     * fun 遍历时要执行的函数
     */
    this.forEachGroup = function (fun) {
        var values = self._groupsMap.values();
        for (var i = 0; i < values.length; i++) {
            fun(values[i]);
        }
    };

    this.findGroup = function (str, maxLimits, callback) {
        if (str) {
            str = str.toUpperCase();
        }
        var values = self._groupsMap.values();
        var arr = [];
        for (var i = 0; i < values.length; i++) {
            var item = values[i];
            if ((item.gNPYHead != null && item.gNPYHead.toUpperCase().indexOf(str) != -1) ||
                (item.gNPinyin != null && item.gNPinyin.toUpperCase().indexOf(str) != -1) ||
                (item.gName != null && item.gName.toUpperCase().indexOf(str) != -1)) {
                if (arr.length < maxLimits) {
                    arr.push(values[i]);
                } else {
                    break;
                }
            }
        }

        if (callback) {
            callback(arr);
        }
    };

    function remoteToLocal(src, dest) {
        [
            'groupId',
            'groupType',
            'gName',
            'gNPinyin',
            'gNPYHead',
            'members',
            'creator',
            'quitType'
        ].forEach(function (key) {
            if (src.hasOwnProperty(key)) {
                dest[key] = src[key];
            }
        });
    }

    function quitTypeToText(quitType) {
        var text = "";
        if (quitType == 3) {
            text = "你已经退出当前群！";
        } else if (quitType == 2) {
            text = "你被移出了当前群！";
        } else if (quitType == 1) {
            text = "当前群已经解散！";
        }
        return text;
    }
};

/*
 *继承事件类
 */
util.inherits(GroupsProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(GroupsProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = GroupsProcessor;
