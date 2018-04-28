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
var logger = new Logger("ServiceCustomViewProcessor");

var ServiceCustomViewProcessor = function () {
    var self = this;
    var serviceCustomViews = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getServiceCustomViews = function () {
        return { serviceCustomViews: serviceCustomViews };
    };

    function initServiceCustomView(callback) {
        getDatabase().getServiceCustomViews(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });
            serviceCustomViews = resultData;
            if (typeof callback === "function") callback()
        });
    }

    this.initServiceCustomView = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetServiceCustomView(function (serviceCustomViews) { // RESTClient.js 
                if (serviceCustomViews != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(serviceCustomViews.insert)) {
                        getLodash().map(serviceCustomViews.insert, function (serviceCustomViewItem) {
                            var tempServiceCustomViewItem = getLodash().mapValues(serviceCustomViewItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempServiceCustomViewItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(serviceCustomViews.delete)) {
                        deleteIds = serviceCustomViews.delete;
                    }
                    getDatabase().insertServiceCustomViews(formatResult, deleteIds, function () { // Database.js 
                        initServiceCustomView(function () { resolve() });
                    });
                } else {
                    initServiceCustomView(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(ServiceCustomViewProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(ServiceCustomViewProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = ServiceCustomViewProcessor;