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

(function() {
  'use strict';

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
  app.setbutAddContentText = function(){
    app.butAdd.textContent = app.inout ? "Punch Out" : "Punch In";
    app.inout = !app.inout;
  }

  app.butAdd.addEventListener('click', function() {
    // Open/show the add new city dialog
    app.getForecast('2460');
  });

  app.snackbar = document.getElementById("snackbar");
  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  /*
   * Gets a forecast for a specific city and updates the card with the data.
   * getForecast() first checks if the weather data is in the cache. If so,
   * then it gets that data and populates the card with the cached data.
   * Then, getForecast() goes to the network for fresh data. If the network
   * request goes through, then the card gets updated a second time with the
   * freshest data.
   */
  app.getForecast = function(userId) {
    var today = new Date();
    var date = today.toJSON();
    var obj = { "userId": userId, "dtPunch": date, dtCreated: "", nvComment : navigator.userAgent };

    fdb.addPunch(obj);
    app.setbutAddContentText();
    var statement = 'select * from weather.forecast where woeid=' + userId;
    var url = 'https://myfirstapifunc.azurewebsites.net/api/insPunch?code=ut4YEeOr8aWhjVK6e/5nyRV4vngQ2N9UsBCGuanPhBpVPDyE7uKR7g==';
    // TODO add cache logic here

    // Fetch the latest data.
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          var dtPunch = response.Punch[0].dtPunch;
          console.log('dtPunch: {%s}, dtCreated: {%s} ', response.Punch[0].dtPunch, response.Punch[0].dtCreated);
          fdb.updObj(response.Punch[0]);
          app.showsnackbar(dtPunch);
        }
      }
    }  
    request.open('POST', url);
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    request.send(JSON.stringify(obj));
  };
  app.showsnackbar = function(dtCreated) {
    // Add the "show" class to DIV
    app.snackbar.className = "show";
    app.snackbar.textContent = dtCreated;

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ 
      app.snackbar.className = app.snackbar.className.replace("show", ""); }
      , 3000);
  };
  app.setbutAddContentText();

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
    
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}

})();
document.onreadystatechange = function () {
  if (document.readyState === "complete")
      fdb.openIndexedDB();
}