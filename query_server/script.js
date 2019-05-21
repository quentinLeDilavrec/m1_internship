const http = require('http');
const url = require('url');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');

function getcode_sync(url) {
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

function getcode(url, callback) {
    if (url.slice(0, 4) === "http") {
        // url = 'https://cors-anywhere.herokuapp.com/'+url
    } else if (url !== "") { throw ("not http" + url + "a") }
    let code = ""
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText)
        }
    };
    xhr.open("GET", url, true);
    xhr.send(null);
}

function code_escape(str) {
    return (("" + str)
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`"))
}

function wrap(wrapper, url, callback) {
    switch (wrapper) {
        case "Iroh":
            getcode(url, code => {
                // if (url==="https://unpkg.com/lodash@4.17.11/lodash.min.js")
                callback(`irohLogger.augment(\`${code_escape(code)}\`);`)
            })
            break;

        default:
            callback("aaa")
            break;
    }
}

let server = http.createServer(function (request, response) {
    if (request.method == "GET") {
        const parsedurl = url.parse(request.url, true)
        const queryData = parsedurl.query;
        const path = parsedurl.pathname
        response.writeHead(200, { "Content-Type": "text/javascript" });

        if (path !== "/") {
            if (path === "/IrohLogger/script.js") response.end(fs.readFileSync('../IrohLogger/script.js', 'utf8'))
            else if (path === "/IrohMutationObserverLogger/script.js") response.end(fs.readFileSync('../IrohMutationObserverLogger/script.js', 'utf8'))
            else if (path === "/alert.js") response.end("console.log('remote js')")
            else response.end()
        } else if (queryData.url) {
            wrap(
                queryData.wrapper || "Iroh",
                queryData.url,
                x => response.end(x))
        } else { response.end("") }
    } else if (request.method == 'POST') {
        const vlsOrigin = request.headers.origin
        response.setHeader("Access-Control-Allow-Origin", vlsOrigin);
        response.setHeader("Access-Control-Allow-Methods", "POST");
        response.setHeader("Access-Control-Allow-Headers", "accept, content-type");
        response.setHeader("Access-Control-Max-Age", "1728000");
        function logToString(log) {
            return log
                .map(([namespace, session, date, likeIroh]) => { 
                    return `${namespace} ${likeIroh.src} ${likeIroh.name} ${session} ${date}`})
                .join('\n')
        }
        const chunks = [];
        request.on('data', (chunk) => {
            chunks.push(chunk)
        })
        request.on('end', function () {
            //console.log(Buffer.concat(chunks).toString())
            console.log(logToString(JSON.parse(Buffer.concat(chunks).toString())))
            response.end()
        })
    } else if (request.method == "OPTIONS") {
        const vlsOrigin = request.headers.origin
        response.setHeader("Access-Control-Allow-Origin", vlsOrigin);
        response.setHeader("Access-Control-Allow-Methods", "POST");
        response.setHeader("Access-Control-Allow-Headers", "accept, content-type");
        response.setHeader("Access-Control-Max-Age", "1728000");
        //In case of an OPTIONS, we allow the access to the origin of the petition
        response.end()
    }
});

// Listen on port 8000, IP defaults to 127.0.0.1
server.listen(8000);
