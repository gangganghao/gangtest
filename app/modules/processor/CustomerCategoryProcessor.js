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
var logger = new Logger("CustomerCategoryProcessor");

var CustomerCategoryProcessor = function () {
    var self = this;
    var customerCategorys = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getCustomerCategorys = function () {
        return { customerCategorys: customerCategorys };
    };

    function initCustomerCategory(callback) {
        getDatabase().getCustomerCategorys(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });
            customerCategorys = resultData;
            if (typeof callback === "function") callback(customerCategorys)
        });
    }

    this.initCustomerCategory = function (callback) {
        return new Promise(function (resolve, reject) {
            getRestClient().GetCustomerCategory(function (customerCategorys) {
                if (customerCategorys != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(customerCategorys.insert)) {
                        getLodash().map(customerCategorys.insert, function (customerCategoryItem) {
                            var tempCustomerCategoryItem = getLodash().mapValues(customerCategoryItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempCustomerCategoryItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(customerCategorys.delete)) {
                        deleteIds = customerCategorys.delete;
                    }
                    getDatabase().insertCustomerCategorys(formatResult, deleteIds, function () {
                        initCustomerCategory(callback ? callback : function () { resolve() });
                    });
                } else {
                    initCustomerCategory(callback ? callback : function () { resolve() })
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(CustomerCategoryProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(CustomerCategoryProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = CustomerCategoryProcessor;