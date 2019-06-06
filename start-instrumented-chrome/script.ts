import * as puppeteer from "puppeteer";
import * as fs from "fs";
import Crdp from 'chrome-remote-debug-protocol'
import { types as btypes, PluginObj } from "@babel/core";
import * as Babel from "@babel/core";

type t_Babel = typeof Babel

function transformer_container(URL) {
  return function (Babel: t_Babel): PluginObj {
    let i = 0
    const btypes = Babel.types;
    type t_params = (btypes.ArrayPattern | btypes.AssignmentPattern | btypes.Identifier | btypes.RestElement | btypes.ObjectPattern | btypes.TSParameterProperty)


    function param2exp(param: t_params) {
      function toObjectE(
        x: (btypes.ObjectProperty | btypes.RestElement)
      ): (btypes.ObjectProperty | btypes.SpreadElement) {
        if (x.type === 'ObjectProperty') return x
        else if (x.type === 'RestElement') return undefined
      }
      if (param.type === "Identifier") return param
      else if (param.type === "ObjectPattern")
        return btypes.stringLiteral('TODO: ObjectPattern')
      // return btypes.objectExpression((param as btypes.ObjectPattern).properties.map(toObjectE))
      else if (param.type === "ArrayPattern")
        return btypes.stringLiteral('TODO: ArrayPattern')
      // return btypes.stringLiteral(param.type)
      return btypes.stringLiteral("TODO: " + param.type)
    }


    function make_logger_expr(
      curr_file: string,
      path: string,
      fn_val: btypes.Expression,
      ...params: (btypes.SpreadElement | btypes.Expression)[]) {
      if (curr_file === 'unknown') curr_file = undefined
      return btypes.expressionStatement(
        btypes.callExpression(
          btypes.identifier('globalThis.logger'),
          [btypes.arrayExpression(
            [
              btypes.stringLiteral(curr_file || URL),
              btypes.stringLiteral(path),
              fn_val,
              ...params])]))
    }


    return {
      name: "log-functions-usage",
      visitor: {
        FunctionDeclaration(path) {
          path.node.body.body.unshift(
            make_logger_expr((this as any).file.opts.filename,
              path.getPathLocation(),
              btypes.memberExpression(path.node.id, btypes.identifier("name")),
              btypes.spreadElement(
                btypes.identifier('arguments'))))
        },
        FunctionExpression(path) {
          let name = (path.node.loc) ?
            `anonymous_${i++}:` + path.node.loc.start.line + ':' + path.node.loc.start.column :
            `:anonymous_${i++}`;
          path.node.body.body.unshift(
            make_logger_expr(
              (this as any).file.opts.filename,
              path.getPathLocation(),
              btypes.stringLiteral(name),
              btypes.spreadElement(btypes.identifier('arguments'))))
        },
        ArrowFunctionExpression(path) {
          let v = make_logger_expr(
            (this as any).file.opts.filename,
            path.getPathLocation(),
            btypes.stringLiteral(`anonymous_${i++}:${path.node.loc.start.line}:${path.node.loc.start.column}`),
            ...path.node.params.map(param2exp));
          if (path.node.body.type === 'BlockStatement') {
            path.node.body.body.unshift(v)
          } else {
            path.node.body =
              btypes.blockStatement([v, btypes.returnStatement(path.node.body)])
          }
        }
      }
    };
  }
}

const babel_js_src = fs.readFileSync("babel.js", 'utf8')

