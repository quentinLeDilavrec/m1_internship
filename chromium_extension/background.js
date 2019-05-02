// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log('The color is green.');
  });
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {hostEquals: 'developer.chrome.com'},
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

chrome.extension.onConnect.addListener(function(port) {
  if (port.name != 'XHRProxy_')
    return;
  port.onMessage.addListener(function(xhrOptions) {
    var xhr = new XMLHttpRequest();
    xhr.open(xhrOptions.method || "GET", xhrOptions.url, true);
    xhr.onreadystatechange = function() {
      if (this.readyState == 4) {
        port.postMessage({
          status : this.status,
          data   : this.responseText,
          xhr    : this
        });
      }
    }
    xhr.send();
  });
});