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
var logger = new Logger("CustomerInfoEditRuleProcessor");

var CustomerInfoEditRuleProcessor = function () {
    var self = this;
    this._rules = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getAllRules = function () {
        return {rules: self._rules};
    };

    this.getRuleByFormId = function (formId) {
        return getLodash().find(self._rules,function (r) {
            return r.form_id === formId;
        });
    };

    function initRules(callback) {
        getDatabase().getCustomerInfoEditRules(null, function (resultData) {
            resultData = getLodash().transform(resultData, function(result, item, key) {
                item.fields = item.fields==""?[]:JSON.parse(item.fields);
                result.push(item);
            });
            self._rules = resultData;
            if(typeof callback === "function")callback()
        });
    }

    this.initRule = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetCustomerInfoEditRule(function (ruleObj) {
                if (ruleObj != null) {
                    var newRules = [];//格式化object为string
                    if(!getLodash().isEmpty(ruleObj.insert)){
                        getLodash().map(ruleObj.insert, function (rule) {
                            var tempRule = getLodash().mapValues(rule, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            newRules.push(tempRule)
                        });
                    }
                    var deleteIds = [];
                    if(!getLodash().isEmpty(ruleObj.delete)){
                        deleteIds = ruleObj.delete;
                    }
                    getDatabase().insertCustomerInfoEditRules(newRules,deleteIds, function () {
                        initRules(function(){resolve()});
                    });
                } else {
                    initRules(function(){resolve()});
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(CustomerInfoEditRuleProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(CustomerInfoEditRuleProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = CustomerInfoEditRuleProcessor;