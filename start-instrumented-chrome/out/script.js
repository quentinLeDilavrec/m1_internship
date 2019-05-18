"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer = require("puppeteer");
(() => __awaiter(this, void 0, void 0, function* () {
    const options = { headless: false };
    const browser = yield puppeteer.launch(Object.assign({}, options, { args: puppeteer.defaultArgs(options) }));
    const page = yield browser.newPage();
    //const devtoolsProtocolClient = await page.target().createCDPSession();
    //await devtoolsProtocolClient.send('Overlay.setShowFPSCounter', { show: true });
    var devtoolsProtocolClient = yield page.target().createCDPSession();
    // great for setting eval page.evaluateOnNewDocument
    // great for async trace sending page.mainFrame
    // usefull to request content of scripts page.setBypassCSP
    //console.log(page.tracing);
    // await page.goto('http://localhost:8888');
    yield page.evaluateOnNewDocument(function _MO_instantiator() {
        debugger;
        let i = 0;
        const observer = new MutationObserver(function _mutation_handler(mutationsList, observer) {
            // communicate with node through console.log method
            // console.log('__mutation')
            let script_met = [];
            mutationsList
                .map(x => [...x.addedNodes.values()].filter(x => x.nodeName == 'SCRIPT'))
                .reduce((x, acc) => [...x, ...acc], [])
                .forEach((x) => {
                let url;
                if (x.hasAttribute("src")) {
                    url = x.getAttribute("src");
                }
                else {
                    url = `_inline_${i++}`;
                    x.innerHTML += `
//# sourceURL=${url}`;
                }
                script_met.push(url);
                //x.removeAttribute("src")//.setAttribute("src","");
            });
            if (script_met.length > 0) {
                debugger;
            }
        });
        const config = {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true
        };
        observer.observe(document, config);
    });
    yield devtoolsProtocolClient.send('Debugger.setBreakpointByUrl', { lineNumber: 0, urlRegex: ".*", columnNumber: 0 })
        .catch(function (err) { console.error(err); });
    var _debugger = yield devtoolsProtocolClient.send('Debugger.enable').catch(function (err) { console.error(err); });
    console.log("debugger", _debugger);
    var _runtime = yield devtoolsProtocolClient.send('Runtime.enable').catch(function (err) { console.error(err); });
    console.log("runtime", _runtime);
    devtoolsProtocolClient.on('Debugger.paused', (msg) => __awaiter(this, void 0, void 0, function* () {
        console.log(111111111111849684, msg);
        // if (msg.callFrames.length > 1 && msg.callFrames[1].functionName === '_mutation_handler') {
        if (msg.callFrames[0].functionName === '_mutation_handler') {
            console.log(2222222222222, msg.callFrames[0].location);
            const names = yield devtoolsProtocolClient.send('Runtime.globalLexicalScopeNames').catch(function (err) { console.error(err); });
            yield console.log(names);
            const eee = yield devtoolsProtocolClient.send('Debugger.evaluateOnCallFrame', { callFrameId: msg.callFrames[0].callFrameId, expression: "JSON.stringify(script_met)" }).catch(function (err) { console.error(err); });
            const scripts = JSON.parse(eee["result"]["value"]);
            console.log(111, scripts);
            for (const a of scripts) {
                console.log(a);
                console.log(468465);
            }
            //await devtoolsProtocolClient.send('Debugger.resume').catch(function (err) { console.error(err); });
            // await devtoolsProtocolClient.send('Debugger.stepOut').catch(function (err) { console.error(err); });
            // await devtoolsProtocolClient.send('Debugger.stepOut').catch(function (err) { console.error(err); });
            // await devtoolsProtocolClient.send('Debugger.stepOver').catch(function (err) { console.error(err); });
            // await devtoolsProtocolClient.send('Debugger.stepOver').catch(function (err) { console.error(err); });
            // await devtoolsProtocolClient.send('Debugger.stepOver').catch(function (err) { console.error(err); });
        }
        else if (msg.callFrames[0].functionName === '_MO_instantiator') {
            yield devtoolsProtocolClient.send('Debugger.resume').catch(function (err) { console.error(err); });
            console.log(222, msg.callFrames[0].functionName);
        }
        else if (msg.callFrames[0].url.slice(0, 8) === '_inline_') {
            console.log(333, msg);
            //const def = await devtoolsProtocolClient.send('Debugger.setScriptSource', { "scriptId": `${msg.callFrames[0].location.scriptId}`, "scriptSource": "alert('aaa')" }).catch(function (err) { console.error(err); });
            //console.log(def)
            //await devtoolsProtocolClient.send('Debugger.resume').catch(function (err) { console.error(err); });
        }
        else {
            console.log(444, msg.callFrames[0].functionName);
        }
        // }
    }));
    // devtoolsProtocolClient.on('Runtime.consoleAPICalled', async (msg) => {
    //   if (msg.type === 'log' && msg.args[0].value === '__mutation') {
    //     console.log(97987987987,msg)
    //     await devtoolsProtocolClient.send("Debugger.pause").catch(function (err) { console.error(err); });
    //     console.log("aaaaaaaaaaaaa",msg)
    //   }
    // })
    // async function handleScriptParsed(x: any) {
    //   console.log(x);
    //   const abc = await devtoolsProtocolClient.send('Debugger.getScriptSource', { "scriptId": `${x.scriptId}` })
    //   //console.log("abc", abc)
    //   const def = await devtoolsProtocolClient.send('Debugger.setScriptSource', { "scriptId": `${x.scriptId}`, "scriptSource": "alert('aaa')" })
    //   console.log("def", def)
    //   // const ghi = await devtoolsProtocolClient.send('Runtime.runScript', { "scriptId": x.scriptId, "executionContextId": x.executionContextId }).catch(function (err) { console.error(err); });
    //   // console.log("ghi", ghi)
    // }
    // devtoolsProtocolClient.on('Debugger.scriptParsed', handleScriptParsed);
    // var eval_bind = await devtoolsProtocolClient.send('Runtime.addBinding', { "name": "eval" }).catch(function (err) { console.error(err); });
    // console.log("+++", eval_bind);
    // var eval_bind2 = await devtoolsProtocolClient.send('Runtime.addBinding', { "name": "globalThis.eval" }).catch(function (err) { console.error(err); });
    // console.log("++++", eval_bind2);
    // devtoolsProtocolClient.on('Runtime.bindingCalled', function (x) { return console.log("=+=", x); });
    // setInterval(async () => {
    //   const names = await devtoolsProtocolClient.send('Runtime.globalLexicalScopeNames').catch(function (err) { console.error(err); })
    //   await console.log(names)
    // }, 5000);
    yield page.goto('file:///home/quentin/Documents/cours/M1/stage/ongit/start-instrumented-chrome/index.html').catch(function (err) { console.error(err); });
    yield page.evaluate(function () {
        console.log("written in the puppeteer");
    }).catch(function (err) { console.error(err); });
    ;
}))();
