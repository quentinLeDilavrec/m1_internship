'use strict';

debugger;
//import { DEFAULT_ENCODING } from "crypto";

// import { getHeapSnapshot } from "v8";

(function(){function p(a){this.data="";this.a=0;if("string"===typeof a)this.data=a;else if(b.D(a)||b.L(a)){a=new Uint8Array(a);try{this.data=String.fromCharCode.apply(null,a)}catch(f){for(var v=0;v<a.length;++v)this.M(a[v])}}else if(a instanceof p||"object"===typeof a&&"string"===typeof a.data&&"number"===typeof a.a)this.data=a.data,this.a=a.a;this.v=0}function w(a,f,b){for(var d,c,h,m,g,k,e,r,n,l,t,q,u,p=b.length();64<=p;){for(g=0;16>g;++g)f[g]=b.getInt32();for(;64>g;++g)d=f[g-2],d=(d>>>17|d<<15)^
  (d>>>19|d<<13)^d>>>10,c=f[g-15],c=(c>>>7|c<<25)^(c>>>18|c<<14)^c>>>3,f[g]=d+f[g-7]+c+f[g-16]|0;k=a.g;e=a.h;r=a.i;n=a.j;l=a.l;t=a.m;q=a.o;u=a.s;for(g=0;64>g;++g)d=(l>>>6|l<<26)^(l>>>11|l<<21)^(l>>>25|l<<7),h=q^l&(t^q),c=(k>>>2|k<<30)^(k>>>13|k<<19)^(k>>>22|k<<10),m=k&e|r&(k^e),d=u+d+h+x[g]+f[g],c+=m,u=q,q=t,t=l,l=n+d|0,n=r,r=e,e=k,k=d+c|0;a.g=a.g+k|0;a.h=a.h+e|0;a.i=a.i+r|0;a.j=a.j+n|0;a.l=a.l+l|0;a.m=a.m+t|0;a.o=a.o+q|0;a.s=a.s+u|0;p-=64}}var m,y,e,b=m=m||{};b.D=function(a){return"undefined"!==typeof ArrayBuffer&&
  a instanceof ArrayBuffer};b.L=function(a){return a&&b.D(a.buffer)&&void 0!==a.byteLength};b.G=p;b.b=p;b.b.prototype.H=function(a){this.v+=a;4096<this.v&&(this.v=0)};b.b.prototype.length=function(){return this.data.length-this.a};b.b.prototype.M=function(a){this.u(String.fromCharCode(a))};b.b.prototype.u=function(a){this.data+=a;this.H(a.length)};b.b.prototype.c=function(a){this.u(String.fromCharCode(a>>24&255)+String.fromCharCode(a>>16&255)+String.fromCharCode(a>>8&255)+String.fromCharCode(a&255))};
  b.b.prototype.getInt16=function(){var a=this.data.charCodeAt(this.a)<<8^this.data.charCodeAt(this.a+1);this.a+=2;return a};b.b.prototype.getInt32=function(){var a=this.data.charCodeAt(this.a)<<24^this.data.charCodeAt(this.a+1)<<16^this.data.charCodeAt(this.a+2)<<8^this.data.charCodeAt(this.a+3);this.a+=4;return a};b.b.prototype.B=function(){return this.data.slice(this.a)};b.b.prototype.compact=function(){0<this.a&&(this.data=this.data.slice(this.a),this.a=0);return this};b.b.prototype.clear=function(){this.data=
  "";this.a=0;return this};b.b.prototype.truncate=function(a){a=Math.max(0,this.length()-a);this.data=this.data.substr(this.a,a);this.a=0;return this};b.b.prototype.N=function(){for(var a="",f=this.a;f<this.data.length;++f){var b=this.data.charCodeAt(f);16>b&&(a+="0");a+=b.toString(16)}return a};b.b.prototype.toString=function(){return b.I(this.B())};b.createBuffer=function(a,f){void 0!==a&&"utf8"===(f||"raw")&&(a=b.C(a));return new b.G(a)};b.J=function(){for(var a=String.fromCharCode(0),b=64,e="";0<
  b;)b&1&&(e+=a),b>>>=1,0<b&&(a+=a);return e};b.C=function(a){return unescape(encodeURIComponent(a))};b.I=function(a){return decodeURIComponent(escape(a))};b.K=function(a){for(var b=0;b<a.length;b++)if(a.charCodeAt(b)>>>8)return!0;return!1};var z=y=y||{};e=e||{};e.A=e.A||{};e.F=e.A.F=z;z.create=function(){A||(n=String.fromCharCode(128),n+=m.J(),x=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,
  3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,
  3204031479,3329325298],A=!0);var a=null,b=m.createBuffer(),e=Array(64),d={algorithm:"sha256",O:64,P:32,w:0,f:[0,0],start:function(){d.w=0;d.f=[0,0];b=m.createBuffer();a={g:1779033703,h:3144134277,i:1013904242,j:2773480762,l:1359893119,m:2600822924,o:528734635,s:1541459225};return d}};d.start();d.update=function(c,h){"utf8"===h&&(c=m.C(c));d.w+=c.length;d.f[0]+=c.length/4294967296>>>0;d.f[1]+=c.length>>>0;b.u(c);w(a,e,b);(2048<b.a||0===b.length())&&b.compact();return d};d.digest=function(){var c=m.createBuffer();
  c.u(b.B());c.u(n.substr(0,64-(d.f[1]+8&63)));c.c(d.f[0]<<3|d.f[0]>>>28);c.c(d.f[1]<<3);var h={g:a.g,h:a.h,i:a.i,j:a.j,l:a.l,m:a.m,o:a.o,s:a.s};w(h,e,c);c=m.createBuffer();c.c(h.g);c.c(h.h);c.c(h.i);c.c(h.j);c.c(h.l);c.c(h.m);c.c(h.o);c.c(h.s);return c};return d};var n=null,A=!1,x=null;window.forge_sha256=function(a){var f=e.F.create();f.update(a,b.K(a)?"utf8":void 0);return f.digest().N()}})();