function _MO_instantiator(transformer_container_str: string) {
  const binding = window['logger']

  const replacer = function( depth = Number.MAX_SAFE_INTEGER ) {
    let objects, stack, keys;
    return function( key, value ) {
      //  very first iteration
      if ( key === '' ) {
        keys = [ 'root' ];
        objects = [ { keys: 'root', value } ];
        stack = [];
        return value;
      }
  
      //  From the JSON.stringify's doc: "The object in which the key was found is
      //  provided as the replacer's this parameter."
      //  Thus one can control the depth
      while ( stack.length && this !== stack[ 0 ] ) {
        stack.shift();
        keys.pop();
      }
      // console.log( keys.join('.') );
  
      const type = typeof value;
      if ( type === 'boolean' || type === 'number' || type === 'string' ) {
        return value;
      }
      if ( type === 'function' ) {
        return `[Function, ${ value.length + 1 } args]`;
      }
      if ( value === null ) {
        return 'null';
      }
      if ( ! value ) {
        return undefined;
      }
      if ( stack.length >= depth ) {
        if ( Array.isArray( value ) ) {
          return `[Array(${ value.length })]`;
        }
        return '[Object]';
      }
      const found = objects.find( ( o ) => o.value === value );
      if ( ! found ) {
        keys.push( key );
        stack.unshift( value );
        objects.push( { keys: keys.join( '.' ), value } );
        return value;
      }
      // actually, here's the only place where the keys keeping is useful
      return `[Duplicate: ${ found.keys }]`;
    };
  };
  let log = [];
  const count = 2000;
  const rate = 1/50;
  const myCallPrinter = ( call ) => {
    return '' + call[ 0 ] + ( call.length > 1 ? ' ' + JSON.stringify( call.slice( 1 ), replacer( 0 ) ) : '' );
  };
  window["global"] = {};
  window["global"]["logger"] = window["logger"] = globalThis["logger"] = function (log) {
    log.push(log[0])
    if (log.length > count) {
      // binding('1'.repeat(count/rate))
      binding(log.map(myCallPrinter).join('\n'))
      log = [];
    }
  }
  global["logger"].push = function(){
    log.push(arguments[0])
    if (log.length > count) {
      binding(log.map(myCallPrinter).join('\n'))
      log = [];
    }
  }
  global["logger"].flush = function(){
    binding(log.map(myCallPrinter).join('\n'))
    log = [];
  }
  global["logger"].push(["a"]);
  global["logger"].log = () => log

  window.onbeforeunload = function(){
    binding(log.map(myCallPrinter).join('\n'))
    log = [];
 }

  let i = 0;
  let my_transformer = eval.call(this, '(()=>' + transformer_container_str + ')()')
  const observer = new MutationObserver(
    function _mutation_handler(mutationsList, observer) {
      // communicate with node through console.log method
      // console.log('__mutation')
      let script_met = []
      mutationsList
        .map(x => [...x.addedNodes].filter(x => x.nodeName == 'SCRIPT'))
        .reduce((x, acc) => [...x, ...acc], [])
        .forEach((x: HTMLElement) => {
          let url: string
          if (x.hasAttribute("src") || x.getAttribute("src") === "") {
            url = x.getAttribute("src")
          } else {
            url = `_inline_${i++}`;
            const transformed = Babel.transform(x.innerHTML, { plugins: [my_transformer(document.URL + ':' + url)] }).code
            //const transformed = Babel.transformSync(x.innerHTML, { plugins: [my_transformer] })
            x.innerHTML = transformed + `
//# sourceURL=${url}`
          }
          script_met.push(url)
          //x.removeAttribute("src")//.setAttribute("src","");
        })
      // if (script_met.length > 0) {
      //   debugger;
      // }
    })
  const config = {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
  }
  // observer.observe(document, config)
}

/**
 * Breaks on first line of every script files
 * get the content, add logging expression at start of every functions
 * @param page the page to instrument
 */
