var events = require('events');
var base = require('./processorbase.js');

var Database = null;
var getDatabase = function () {
    if (!Database) {
        Database = require('../data/Database.js');
    }
    return Database;
};
var lodash = null;
var getLodash = function () {
    if (!lodash) {
        lodash = require('lodash');
    }
    return lodash;
};

var map = require('../utils/Map.js');
var util = require('util');

var restClient = null;
var getRestClient = function () {
    if (!restClient) {
        restClient = require('../apis/RESTClient.js');
    }
    return restClient;
};
var Logger = require('../utils/log.js');
var logger = new Logger("SupplierProcessor");

var SupplierProcessor = function () {
    var self = this;
    var suppliers = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getSuppliers = function () {
        return { suppliers: suppliers };
    };

    function initSuppliers(callback) {
        getDatabase().getSuppliers(function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                item.custom_fields = item.custom_fields == "" ? [] : JSON.parse(item.custom_fields);
                self._map.put(item.id, item);
                result.push(item);
            });
            suppliers = resultData;
            if (typeof callback === "function") callback()
        });
    }

    this.initSupplier = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetSupplier(function (resultData) { // RESTClient.js  // //
                if (resultData != null) { // 
                    var formatResult = [];
                    if (!getLodash().isEmpty(resultData.insert)) { //
                        getLodash().map(resultData.insert, function (item) { // //
                            var tempItem = getLodash().mapValues(item, function (value) { // //
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempItem) //
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(resultData.delete)) { //
                        deleteIds = resultData.delete; //
                    }
                    getDatabase().insertSuppliers(formatResult, deleteIds, function () {
                        initSuppliers(function () {
                            //global.SupplierProcessor.initSupplier();
                            resolve();
                        });
                    });
                } else {
                    initSuppliers(function () { resolve(); }); //
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(SupplierProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(SupplierProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = SupplierProcessor;