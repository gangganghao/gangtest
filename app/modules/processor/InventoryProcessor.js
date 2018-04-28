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
var logger = new Logger("InventoryProcessor");

var InventoryProcessor = function () {
    var self = this;
    var inventories = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getInventories = function () {
        return {inventories: inventories};
    };

    function initInventory(callback) {
        getDatabase().getInventories(null, function (resultData) {
            resultData = getLodash().transform(resultData, function(result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });

            inventories = resultData;
            if(typeof callback === "function") callback()
        });
    }

    this.initInventory = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetInventory(function (inventories) {
                if (inventories != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(inventories.insert)) {
                        getLodash().map(inventories.insert, function (inventory) {
                            var tempInventory = getLodash().mapValues(inventory, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempInventory)
                        });
                    }
                    var  deleteIds = [];
                    if(!getLodash().isEmpty(inventories.delete)){
                        deleteIds = inventories.delete;
                    }
                    getDatabase().insertInventories(formatResult,deleteIds, function () {
                        initInventory(function(){resolve()});
                    });
                } else {
                    initInventory(function(){resolve()});
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(InventoryProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(InventoryProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = InventoryProcessor;