async function instrument_basic(page: puppeteer.Page) {
  // popup is an event creating a new tab
  page.on("popup", newpage => instrument_basic(newpage))
  //await client.send('Overlay.setShowFPSCounter', { show: true });
  const client = await page.target().createCDPSession();
  //Tracing don't get what I need (parameters)//await client.send('Tracing.start',{traceConfig:{enableArgumentFilter:false}})//, {/*transferMode:"ReturnAsStream",*/streamFormat:"proto",traceConfig:{enableArgumentFilter:false}}).catch(function (err) { console.error(err); });

  await client.send('Inspector.enable')
  client.on('Inspector.targetCrashed', console.error)
  // great for setting eval page.evaluateOnNewDocument
  // great for async trace sending page.mainFrame
  // usefull to request content of scripts page.setBypassCSP

  //load dependency for inline scripts modification
  await page.evaluateOnNewDocument(babel_js_src)
  await page.evaluateOnNewDocument(_MO_instantiator, transformer_container.toString())

  await client.send(
    'Debugger.setBreakpointByUrl',
    { lineNumber: 0, urlRegex: ".*", columnNumber: 0 })
    .catch(function (err) { console.error(err); })

  var _debugger = await client.send('Debugger.enable')
  console.log("debugger", _debugger);
  await client.send('Runtime.enable')
  client.on('Debugger.paused', async (msg) => {
    if (msg.callFrames[0].url === '__puppeteer_evaluation_script__') {
      await client.send('Debugger.resume')
    } else if (msg.hitBreakpoints.length > 0 && msg.hitBreakpoints.some((x: string) => x === "2:0:0:.*")) {
      let _source = await client.send('Debugger.getScriptSource', { scriptId: `${msg.callFrames[0].location.scriptId}` })
      let source = `"intercepted";` + await Babel.transformSync("" + _source["scriptSource"], { plugins: [transformer_container(msg.callFrames[0].url)] }).code
      await client.send('Debugger.setScriptSource', { scriptId: `${msg.callFrames[0].location.scriptId}`, scriptSource: source })
      // TODO refresh devTool window to refresh visible version of scripts
      // await client.send('Runtime.runScript',{ scriptId: `${msg.callFrames[0].location.scriptId}`}).catch(function (err) { console.error(err); });
      // let res = await client.send('Runtime.evaluate', { expression: "aaabbbccc();" }).catch(function (err) { console.error(err); });
      // await console.log(res)
      await client.send('Debugger.resume').catch(function (err) { console.error(err); });
      // let res2 = await client.send('Runtime.evaluate', { expression: "aaabbbccc();" }).catch(function (err) { console.error(err); });
      // await console.log(res2)
      // } else if (msg.callFrames[0].functionName === '_mutation_handler') { // if (msg.callFrames.length > 1 && msg.callFrames[1].functionName === '_mutation_handler') {
      //   console.log(2222222222222, msg.callFrames[0].location)
      //   const eee = await client.send(
      //     'Debugger.evaluateOnCallFrame',
      //     { callFrameId: msg.callFrames[0].callFrameId, expression: "JSON.stringify(script_met)" }).catch(function (err) { console.error(err); });
      //   const scripts = JSON.parse(eee["result"]["value"])
      //   console.log(111, scripts)
      //   for (const a of scripts) {
      //     console.log(a)
      //     console.log(468465)
      //   }
      //   //await client.send('Debugger.resume').catch(function (err) { console.error(err); });
      // } else if (msg.callFrames[0].functionName === '_MO_instantiator') {
      //   await client.send('Debugger.resume').catch(function (err) { console.error(err); });
      //   console.log(222, msg.callFrames[0].functionName)

    } else if (msg.callFrames[0].url.slice(0, 8) === '_inline_') {
      //const def = await client.send('Debugger.setScriptSource', { "scriptId": `${msg.callFrames[0].location.scriptId}`, "scriptSource": "alert('aaa')" }).catch(function (err) { console.error(err); });
      //console.log(def)
      //await client.send('Debugger.resume').catch(function (err) { console.error(err); });
    } else {
    }
    // }
  })
  // client.on('Runtime.consoleAPICalled', async (msg) => {
  //   if (msg.type === 'log' && msg.args[0].value === '__mutation') {
  //     console.log(97987987987,msg)
  //     await client.send("Debugger.pause").catch(function (err) { console.error(err); });

  //     console.log("aaaaaaaaaaaaa",msg)
  //   }
  // })
  // async function handleScriptParsed(x: any) {
  //   console.log(x);
  //   const abc = await client.send('Debugger.getScriptSource', { "scriptId": `${x.scriptId}` })
  //   //console.log("abc", abc)
  //   const def = await client.send('Debugger.setScriptSource', { "scriptId": `${x.scriptId}`, "scriptSource": "alert('aaa')" })
  //   console.log("def", def)
  //   // const ghi = await client.send('Runtime.runScript', { "scriptId": x.scriptId, "executionContextId": x.executionContextId }).catch(function (err) { console.error(err); });
  //   // console.log("ghi", ghi)
  // }
  // client.on('Debugger.scriptParsed', handleScriptParsed);
  // var eval_bind = await client.send('Runtime.addBinding', { "name": "eval" }).catch(function (err) { console.error(err); });
  // console.log("+++", eval_bind);
  // var eval_bind2 = await client.send('Runtime.addBinding', { "name": "globalThis.eval" }).catch(function (err) { console.error(err); });
  // console.log("++++", eval_bind2);
  // client.on('Runtime.bindingCalled', function (x) { return console.log("=+=", x); });
  // setInterval(async () => {
  //   const names = await client.send('Runtime.globalLexicalScopeNames').catch(function (err) { console.error(err); })
  //   await console.log(names)
  // }, 5000);
  //   let res = []
  //   client.on('Tracing.dataCollected', console.log)
  //   client.on('Tracing.tracingComplete', console.log)

  //   await setTimeout(async () => {
  //   let res = await client.send('Tracing.end').catch(function (err) { console.error(err); });
  //   await console.log(8494984984984,res)
  // }, 50000);
  return client
}


