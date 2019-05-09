class Logger {

  constructor(fn, ...l) {
    this.log = [];
    this.session = 0;

    let _this = this
    if (typeof fn === 'function') {
      l.forEach(function (x) {
        _this.augment(x, fn)
      });
    }
    setInterval(function(){ _this.postLogs(100); }, 5000);
  }

  static logToString(log) {
    return log
      .map(function ([namespace, session, date, likeIroh]) { return "" + namespace + " " + likeIroh.name + " " + session + " " + date })
      .join('\n')
  }

  get getlog() {
    return Logger.logToString(this.log);
  }

  augment(namespace, withFn) {
    // inspired by: Wayne Burkett https://stackoverflow.com/a/5034657/9854053
    //if (this.logger_count.length>0) throw new Error("multiple loggers is unsafe");
    this.logged_namespaces.push(namespace);
    let _this = this;
    let namespacename = namespace.name || (namespace === window) ? "window" : (namespace === document) ? "document" : undefined
    var name, fn;
    for (name in namespace) {
      if (namespace === window && (name === "localStorage" || name === "sessionStorage")) continue
      fn = namespace[name];
      if (typeof fn === 'function') {
        namespace[name] = (function (name, fn) {
          const args = arguments;
          let res = function () {
            const likeIroh = {}
            likeIroh.arguments = arguments
            likeIroh.call = fn
            likeIroh.context = this
            likeIroh.instance = namespace
            likeIroh.name = name
            // likeIroh.callee = 
            // likeIroh.category = 
            // likeIroh.external = 
            // likeIroh.hash = 
            // likeIroh.indent = 
            // likeIroh.location = 
            // likeIroh.node = 
            // likeIroh.object = 
            // likeIroh.type = 
            withFn.apply(this, [_this, namespacename, likeIroh]);
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
  
postLogs(n) {
  const value = this.log.splice(0, this.log.length/2+1);
  if(value.length===0) return
  var xhr = new XMLHttpRequest();
  xhr.open("POST", 'http://localhost:8000', true);

  //Send the proper header information along with the request
  xhr.setRequestHeader("Content-Type", "json");

  xhr.onreadystatechange = function () { // Call a function when the state changes.
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      // Request finished. Do processing here.
      console.log("message sent")
    }
  }
  console.log(value)
  const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if(value === window) return "window";
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };
  xhr.send(JSON.stringify(value,getCircularReplacer()));
}

  shake(namespace, n = 1, k) {
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
    keys = keys.slice(0, k)
    for (let i = 0; i < n; i++) {
      keys.sort(function () { return Math.random() - 0.5; });
      this.session = Math.floor(Math.random() * 100000);
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
  function (_this, namespace, likeIroh) {
    let date = Date.now()
    console.log(namespace, _this.session, likeIroh)
    _this.log.push([namespace, _this.session, date, likeIroh]);
  },
  $,
  window)
