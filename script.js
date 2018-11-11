class Logger {

  constructor(fn, ...l) {
    this.log = [];
    this.session = 0;

    let _this = this
    if (typeof fn === 'function') {
      l.forEach(function(x){
        _this.augment(x, fn)
      });
    }
  }

  get getlog() {
    return this.log;
  }

  static logToString(log) {
    return log
      .map(function([namespace, name, session, date, ...rest])
	      {return "" + namespace + " " + name + " " + session + " " + date})
      .join('\n')
  }

  augment(namespace, withFn) {
    // inspired by: Wayne Burkett https://stackoverflow.com/a/5034657/9854053
    //if (this.logger_count.length>0) throw new Error("multiple loggers is unsafe");
    this.logged_namespaces.push(namespace);
    let _this = this;
    let namespacename = namespace.name || "window"
    var name, fn;
    for (name in namespace) {
      fn = namespace[name];
      if (typeof fn === 'function') {
        namespace[name] = (function (name, fn) {
          var args = arguments;
          let res = function () {
            withFn.apply(this, [_this, namespacename, name, arguments]);
            return fn.apply(this, arguments);
          }
          for (let e in fn) {
            res[e] = fn[e]
          }
          return res
        })(name, fn);
      }
    }
  }

  shake(namespace,n=1,k) {
    function tryApply(key) {
      try {
        namespace[key]()
      } catch (error) { }
    }

    // inspired by: Niet the Dark Absol https://stackoverflow.com/a/20589234/9854053
    var keys;
    if (Object.keys) keys = Object.keys(namespace);
    else keys = (function (obj) {
      var k, ret = [];
      for (k in obj)
        if (obj.hasOwnProperty(k))
          ret.push(k);
      return ret;
    })(namespace);
    keys.sort(function () { return Math.random() - 0.5; });
    keys = keys.slice(0,k)
    for(let i=0; i<n; i++){
      keys.sort(function () { return Math.random() - 0.5; });
      this.session=Math.random();
      if (keys.forEach) keys.forEach(tryApply);
      else (function () { for (var i = 0, l = keys.length; i < l; i++) tryApply(keys[i]); })();
    }
  }
}
Logger.prototype.logged_namespaces = [];

// Adding log after init
// let logger = new Logger()

// logger.augment($, function (_this, name, args) {
//   console.log(_this);
//   let date = (new Date()).toISOString()
//   console.log(name + " " + date + " " + Array.prototype.join.call(args));
//   _this.log.push([name, date, args]);
// });

// logger.augment(this, function (_this, name, args) {
//   console.log(_this);
//   let date = (new Date()).toISOString()
//   console.log(name + " " + date + " " + Array.prototype.join.call(args));
//   _this.log.push([name, date, args]);
// });

let logger = new Logger(
  function (_this, namespace, name, args) {
    console.log(_this);
    let date = Date.now()
    console.log(namespace + " " + name + " " + _this.session + " " + date + " " + Array.prototype.join.call(args));
    _this.log.push([namespace, name, _this.session, date, args]);
  },
  $,
  this)