/**
 * Intercept requests for .js files,
 * replace original response with interceptions added to the functions
 * @param page the page to instrument
 */
async function instrument_fetch(page: puppeteer.Page, apply_babel = false) {
  page.on("popup", newpage => instrument_fetch(newpage))
  const client = await page.target().createCDPSession();

  const dirname = '/tmp/behaviorlogs/';//require('path').join(require('os').homedir(),'/js_intercept_data/browser/v2/');
  //fs.mkdirSync(dirname);
  //load dependency for inline scripts modification
  await page.evaluateOnNewDocument(babel_js_src)
  const file = fs.openSync(dirname + Math.random(), 'w')
  await page.exposeFunction("logger", function (data) {
    fs.appendFileSync(
      file,
      data+'\n',
      'utf-8' );
    fs.fdatasyncSync(file)
  });
  page.on("pageerror",async ()=> {
    console.log('closing')
    fs.closeSync(file);
  })
  page.on("close",async ()=> {
    console.log('closing')
    fs.closeSync(file);
  })

  await page.evaluateOnNewDocument(_MO_instantiator, transformer_container.toString())
  console.log(666)

  if(apply_babel){
    await client.send('Fetch.enable', { patterns: [{ resourceType: "Script", requestStage: "Response" }] })
    await client.on('Fetch.requestPaused', async ({
      requestId,
      request,
      frameId,
      resourceType,
      responseErrorReason,
      responseStatusCode,
      responseHeaders,
      networkId }) => {
      const r = await client.send('Fetch.getResponseBody', { requestId: requestId })
      let body: string = (r["base64Encoded"]) ? Buffer.from(r["body"], 'base64').toString() : r["body"]
      body = `"intercepted";` + Babel.transformSync("" + body, { plugins: [transformer_container(request.url)] }).code
      await client.send('Fetch.fulfillRequest', {
        requestId: requestId,
        responseCode: responseStatusCode || 200,
        responseHeaders: responseHeaders || [],
        body: ((r["base64Encoded"]) ? Buffer.from(body).toString('base64') : body)
      })
    })
  }

  return client
}

// Main
(async () => {
  // instanciating browser
  const options = { headless: false, dumpio:true, pipe: false };
  const launch_params = process.argv[2] === '--no-sandbox' ? [...puppeteer.defaultArgs(options), '--no-sandbox', '--disable-setuid-sandbox'] : puppeteer.defaultArgs(options);
  console.log(process.argv,launch_params);
  const browser = await puppeteer.launch({ ...options, args: launch_params})
  browser.on('disconnected',()=>console.log('finished'))
  // instanciating starting pages
  const [page] = await browser.pages()
  await instrument_fetch(page)
  await page.goto('localhost:8888/wp-login.php')
  // await page.evaluate(function () {
  //   console.log("written in the puppeteer");
  // }).catch(function (err) { console.error(err); });

  // const page2 = await browser.newPage()
  // await instrument_fetch(page2)
  // await page2.goto('file:///' + __dirname.split('/').slice(0, -1).join("/") + '/tests/basic/index.html')
})();
