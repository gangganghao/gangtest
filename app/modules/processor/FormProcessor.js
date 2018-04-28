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
var logger = new Logger("FormProcessor");

var FormProcessor = function () {
    var self = this;
    var forms = new Array();
    this._map = new map.Map();
    base.ProcessorBase.call(this);
    events.EventEmitter.call(this);

    this.getForms = function () {
        return { forms: forms };
    };

    this.getFormsByClassId = function (class_id) {
        if (typeof (class_id) == "number") {
            return getLodash().filter(forms, function (f) {
                return f.form_class_id == class_id;
            });
        } else if (typeof (class_id) == "object") {
            return getLodash().filter(forms, function (f) {
                return class_id.indexOf(f.form_class_id) > -1;
            });
        }
    };

    this.getFormById = function (id) {
        let form = getLodash().filter(forms, function (f) {
            return f.id == id;
        });
        if (form) {
            return form[0];
        } else {
            return false;
        }
    }

    function initForm(callback) {
        getDatabase().getForms(null, function (resultData) {
            resultData = getLodash().transform(resultData, function (result, item, key) {
                self._map.put(item.id, item);
                result.push(item);
            });
            forms = resultData;
            if (typeof callback === "function") callback()
        });
    }

    this.initForm = function () {
        return new Promise(function (resolve, reject) {
            getRestClient().GetForm(function (forms) {
                if (forms != null) {
                    var formatResult = [];
                    if (!getLodash().isEmpty(forms.insert)) {
                        getLodash().map(forms.insert, function (formItem) {
                            var tempFormItem = getLodash().mapValues(formItem, function (value) {
                                if (getLodash().isObject(value))
                                    return JSON.stringify(value);
                                else
                                    return value;
                            });
                            formatResult.push(tempFormItem)
                        });
                    }
                    var deleteIds = [];
                    if (!getLodash().isEmpty(forms.delete)) {
                        deleteIds = forms.delete;
                    }
                    getDatabase().insertForms(formatResult, deleteIds, function () { //Database.js
                        initForm(function () { resolve() });
                    });
                } else {
                    initForm(function () { resolve() });
                }
            });
        });
    }
}

/*
 *继承事件类
 */
util.inherits(FormProcessor, events.EventEmitter);
/*
 *继承消息处理器类
 */
util.inherits(FormProcessor, base.ProcessorBase);
/*
 *类的全局声明
 */
module.exports = FormProcessor;