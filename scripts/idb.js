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

var fdb =
(function() {
  'use strict';

  var COMPAT_ENVS = [
    ['Firefox', ">= 16.0"],
    ['Google Chrome', ">= 24.0 (you may need to get Google Chrome Canary), NO Blob storage support"]
  ];
  const DB_NAME = 'db-punch-away';
  const DB_VERSION = 4; // Use a long long for this value (don't use a float)
  const DB_STORE_NAME = 'punchstore';

 var idb = {
    db: {},
    dbname: 'IndexedDB'
  };

  idb.openIndexedDB = function() {
    idb.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    var request = idb.indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = function(evt) {
       idb.db = this.result;
      console.log('[%s] Open with success with version: %d', DB_NAME, DB_VERSION);
    };

    request.onerror = function(evt) {
      console.log("Database error code: " + evt.target.errorCode);
    };

    request.onupgradeneeded = function(evt) { 
      console.log('idb.onupgradeneeded, createObjectStore({%s}, oldVersion : {%d}, newVersion: {%d}', DB_STORE_NAME, evt.oldVersion, evt.newVersion);
      if (evt.newVersion > evt.oldVersion && evt.currentTarget.result.objectStoreNames.length > 0)
        evt.currentTarget.result.deleteObjectStore(DB_STORE_NAME);
      var store = evt.currentTarget.result.createObjectStore(DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      if (store)
        store.createIndex('userId', ['userId', 'dtPunch'], { unique: true });
    };

    request.onblocked = function(evt) {
      // If some other tab is loaded with the database, then it needs to be closed
      // before we can proceed.
      alert("Please close all other tabs with this site open!");
    }
  /**
   * @param {string} store_name
   * @param {string} mode either "readonly" or "readwrite"
   */
    idb.getObjectStore = function (store_name, mode) {
      var tx = idb.db.transaction(store_name, mode);
      // Do something when all the data is added to the database.
      tx.oncomplete = function(event) {
        console.log('onComplete');
      };
      tx.onerror = function(event) {
        console.error('onError', event.errorCode);
        // Don't forget to handle errors!
      };
      return tx.objectStore(store_name);
    }

    idb.addPunch = function (obj) {
      console.log('addPublication arguments:');
      var store = idb.getObjectStore(DB_STORE_NAME, 'readwrite');
      var req;
      try {
        req = store.add(obj);
        req.onsuccess = function (evt) {
          console.log("Insertion in DB successful");
          idb.getObj(obj);
        };
        req.onerror = function(evt) {
          console.error("addPublication error", this.error);
        };
      } catch (e) {
        if (e.name == 'DataCloneError')
          console.log("This engine doesn't know how to clone a Blob, use Firefox");
        throw e;
      }
    }
    idb.getObj = function (obj){
      var store = idb.getObjectStore(DB_STORE_NAME, 'readonly');
      var index = store.index('userId');
      var request = index.get([obj.userId, obj.dtPunch]).onsuccess = function(event) {
        console.log("dtPunch: " + event.target.result.dtPunch);
        var dtPunch = document.getElementById('dtPunch');
        dtPunch.textContent = event.target.result.dtPunch;
      };
    }
    idb.updObj = function(obj) {
      var store = idb.getObjectStore(DB_STORE_NAME, 'readwrite');
      var index = store.index('userId');
      var request = index.get([obj.userId, obj.dtPunch]);
      request.onerror = function(event) {
        Console.error('Object not Found!');
        // Handle errors!
      };
      request.onsuccess = function(event) {
        // Get the old value that we want to update
        if (event.target.result != undefined) {
          var data = event.target.result;
          
          // update the value(s) in the object that you want to change
          data.dtCreated = obj.dtCreated;

          // Put this updated object back into the database.
          var requestUpdate = store.put(data);
          requestUpdate.onerror = function(event) {
            // Do something with the error
          };
          requestUpdate.onsuccess = function(event) {
            // Success - the data is updated!
          };
        }
      }
    }
  idb.updIdxObj = function(obj) {
      var store = idb.getObjectStore(DB_STORE_NAME, 'readwrite');
  }
  }
  return idb;
})();
