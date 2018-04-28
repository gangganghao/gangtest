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

var _ = require('lodash');

var Logger = require('../utils/log.js');
var logger = new Logger("ProductCategoryProcessor");

var ProductCategoryProcessor = function () {
    var self = this;
    var productCategorys = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getProductCategorys = function () {
        return { productCategorys: productCategorys };
    };

    this.getProductCategoryById = function (id) {
        var category = _.find(productCategorys, function (c) { return c.id == id });
        return category ? category : {};
    }

    function initProductCategory(callback) {
        getDatabase().getProductCategorys(null, function (resultData) {
            resultData = _.transform(resultData, function (result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });
            productCategorys = resultData;
            if (typeof callback === "function") callback()
        });
    }

    this.initProductCategory = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetProductCategory(function (productCategorys) {
                if (productCategorys != null) {
                    var formatResult = [];
                    if (!_.isEmpty(productCategorys.insert)) {
                        _.map(productCategorys.insert, function (ProductCategoryItem) {
                            var tempProductCategoryItem = _.mapValues(ProductCategoryItem, function (value) {
                                if (_.isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempProductCategoryItem)
                        });
                    }
                    var deleteIds = [];
                    if (!_.isEmpty(productCategorys.delete)) {
                        deleteIds = productCategorys.delete;
                    }
                    getDatabase().insertProductCategorys(formatResult, deleteIds, function () {
                        initProductCategory(function () { resolve() });
                    });
                } else {
                    initProductCategory(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(ProductCategoryProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(ProductCategoryProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = ProductCategoryProcessor; 