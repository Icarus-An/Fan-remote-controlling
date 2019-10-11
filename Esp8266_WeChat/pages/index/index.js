var app = getApp()
var _self
var util = require('../../mqtt/util.js')
var {
  Client,
  Message
} = require('../../mqtt/paho-mqtt.js')

Page({
  data: {
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    client: null,
    isOpen: false,
    windValue: 0,
    valueSlier: 0,
    valuePic: '../pic/fan_off.jpg',

  },
  randomString: function(len) {　　
    len = len || 32;　　
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';　
    var maxPos = $chars.length;　　
    var pwd = '';
    for (let i = 0; i < len; i++) {
      pwd += $chars.charAt(Math.floor(Math.random() * maxPos));　　
    }　　
    return pwd;
  },
  subscribe: function(filter, subscribeOptions) {
    // 订阅
    var client = this.data.client;
    if (client && client.isConnected()) {
      console.log("订阅成功");
      return client.subscribe(filter, subscribeOptions);
    }
    wx.showToast({
      title: '订阅失败',
      icon: 'success',
      duration: 2000
    })
  },
  publish: function(topic, message, qos = 0, retained = false) {
    var client = this.data.client;
    if (client && client.isConnected()) {
      var message = new Message(message);
      message.destinationName = topic;
      message.qos = qos;
      message.retained = retained;
      console.log("发布成功");
      return client.send(message);
    }

  },
  setOnMessageArrived: function(onMessageArrived) {
    if (typeof onMessageArrived === 'function') {
      this.data.onMessageArrived = onMessageArrived
    }
  },
  setOnConnectionLost: function(onConnectionLost) {
    if (typeof onConnectionLost === 'function') {
      this.data.onConnectionLost = onConnectionLost
    }
  },
  eventSlider: function(e) {
    console.log("发生 change 事件，携带值为:" + e.detail.value);
    this.setData({
      windValue: e.detail.value
    })
    var obj = new Object();
    obj.change = "pwm";
    obj.value = e.detail.value;
    this.publish(app.globalData.pubTopic, JSON.stringify(obj), 1, false)
  },
  onSwitch: function(e) {
    console.log("onSwitch success :" + e.detail.value);
    var jsonObj = new Object();
    jsonObj.change = "power";
    jsonObj.value = "" + e.detail.value + "";
    this.publish(app.globalData.pubTopic, JSON.stringify(jsonObj), 1, false)
  },
  onLoad: function(options) {
    _self = this;
    _self.connect();
  },

  connect: function() {

    var that = this;
    var client = new Client(app.globalData.server_domain, "DeviceId-7zne322b0g");

    client.connect({

      useSSL: true,
      cleanSession: true,
      keepAliveInterval: 60,
      userName: 'vvfs3e0/wechatapp',
      password: 'TpWpCf5OEAA821a6',
      onSuccess: function() {

        wx.showToast({
          title: '连接成功'
        })

        that.data.client = client

        client.onMessageArrived = function(msg) {
          if (typeof that.data.onMessageArrived === 'function') {
            return that.data.onMessageArrived(msg)
          }
          console.log("收到消息：" + msg.payloadString);
          var jsonObj = JSON.parse(msg.payloadString);

          if (typeof jsonObj.power == "boolean")
            console.log("解析 power :" + jsonObj.power);

          if (typeof jsonObj.windSpeed == "number")
            console.log("解析 windSpeed ：" + jsonObj.windSpeed);

          var temp;
          if (jsonObj.power == true) {
            temp = '../pic/fan_on.jpg';
          } else
            temp = '../pic/fan_off.jpg';

          that.setData({
            valueSlier: jsonObj.windSpeed,
            windValue: jsonObj.windSpeed,
            isOpen: jsonObj.power,
            valuePic:temp,
          })
        }

        that.subscribe(app.globalData.subTopic, {
          qos: 1
        })

        client.onConnectionLost = function(responseObject) {

          if (typeof that.data.onConnectionLost === 'function') {
            return that.data.onConnectionLost(responseObject)
          }
          if (responseObject.errorCode !== 0) {
            console.log("onConnectionLost:" + responseObject.errorMessage);
            //检测到与服务器断开连接，设置定时函数一秒后重新连接服务器
            setTimeout(function() {
              _self.connect();
            }, 1000)
          }
        }

        // 延迟1.5s后主动查询最新状态，保证界面是最新状态
        setTimeout(function () {
          var obj = new Object();
          obj.change = "query";
          obj.value = 0;
          //that.publish(app.globalData.pubTopic, JSON.stringify(obj), 1, false)
        }, 1500)

        var obj = new Object();
        obj.change = "query";
        obj.value = 0;
        that.publish(app.globalData.pubTopic, JSON.stringify(obj), 1, false)
    
      }
    });
  }
})