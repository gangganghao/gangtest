var util = require('util');
var events = require('events');
var logger = new require('../utils/log.js')('ProcessorBase');
/*
 //相当于一个虚基类，协议处理的相关Processor都会继承这个类，
 //在通信获得消息之后通过Flag找到相应的Processor，然后通过
 //Code找到处理方法，就是在这里进行调用
 */
var ProcessorBase = function () {
    events.EventEmitter.call(this);
    this.functions = {};

    this.process = function (msg) {
        logger.info('begin process');
        if (this.functions.hasOwnProperty(msg.getCode() + "")) {
            try {
                this.functions[msg.getCode() + ""](msg);
            } catch (ex) {
                logger.error("flag:" + msg.getFlag() + "  code:" + msg.getCode() + "  msg:" + msg.getData(),ex);
            }
        } else {
            logger.error("Can not find processor function!!!",msg.getFlag(), msg.getCode() ,msg.getData());
        }
    };
}

util.inherits(ProcessorBase, events.EventEmitter);
exports.ProcessorBase = ProcessorBase;