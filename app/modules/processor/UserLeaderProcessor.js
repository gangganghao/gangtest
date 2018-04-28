var events = require('events');
var base = require('./processorbase.js');
var Logger = require('../utils/log.js');
var Database = null;
var getDatabase = function(){
    if(!Database){
        Database = require('../data/Database.js');
    }
    return Database;
};
var map = require('../utils/Map.js');
var util = require('util');
var lodash = null;
var getLodash = function(){
    if(!lodash){
        lodash = require('lodash');
    }
    return lodash;
};
var _userLeaderRel;//人员与上级关系数据

var logger = new Logger("UserLeaderProcessor");

//人员与直属上级关系
var UserLeaderProcessor = function () {
    var self = this;
    var userLeaders = new Array();

    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    function getRelUids(uids, relMap) {//获取隔级上级/下属
        var result = [];
        getLodash().forEach(uids, function (uid) {
            if (getLodash().has(relMap, uid)) {
                result = result.concat(relMap[uid]);
                result = result.concat(getRelUids(relMap[uid], relMap));
            }
        });
        return result;
    }

    function getTreeUids(uid, relMap) {//获取所有层级上级/下属（树形数据）
        var result = [];
        if (getLodash().has(relMap, uid)) {
            getLodash().forEach(relMap[uid], function (id) {
                result.push({uid: id, children: getTreeUids(id, relMap)});
            });
        }
        return result;
    }

    this.getUserLeaders = function (uid, type, level) {
        var result = [];
        var userLeaderRelMap = {};//人员与上级关联集合（以人员ID为索引，上级ID集合为值）
        var leaderUserRelMap = {};//上级与人员关联集合（以上级ID为索引，人员ID集合为值）
        if (uid) {
            //if (getLodash().isEmpty(userLeaderRelMap)) {
            self._map.forEach(function (item) {
                if (item.leader_uid != 0) {//不是顶级上级
                    if (!userLeaderRelMap[item.uid]) {
                        userLeaderRelMap[item.uid] = [];
                    }
                    userLeaderRelMap[item.uid].push(item.leader_uid);
                    if (!leaderUserRelMap[item.leader_uid]) {
                        leaderUserRelMap[item.leader_uid] = [];
                    }
                    leaderUserRelMap[item.leader_uid].push(item.uid);
                }
            });
            //}
            var relMap = type == 'sup' ? userLeaderRelMap : leaderUserRelMap;//获取上级或下属所属的数据
            if (getLodash().has(relMap, uid)) {
                if (level == 1) {
                    result = getTreeUids(uid, relMap);
                } else {
                    if (level == 0 || level == 2) {//获取一级关系人员
                        result = result.concat(relMap[uid]);
                    }
                    if (level == 0 || level == 3) {//获取隔级关系人员
                        result = result.concat(getRelUids(relMap[uid], relMap));
                    }
                }
            }
        }
        return result;
    };
    function initUserLeaders() {
        //if (userLeaders.length == 0) {
            getDatabase().getUserLeaders(null, function (result) {
                self._map.clear();

                userLeaders = result;
                _userLeaderRel = result;//人员与上级关系数据
                
                result.forEach(function (userLeader) {
                    self._map.put(userLeader.uid, userLeader);
                });

                global.FriendsProcessor.emit("reloadUserState", "userLeaderRel");//更新状态树人员与上级关系数据
            })
        //}
    }

    this.initUserLeader = function () {
        return new Promise(function (resolve, reject) {
            require("../apis/RESTClient.js").GetUserLeader(function (leaders) {
                if (leaders != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(leaders.insert)) {
                        getLodash().map(leaders.insert, function (userLeader) {
                            var tempUserLeader = getLodash().mapValues(userLeader, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempUserLeader);
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(leaders.delete)) {
                        deleteIds = leaders.delete;
                    }
                    getDatabase().insertUserLeaders(formatResult, deleteIds, function () {
                        initUserLeaders();
                        resolve();
                    });
                } else {
                    initUserLeaders();
                    resolve();
                }
            });
        });
    }

    /**
     * 返回所有人员与上级关系表数据
     */
    this.getUserLeaderRel = function () {
        return _userLeaderRel;
    }
}

/*
 *继承事件类
 */
util.inherits(UserLeaderProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(UserLeaderProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = UserLeaderProcessor;