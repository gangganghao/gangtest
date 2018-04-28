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
var logger = new Logger("CustomViewProcessor");

var CustomViewProcessor = function () {
    var self = this;
    var customViews = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getCustomViews = function () {
        return { customViews: customViews };
    };

    function initCustomView(callback) {
        getDatabase().getCustomViews(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });
            customViews = resultData;
            if (typeof callback === "function") callback()
        });
    }

    this.initCustomView = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetCustomView(function (customViews) { // RESTClient.js 
                if (customViews != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(customViews.insert)) {
                        getLodash().map(customViews.insert, function (customViewItem) {
                            var tempCustomViewItem = getLodash().mapValues(customViewItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempCustomViewItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(customViews.delete)) {
                        deleteIds = customViews.delete;
                    }
                    getDatabase().insertCustomViews(formatResult, deleteIds, function () { // Database.js 
                        initCustomView(function () { resolve() });
                    });
                } else {
                    initCustomView(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(CustomViewProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(CustomViewProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = CustomViewProcessor;