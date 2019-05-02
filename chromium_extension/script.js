// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const Iroh_s = document.createElement("script")
Iroh_s.src = "https://cdn.rawgit.com/maierfelix/Iroh/master/dist/iroh-browser.js"

const loadJSONP_s = document.createElement("script")

loadJSONP_s.innerHTML = `
const loadJSONP = (function(){
  var unique = 0;
  return function(url, callback, context) {
    // INIT
    const name = "_jsonp_" + unique++;
    if (url.match(/\\?/)) url += "&callback="+name;
    else url += "?callback="+name;
    
    // Create script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    
    // Setup handler
    window[name] = function(data){
      alert(data)
      console.log(data)
      callback.call((context || window), data);
      //document.documentElement.removeChild(script);
      //script = null;
      //delete window[name];
    };
    
    // Load JSON
    document.documentElement.appendChild(script);
  };
})();
`

const s = document.createElement("script")

function f() {
  let load_order = 0

  const l = []

  // Select the node that will be observed for mutations
  const targetNode = document

  // Options for the observer (which mutations to observe)
  const config = {childList: true, subtree: true };


  // var xhr = new XMLHttpRequest();
  // xhr.open("GET",\`${x.src}\`,false);
  // xhr.send(null);
  // if (xhr.status === 200) {
  //   code = xhr.responseText
  // }

  // if(typeof Iroh !== 'undefined'){
  // } else {
  //   return eval.call(window,code);
  // }

  function getcode(url){
    if (url.slice(0,4) === "http") {
      // url = 'https://cors-anywhere.herokuapp.com/'+url
    } else if (url !== "") {throw ("not http" + url + "a")}
    let code = ""
    let xhr = new XMLHttpRequest();
    xhr.open("GET",url,false);
    xhr.send(null);
    if (xhr.status === 200) {
      code = xhr.responseText
    }
    console.log(code)
    return code
  }

  function code_escape(str) {
    return ((""+str)
    .replace(/\\/g,"\\\\")
    .replace(/`/g,"\\`"))
  }

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(
  // Callback function to execute when mutations are observed
    function MOcallback(mutationsList, observer) {
      let ml = mutationsList
        .map(x=>[...x.addedNodes].filter(x=>x.nodeName == 'SCRIPT'))
        // .filter(x=>x.length<=0)
        .reduce((x,acc)=>[...x,...acc],[])
      ml.forEach(x=>{
        const re = /^.*_jsonp_[0-9]+$/g;
        if(x.src.match(re)
        || x.src==="https://cdn.rawgit.com/maierfelix/Iroh/master/dist/iroh-browser.js"
        || x.src==="https://secure.quantserve.com/quant.js"
        || (x.src.trim()==="" && x.innerHTML.trim()==="")){
          return;
        }
        alert(x.innerHTML)
        randv = Math.random()
        x.innerHTML= `
        (function(){
          function onReady(everythingElse){
            let interval = setInterval(function(){
              if (Object.values(document.scripts_loaded).find(x=>x["i"]<${load_order})!==undefined) return;
              if(typeof Iroh === 'undefined') return;
              clearInterval(interval);
              everythingElse();
              delete document.scripts_loaded[\`${randv}\`]
            },5000);
          };

          function instrument(code) {
            console.log(code)
            onReady(function(){
              // if(typeof Iroh !== 'undefined'){
                console.log(code)
                let stage = new Iroh.Stage(code);
                let listener = stage.addListener(Iroh.CALL)
                listener.on("before", (e) => {
                  console.log(e)
                });
                console.log(42,stage.script)
                eval.call(window,stage.script);
              // } else {
              //   eval.call(window,code);
              // }
            });
          }
          if (\`${x.src}\` !== "") {
            if (typeof(document.scripts_loaded) === 'undefined') document.scripts_loaded={}
            document.scripts_loaded[\`${randv}\`] = {"i":${load_order}}
            try{
              if(false){
                loadJSONP(
                  \`${x.src}\`,
                  x => {alert(x);instrument(x)}
                );
              } else {
                instrument(\`${(x.src !== "")?code_escape(getcode(x.src)):""}\`)
              }
            } catch (e) {
              console.log(e)
              document.getElementById("id_${""+randv}").src = \`${x.src}\`
              delete document.scripts_loaded[\`${randv}\`]
            }
          } else {
            instrument(\`${code_escape(x.innerHTML)}\`);
          }
        })();`
        load_order++;
        x.id="id_"+randv
        x.removeAttribute("src")
      })
        // for(var mutation of mutationsList) {
        //   if (mutation.type == 'childList' && mutation.target.nodeName == 'SCRIPT') {
        //     l.push(mutation)
        //     console.log()
        //     console.log()
        //     console.log()
        //     console.log(mutation.target.nodeName)
        //     console.log(Array.from(document.querySelectorAll('script')).map(x=>x))
        //     if (mutation.target.src)
        //       console.log(mutation.target.src)
        //     if (mutation.target.nodeName == 'SCRIPT')
        //       console.log(mutation.target)
        //     }
        //   }
    }
  );

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);
}

s.innerHTML = f.toString() + "\nf();"; 

document.documentElement.prepend(Iroh_s,loadJSONP_s,s);