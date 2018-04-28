var util = require('util');
var events = require('events');
var map = require('../utils/Map.js');
var base = require('./processorbase.js');
var Database = null;
var getDatabase = function(){
    if(!Database){
        Database = require('../data/Database.js');
    }
    return Database;
};
var logger = new require('../utils/log.js')('ProfileProcessor');


var ProfileProcessor = function (netClient) {
    var self = this;
    /*基础消息处理*/
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);
    self._netClient = netClient;
    /**
     *  设置个人配置群组：添加、更新、删除配置
     */
    this.functions['1'] = function (msg) {
        logger.info("functions[1]" + msg.getLength());
        try {
            if (msg.getStatusCode() == 0) {
                if(msg.getData()) {
                    var item = JSON.parse(msg.getData());
                    if (item.messageCode == 2) {
                        global.GroupsProcessor.setGroupSilence(item.chatId, item.setting.quiet ? 1 : 0);
                    }
                    getDatabase().setConfig('profile.group.maxIdentity', item.updateId);
                }
            } else {
                logger.error("functions[1] got an error!");
            }
        } catch (e) {
            logger.error("functions['1']", e);
        }
    };

    /**
     *离线数据
     */
    this.functions['2'] = function (msg) {
        logger.info("functions[2]" + msg.getLength());
        try {
            if (msg.getStatusCode() == 0) {
                var data = JSON.parse(msg.getData());
                if(data.settings){
                    data.settings.forEach(function (item) {
                        if (item.messageCode == 2) {
                            global.GroupsProcessor.setGroupSilence(item.chatId, item.setting.quiet ? 1 : 0);
                        }
                    });
                    getDatabase().setConfig('profile.group.maxIdentity', data.updateId);
                }
            } else {
                logger.error("functions[2] got an error");
            }
        } catch (e) {
            logger.error("functichatIdons['2']", e);
        }
    };

    this.setGroupSilence = function (groupId, state) {
        if (state) {
            self._netClient.send(3, 1, {"chatId": groupId, "messageCode": 2, "add": [{"quiet": true}]});
        } else {
            self._netClient.send(3, 1, {"chatId": groupId, "messageCode": 2, "del": ["quiet"]});
        }
    };

    /**
     *向服务器发送获增量数据
     */
    this.GetGroupSilenceFromServer = function () {
        getDatabase().getConfig('profile.group.maxIdentity', function (result) {
            self._netClient.send(3, 2, {updateId: parseInt(result && result.value) || 0});
        })
    };

};


/*
 *继承事件类
 */
util.inherits(ProfileProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(ProfileProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = ProfileProcessor;