function logInterception(...args){ 
  // console.log(...args)
}

function logMO(...args){ 
  console.log(...args)
}

class IrohLogger {

  constructor(fn, ...l) {
    if (l.length > 0) console.error("For now Iroh logger can only instrument everythings")
    this.log = [];
    this.session = 0;

    let _this = this
    // setInterval(function () { _this.postLogs(100); }, 2000);

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
        // logMO(code)
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
        // logMO("---", url, window.location.host)
        return tmp.host === window.location.host
      }

      const observer = new MutationObserver(
        // Callback function to execute when mutations are observed
        function MOcallback(mutationsList, observer) {
          logMO(mutationsList)
          let ml = mutationsList
            .map(x => [...x.addedNodes].filter(x => x.nodeName == 'SCRIPT'))
            // .filter(x=>x.length<=0)
            .reduce((x, acc) => [...x, ...acc], [])
          ml.forEach(x => {
            const re = /^(https?\:\/\/localhost\:8000\/.*|.*_jsonp_[0-9]+)$/g;
            if (x.src.match(re)
              || x.src === "https://cdn.rawgit.com/maierfelix/Iroh/master/dist/iroh-browser.js"
              || x.src === "https://secure.quantserve.com/quant.js"
              || (x.src.trim() === "" && x.innerHTML.trim() === "")) {
              return;
            }
            if (x.src === "") {
              x.innerHTML = `irohLogger.augment(\`${code_escape(x.innerHTML)}\`);`
              // src = src || forge_sha256(code).slice(0,15);
              x.oldsrc = x.src
              x.removeAttribute("src")
            } else if (isLocal(x.src) ) {
              // logMO("yes")
              x.innerHTML = `irohLogger.augment(\`${code_escape(getcode(x.src))}\`,\`${x.src}\`);`
              x.oldsrc = x.src
              x.removeAttribute("src")
            } else {
              // logMO("no")
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

  augment(code, src){
    //if(typeof Iroh !== 'undefined'){
      src = src || forge_sha256(code).slice(0,15);
      debugger;
      let stage = new Iroh.Stage(code);
      let listener = stage.addListener(Iroh.CALL)
      listener.on("before", (e) => {
        this.fn(irohLogger,src,"window",e)
      });
      eval.call(window,stage.script);
    // } else {
    //   eval.call(window,code);
    // }
  }

  postLogs(n) {
    const value = this.log.splice(0, Math.max(n,Math.min(this.log.length / 2 + 1,1000)));
    if (value.length === 0) return
    var xhr = new XMLHttpRequest();
    xhr.open("POST", 'http://localhost:8000', true);

    //Send the proper header information along with the request
    xhr.setRequestHeader("Content-Type", "json");

    xhr.onreadystatechange = function () { // Call a function when the state changes.
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        // Request finished. Do processing here.
        logInterception("message sent")
      }
    }
    logInterception(value)
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
  function (_this, src, namespace, likeIroh) {
    let date = Date.now()
    logInterception(src, namespace, _this.session, likeIroh)
    _this.log.push([namespace, _this.session, date, {"src":src,"name":likeIroh.name, "hash":likeIroh.hash, "argslength":likeIroh.arguments.length}/*likeIroh*/]);
    // if (_this.log.length>2000) 
      _this.postLogs(1000)
  }
)