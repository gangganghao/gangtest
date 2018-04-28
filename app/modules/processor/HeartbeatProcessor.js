var util = require('util');
var events = require('events');
var base = require('./processorbase.js');
var logger = new require('../utils/log.js')("HeartBeatProcessor");
var HEARTBEAT_INTERVAL = 55;
var HEARTBEAT_LOST_INTERVAL = 30;
var HEARTBREAK_MAX_LOSS = 5;

var HeartBeatProcessor = function (netClient) {
    var self = this;
    var heartbeattimer;
    //base.ProcessorBase.call(this);
    //events.EventEmitter.call(this);
    self._netClient = netClient;
    var _tcpClient;
    var _heartBeatLoss = 0;
    var _timeMeter = HEARTBEAT_INTERVAL;
    var _lastHeartbeatTime = 0;
    var _wishLive = false;

    this.stopHeartBeat = function () {
        if (heartbeattimer != null) {
            clearInterval(heartbeattimer);
            heartbeattimer = null;
            _heartBeatLoss = 0;
            _wishLive = false;
        }
    }

    //初始化心跳功能
    this.startHeartBeat = function (client) {
        _tcpClient = client ? client : _tcpClient;
        _heartBeatLoss = 0;
        if (heartbeattimer != null) {
            clearInterval(heartbeattimer);
            heartbeattimer = null;
        }

        _wishLive = true;
        heartbeattimer = setInterval(function () {
            if (_timeMeter-- <= 0) {
                //计时器为零时重置时间，并产生一次心跳
                _timeMeter = _heartBeatLoss == 0 ? HEARTBEAT_INTERVAL : HEARTBEAT_LOST_INTERVAL;
                self.heartbeat();
            } else if (HEARTBEAT_INTERVAL - _timeMeter > 3 && _heartBeatLoss != 0) {
                _timeMeter = HEARTBEAT_LOST_INTERVAL;
                self.heartbeat();
            }

            if (_heartBeatLoss >= HEARTBREAK_MAX_LOSS) {
                logger.debug("HeartBeatProcessor.js","client heart break!");
                if (heartbeattimer != null) {
                    clearInterval(heartbeattimer);
                    heartbeattimer = null;
                }
                _tcpClient.disconnectProcess();
            }
            _lastHeartbeatTime = Date.now();
        }, 1000);
    }

    //收到消息的话，计时器重置
    this.hasMessageResponse = function () {
        _timeMeter = HEARTBEAT_INTERVAL;
        _heartBeatLoss = 0;
    }

    //心跳
    this.heartbeat = function () {
        logger.debug("HeartBeatProcessor.js","heart beat to server!" + _heartBeatLoss);
        _heartBeatLoss++;
        self._netClient.send(9, 1, null);
    }

    this.testHeartbeatStop = function () {
        var heartStopTime = Date.now() - _lastHeartbeatTime;
        logger.info(heartStopTime, _wishLive);
        if (heartStopTime > 60000 && _wishLive) {
            logger.error(heartStopTime, _wishLive);//
            this.stopHeartBeat();
            this.startHeartBeat();
        }
    }
}

/*
 *继承事件处理器
 */
util.inherits(HeartBeatProcessor, events.EventEmitter);
/*
 *继承数据处理器
 */
util.inherits(HeartBeatProcessor, base.ProcessorBase);
/*
 *全局声明
 */
module.exports = HeartBeatProcessor;