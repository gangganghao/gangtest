var events = require('events');
var base = require('./processorbase.js');

var Database = null;
var getDatabase = function () {
    if (!Database) {
        Database = require('../data/Database.js');
    }
    return Database;
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

var lodash = null;
var getLodash = function () {
    if (!lodash) {
        lodash = require('lodash');
    }
    return lodash;
};

var Logger = require('../utils/log.js');
var logger = new Logger("ServiceCustomerCategoryProcessor");

var ServiceCustomerCategoryProcessor = function () {
    var self = this;
    var serviceCustomerCategorys = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getServiceCustomerCategorys = function () {
        return { serviceCustomerCategorys: serviceCustomerCategorys };
    };

    function initServiceCustomerCategory(callback) {
        getDatabase().getServiceCustomerCategorys(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });
            serviceCustomerCategorys = resultData;
            if (typeof callback === "function") callback(serviceCustomerCategorys)
        });
    }

    this.initServiceCustomerCategory = function (callback) {
        return new Promise(function (resolve, reject) {
            getRestClient().GetServiceCustomerCategory(function (serviceCustomerCategorys) {
                if (serviceCustomerCategorys != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(serviceCustomerCategorys.insert)) {
                        getLodash().map(serviceCustomerCategorys.insert, function (serviceCustomerCategoryItem) {
                            var tempServiceCustomerCategoryItem = getLodash().mapValues(serviceCustomerCategoryItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempServiceCustomerCategoryItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(serviceCustomerCategorys.delete)) {
                        deleteIds = serviceCustomerCategorys.delete;
                    }
                    getDatabase().insertServiceCustomerCategorys(formatResult, deleteIds, function () {
                        initServiceCustomerCategory(callback ? callback : function () { resolve() });
                    });
                } else {
                    initServiceCustomerCategory(callback ? callback : function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(ServiceCustomerCategoryProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(ServiceCustomerCategoryProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = ServiceCustomerCategoryProcessor;