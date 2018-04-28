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
var logger = new Logger("DrpCustomViewProcessor");

var DrpCustomViewProcessor = function () {
    var self = this;
    var drpCustomViews = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getDrpCustomViews = function () {
        return { drpCustomViews: drpCustomViews };
    };

    function initDrpCustomView(callback) {
        getDatabase().getDrpCustomViews(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });
            drpCustomViews = resultData;
            if (typeof callback === "function") callback()
        });
    }

    this.initDrpCustomView = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetDrpCustomView(function (drpCustomViews) { // RESTClient.js 
                if (drpCustomViews != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(drpCustomViews.insert)) {
                        getLodash().map(drpCustomViews.insert, function (drpCustomViewItem) {
                            var tempDrpCustomViewItem = getLodash().mapValues(drpCustomViewItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempDrpCustomViewItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(drpCustomViews.delete)) {
                        deleteIds = drpCustomViews.delete;
                    }
                    getDatabase().insertDrpCustomViews(formatResult, deleteIds, function () { // Database.js 
                        initDrpCustomView(function () { resolve() });
                    });
                } else {
                    initDrpCustomView(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(DrpCustomViewProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(DrpCustomViewProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = DrpCustomViewProcessor;