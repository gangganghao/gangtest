var events = require('events');
var base = require('./processorbase.js');

var Database = null;
var getDatabase = function(){
    if(!Database){
        Database = require('../data/Database.js');
    }
    return Database;
};
var map = require('../utils/Map.js');
var util = require('util');

var restClient = null;
var getRestClient = function(){
    if(!restClient){
        restClient = require('../apis/RESTClient.js');
    }
    return restClient;
};

var lodash = null;
var getLodash = function(){
    if(!lodash){
        lodash = require('lodash');
    }
    return lodash;
};

var Logger = require('../utils/log.js');
var logger = new Logger("RoleProcessor");

var RoleProcessor = function () {
    var self = this;
    var roles = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getRoles = function () {
        return {roles: roles};
    };

    function initRole(callback) {
        getDatabase().getRoles(null, function (resultData) {
            resultData = getLodash().transform(resultData, function(result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });

            roles = resultData;
            global.DataRoleProcessor.emit("reloadPermissionState", "role");//更新状态树职能权限数据

            if(typeof callback === "function") callback()
        });
    }

    this.initRole = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetRole(function (roles) {
                if (roles != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(roles.insert)) {
                        getLodash().map(roles.insert, function (role) {
                            var tempRole = getLodash().mapValues(role, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempRole)
                        });
                    }
                    var deleteIds = [];
                    if(!getLodash().isEmpty(roles.delete)){
                        deleteIds = roles.delete;
                    }
                    getDatabase().insertRoles(formatResult,deleteIds, function () {
                        initRole(function(){resolve()});
                    });
                } else {
                    initRole(function(){resolve()});
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(RoleProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(RoleProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = RoleProcessor;