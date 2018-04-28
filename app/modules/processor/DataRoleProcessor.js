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
var logger = new Logger("DataRoleProcessor");

var DataRoleProcessor = function () {
    var self = this;
    var dataRoles = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getDataRoles = function () {
        return {dataRoles: dataRoles};
    };

    function initDataRole(callback) {
        getDatabase().getDataRoles(null, function (resultData) {
            resultData = getLodash().transform(resultData, function(result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });

            dataRoles = resultData;
            global.DataRoleProcessor.emit("reloadPermissionState", "datarole");//更新状态树角色权限数据

            if(typeof callback === "function") callback();
        });
    }

    this.initDataRole = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetDataRole(function (dataRoles) {
                if (dataRoles != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(dataRoles.insert)) {
                        getLodash().map(dataRoles.insert, function (dataRole) {
                            var tempDataRole = getLodash().mapValues(dataRole, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempDataRole)
                        });
                    }
                    var deleteIds = [];
                    if(!getLodash().isEmpty(dataRoles.delete)){
                        deleteIds = dataRoles.delete;
                    }
                    getDatabase().insertDataRoles(formatResult,deleteIds, function () {
                        initDataRole(function(){resolve()});
                    });
                } else {
                    initDataRole(function(){resolve()});
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(DataRoleProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(DataRoleProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = DataRoleProcessor;