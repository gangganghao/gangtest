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
var SZControl = require("../SZControl");

var Logger = require('../utils/log.js');
var logger = new Logger("ProductProcessor"); //

var ProductProcessor = function () { //
    var self = this;
    var products = new Array(); //
    this._map = new map.Map();
    this._insert = new Array();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getProducts = function () { //
        return { products: products }; //
    };

    function initProduct(callback, noChange) { //
        getDatabase().getProducts(null, function (resultData) { //
            resultData = getLodash().transform(resultData, function (result, item, key) {
                item.custom_fields = item.custom_fields == "" ? [] : JSON.parse(item.custom_fields);
                item.form_rule = item.form_rule == "" ? [] : JSON.parse(item.form_rule);
                item.product_images = item.product_images == "" ? [] : JSON.parse(item.product_images);
                self._map.put(item.id, item);
                result.push(item);
            });
            products = resultData; //
            !noChange && SZControl.event.getter("crmSaleWin").emit("productChange");
            !noChange && SZControl.event.getter("crmServiceWin").emit("productChange");
            !noChange && SZControl.event.getter("drpWin").emit("productChange");
            !noChange && SZControl.event.getter("main").emit("productChange");
            if (typeof callback === "function") callback()
        });
    }

    this.initProduct = function (noChange) { //
        return new Promise(function (resolve, reject) {
            getRestClient().GetProduct(function (products) { // RESTClient.js  // //
                if (products != null) { //
                    var formatResult = [];
                    if (!getLodash().isEmpty(products.insert)) { //
                        getLodash().map(products.insert, function (productItem) { // //
                            var tempProductItem = getLodash().mapValues(productItem, function (value) { // //
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempProductItem) //
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(products.delete)) { //
                        deleteIds = products.delete; //
                    }
                    getDatabase().insertProducts(formatResult, deleteIds, function () { // Database.js  //
                        initProduct(function () { resolve() }, noChange); //
                    });
                } else {
                    initProduct(function () { resolve() }, noChange); //
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(ProductProcessor, events.EventEmitter); //
/*
 *继承消息处理器类
 */
util.inherits(ProductProcessor, base.ProcessorBase); //
/*
 *类的全局声明
 */
module.exports = ProductProcessor; //