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
var logger = new Logger("SaleChanceProcessor");

var SaleChanceProcessor = function () {
    var self = this;
    var saleChances = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getSaleChances = function () {
        return { saleChances: saleChances };
    };
    this.getUsingSaleChances = function () {
        return { saleChances: getLodash().filter(saleChances, { is_using: 1 }) };
    };

    function initSaleChance(callback) {
        getDatabase().getSaleChance(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                item.stages = item.stages == "" ? [] : JSON.parse(item.stages);
                self._map.put(item.id, item);
                result.push(item);
            });
            saleChances = getLodash().orderBy(resultData, ['update_time', 'is_using'], ['desc', 'asc']);
            if (typeof callback === "function") callback()
        });
    }

    this.initSaleChance = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetSaleChance(function (saleChances) {
                if (saleChances != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(saleChances.insert)) {
                        getLodash().map(saleChances.insert, function (saleChanceItem) {
                            var tempSaleChanceItem = getLodash().mapValues(saleChanceItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempSaleChanceItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(saleChances.delete)) {
                        deleteIds = saleChances.delete;
                    }
                    getDatabase().insertSaleChances(formatResult, deleteIds, function () {
                        initSaleChance(function () { resolve() });
                    });
                } else {
                    initSaleChance(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(SaleChanceProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(SaleChanceProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = SaleChanceProcessor;