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
var logger = new Logger("OvertimeRuleProcessor");

var OvertimeRuleProcessor = function () {
    var self = this;
    var overtimeRules = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getOvertimeRules = function () {
        return { overtimeRules: overtimeRules };
    };

    function initOvertimeRule(callback) {
        getDatabase().getOvertimeRules(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                item.apply_rule_ids = item.apply_rule_ids == "" ? [] : JSON.parse(item.apply_rule_ids);
                self._map.put(item.id, item);
                result.push(item);
            });
            overtimeRules = resultData;
            if (typeof callback === "function") callback()
        });
    }

    this.initOvertimeRule = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetOvertimeRule(function (overtimeRules) { // RESTClient.js 
                if (overtimeRules != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(overtimeRules.insert)) {
                        getLodash().map(overtimeRules.insert, function (overtimeRuleItem) {
                            var tempOvertimeRuleItem = getLodash().mapValues(overtimeRuleItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempOvertimeRuleItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(overtimeRules.delete)) {
                        deleteIds = overtimeRules.delete;
                    }
                    getDatabase().insertOvertimeRules(formatResult, deleteIds, function () { // Database.js 
                        initOvertimeRule(function () { resolve() });
                    });
                } else {
                    initOvertimeRule(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(OvertimeRuleProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(OvertimeRuleProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = OvertimeRuleProcessor;