'use strict';

import { getHeapSnapshot } from "v8";

class IrohLogger {

  constructor(fn, ...l) {
    if (l.length > 0) console.error("For now Iroh logger can only instrument everythings")
    this.log = [];
    this.session = 0;

    let _this = this
    setInterval(function () { _this.postLogs(100); }, 2000);

    if (typeof fn === 'function') {
      this.fn = fn
      // use it for local script
      function getcode(url) {
        if (url.slice(0, 4) === "http") {
          // url = 'https://cors-anywhere.herokuapp.com/'+url
        } else if (url !== "") { throw ("not http" + url + "a") }
        let code = ""
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send(null);
        if (xhr.status === 200) {
          code = xhr.responseText
        }
        console.log(code)
        return code
      }

      function code_escape(str) {
        return (("" + str)
          .replace(/\\/g, "\\\\")
          .replace(/`/g, "\\`"))
      }

      function isLocal(url){
        const tmp = document.createElement("a")
        tmp.href=url
        return tmp.host !== window.location.host
      }

      const observer = new MutationObserver(
        // Callback function to execute when mutations are observed
        function MOcallback(mutationsList, observer) {
          let ml = mutationsList
            .map(x => [...x.addedNodes].filter(x => x.nodeName == 'SCRIPT'))
            // .filter(x=>x.length<=0)
            .reduce((x, acc) => [...x, ...acc], [])
          ml.forEach(x => {
            console.log(x)
            const re = /^(http\:\/\/localhost\:8000\/.*|.*_jsonp_[0-9]+)$/g;
            if (x.src.match(re)
              || x.src === "https://cdn.rawgit.com/maierfelix/Iroh/master/dist/iroh-browser.js"
              || x.src === "https://secure.quantserve.com/quant.js"
              || (x.src.trim() === "" && x.innerHTML.trim() === "")) {
              return;
            }
            if (x.src === "") {
              x.innerHTML = `irohLogger.augment(\`${code_escape(x.innerHTML)}\`);`
              x.removeAttribute("src")
            } else if (isLocal(x.src) ) {
              x.innerHTML = `irohLogger.augment(\`${code_escape(getcode(x.src))}\`);`
              x.removeAttribute("src")
            } else {
              x.src = "http://localhost:8000/?url=" + escape(x.src)
            }
          })
        }
      );

      // Select the node that will be observed for mutations
      const targetNode = document

      // Options for the observer (which mutations to observe)
      const config = { childList: true, subtree: true };

      // Start observing the target node for configured mutations
      observer.observe(targetNode, config);
    }
  }

  augment(code){
    if(typeof Iroh !== 'undefined'){
      let stage = new Iroh.Stage(code);
      let listener = stage.addListener(Iroh.CALL)
      listener.on("before", (e) => {
        this.fn(irohLogger,"window",e)
      });
      eval.call(window,stage.script);
    } else {
      eval.call(window,code);
    }
  }

  postLogs(n) {
    const value = this.log.splice(0, this.log.length / 2 + 1);
    if (value.length === 0) return
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
    const replacer = function (depth = Number.MAX_SAFE_INTEGER) {
      let objects, stack, keys;
      return function (key, value) {
        //  very first iteration
        if (key === '') {
          keys = ['root'];
          objects = [{ keys: 'root', value: value }];
          stack = [];
          return value;
        }

        //  From the JSON.stringify's doc: "The object in which the key was found is 
        //  provided as the replacer's this parameter."
        //  Thus one can control the depth
        while (stack.length && this !== stack[0]) {
          stack.shift();
          keys.pop();
        }
        // console.log( keys.join('.') );

        let type = typeof value;
        if (type === 'boolean' || type === 'number' || type === 'string') {
          return value;
        }
        if (type === 'function') {
          return `[Function, ${value.length + 1} args]`;
        }
        if (value === null) {
          return 'null';
        }
        if (!value) {
          return undefined;
        }
        if (stack.length >= depth) {
          if (Array.isArray(value)) {
            return `[Array(${value.length})]`;
          }
          return '[Object]';
        }
        let found = objects.find(o => o.value === value);
        if (!found) {
          keys.push(key);
          stack.unshift(value);
          objects.push({ keys: keys.join('.'), value: value });
          return value;
        }
        //  actually, here's the only place where the keys keeping is useful
        return `[Duplicate: ${found.keys}]`;
      };
    };

    xhr.send(JSON.stringify(value, replacer(2)));
  }

  // Create an observer instance linked to the callback function


}

let irohLogger = new IrohLogger(
  function (_this, namespace, likeIroh) {
    let date = Date.now()
    console.log(namespace, _this.session, likeIroh)
    _this.log.push([namespace, _this.session, date, likeIroh]);
  }
)