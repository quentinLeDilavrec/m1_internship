'use strict';

const way = "Iroh" // "Basic"
let scripts = []

if (way === "Iroh") {
  const Iroh_s = document.createElement("script")
  Iroh_s.src = "https://cdn.rawgit.com/maierfelix/Iroh/master/dist/iroh-browser.js"
  Iroh_s.async = false;
  Iroh_s.type = "text/javascript"
  scripts.push(Iroh_s)
}

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
  return code
}

function f() {
  alert("in f")
  const l = []

  // Select the node that will be observed for mutations
  const targetNode = document

  // Options for the observer (which mutations to observe)
  const config = { childList: true, subtree: true };

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

  function code_escape(str) {
    return (("" + str)
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`"))
  }

  alert(0)

  // Create an observer instance linked to the callback function
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
        randv = Math.random()
        if (x.src === "") {
          x.innerHTML = `'use strict';
(function(){
  function instrument(code) {
      if(typeof Iroh !== 'undefined'){
        let stage = new Iroh.Stage(code);
        let listener = stage.addListener(Iroh.CALL)
        listener.on("before", (e) => {
          console.log(e)
        });
        eval.call(window,stage.script);
      } else {
        eval.call(window,code);
      }
  }
  instrument(\`${code_escape(x.innerHTML)}\`);
})();`
          x.id = "id_" + randv
          x.removeAttribute("src")
        } else {
          //x.src = "http://localhost:8000/?url=" + escape(x.src)
          x.innerHTML = `'use strict';
          (function(){
            function instrument(code) {
                if(typeof Iroh !== 'undefined'){
                  let stage = new Iroh.Stage(code);
                  let listener = stage.addListener(Iroh.CALL)
                  listener.on("before", (e) => {
                    console.log(e)
                  });
                  eval.call(window,stage.script);
                } else {
                  eval.call(window,code);
                }
            }
            instrument(\`${code_escape(getcode(x.src))}\`);
          })();`
          x.removeAttribute("src")
        }
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

  window.observer = observer

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);

};

const s = document.createElement("script")
const url = "http://localhost:8000/" + way + "MutationObserver" + "Logger/script.js";
s.innerHTML = getcode(url)
s.async = false;
s.type = "text/javascript"
scripts.push(s)

document.documentElement.prepend(...scripts);