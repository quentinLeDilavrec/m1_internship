'use strict';
(function () {
  const l = [];
  console.log("0")

  function code_escape(str) {
    return (("" + str)
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`"))
  }

  let ml = [...document.getElementsByTagName("script")]
    .forEach(x => {
      console.log("in IrohLogger main",x)
      const re = /^(http\:\/\/localhost\:8000\/.*|.*_jsonp_[0-9]+)$/g;
      if (x.src.match(re)
        || x.src === "https://cdn.rawgit.com/maierfelix/Iroh/master/dist/iroh-browser.js"
        || x.src === "https://secure.quantserve.com/quant.js"
        || (x.src.trim() === "" && x.innerHTML.trim() === "")) {
        return;
      }
      const randv = Math.random()
      if (x.src === "") {
        x.text = `'use strict';
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
if (\`${x.src}\` !== "") {
} else {
  instrument(\`${code_escape(x.innerHTML)};alert(1);\`);
}
})();`
        x.removeAttribute("src")
      } else {
        x.setAttribute("src", "http://localhost:8000/?url=" + escape(x.src))
      }
    })

})();
console.log("1")
