// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var fap =
(function() {
  'use strict';

  const SET_TIMEOUT = 3000;
  const FUNCTION_URI = 'https://myfirstapifunc.azurewebsites.net/api/';
  const X_FUNCTIONS_KEY = 'elt3hjw9ijvz67f3updnvgtlyx3e1ykbobs4';

  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/
  var app = {
    isLoading: true,
    visibleCards: {},
    inout: false
  };

  app.butAdd = document.getElementById('butAdd');
  app.footerMsg = document.getElementsByClassName('footerMsg')[0];
  app.setbutAddContentText = function(){
    app.butAdd.textContent = app.inout ? "Punch Out" : "Punch In";
    app.inout = !app.inout;
  }

  app.butAdd.addEventListener('click', function() {
    // Open/show the add new city dialog
    app.setPunch('2460');
  });

  /*
   *  setPunch User, dtPunch.
   */
  app.setPunch = function (userId){
    var today = new Date();
    var obj = { userId: userId, dtPunch: today.toJSON(), dtCreated: "", nvComment : navigator.userAgent };
    fdb.addObj('Punch9', obj).then(function(obj) {
      app.showMsg(`dtPunch: ${obj.dtPunch}`);
      var dtPunch = document.getElementById('dtPunch');
      dtPunch.textContent = obj.dtPunch;
      fdb.updCreated('Punch9', '');
      }, 
      app.showErr)
  }

  app.showErr = function(errMsg){
     console.error("ErrMsg: ", errMsg)
  }

  app.showMsg = function(logMsg){
     console.log("LogMsg: ", logMsg)
     app.footerMsg.textContent = logMsg;
  }

  app.postObj = function(obj, spName) {
    return new Promise(function(resolve, reject) {
      var request = new XMLHttpRequest();
      request.open('POST', `${FUNCTION_URI}${spName}`);
      request.setRequestHeader('x-functions-key', X_FUNCTIONS_KEY);
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      request.onreadystatechange = function() {
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status === 200) {
            var response = JSON.parse(request.response);
            resolve(response.Punch[0]);
          } else {
            reject(Error(request.statusText));
          }
        }
      };
      // Handle network errors
      request.onerror = function() {
        reject(Error('Network Error'));
      };
      request.send(JSON.stringify(obj));
    })
  };

  app.showsnackbar = function(dtCreated) {
    // Add the "show" class to DIV
    app.snackbar.className = "show";
    app.snackbar.textContent = dtCreated;

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ 
      app.snackbar.className = app.snackbar.className.replace("show", ""); }
      , SET_TIMEOUT);
  };

  app.init = function(){
    app.snackbar = document.getElementById("snackbar");
    fdb.openIndexedDB();
    app.setbutAddContentText();
  }

  // register service worker
  if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(function(reg) {
          if(reg.installing) {
            console.log('Service worker installing');
          } else if(reg.waiting) {
            console.log('Service worker installed');
          } else if(reg.active) {
            console.log('Service worker active');
          }
        })
        .catch(function(error) {
          // registration failed
            console.log('Registration failed with ' + error);
        });
  }
  return app;
})();
document.onreadystatechange = function () {
  if (document.readyState === "complete")
      fap.init();
}