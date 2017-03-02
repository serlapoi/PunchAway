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
  const DB_VERSION = 9; // Use a long long for this value (don't use a float)
  const STORE_NAME = 'Punch' + DB_VERSION;

 var idb = {
    db: {},
    dbname: 'IndexedDB'
  };

  idb.openIndexedDB = function(storeName) {
    idb.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    var request = idb.indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = function(evt) {
      idb.db = this.result;
      fap.showMsg(`${DB_NAME} Open with success with version: ${DB_VERSION}`);
    };

    request.onerror = function(evt) {
      console.log("Database error code: " + evt.target.errorCode);
    };

    request.onupgradeneeded = function(evt) { 
      console.log('idb.onupgradeneeded; oldVersion : {%d}, newVersion: {%d}', evt.oldVersion, evt.newVersion);
      idb.db = evt.currentTarget.result;
      if (evt.newVersion > evt.oldVersion){
        createObj(STORE_NAME);
      }
    };

    function createObj(storeName){
      if (idb.db.objectStoreNames.contains(storeName))
        idb.db.deleteObjectStore(storeName);

      var store = idb.db.createObjectStore(storeName, { keyPath: ['userId', 'dtPunch'] } );
      if (store)
        store.createIndex('idxCreated', 'dtCreated', { unique: false });
        // store.createIndex('userId', ['userId', 'dtPunch'], { unique: true });
    };

    request.onblocked = function(evt) {
      // If some other tab is loaded with the database, then it needs to be closed
      // before we can proceed.
      alert("Please close all other tabs with this site open!");
    }
  }
  /**
   * @param {string} storeName
   * @param {string} mode either "readonly" or "readwrite"
  */
  idb.getTransaction = function (storeName, mode) {
    return new Promise(function(resolve, reject) {
      var tx = idb.db.transaction(storeName, mode);
      tx.oncomplete = resolve(tx.objectStore(storeName));
      tx.onerror = function(event) {
         reject(Error(`${idb.addObj.name}(${this.errorCode})`))
      }
    })
  }

  idb.addObj = function (storeName, obj) {
    return new Promise(function(resolve, reject) {
      fap.showMsg(`${idb.addObj.name}(${storeName}, obj)`);
      idb.getTransaction(storeName, 'readwrite')
        .then(function(tx) {
          try {
            var req = tx.add(obj);
            req.onsuccess = function (evt) {
              fap.showMsg(`Insertion in ${DB_NAME} successful`);
              resolve(idb.getObj(storeName, [obj.userId, obj.dtPunch], obj));
            };
            req.onerror = function(evt) {
              reject(Error(`${idb.addObj.name}(${this.errorCode})`))
            }
          } catch (e) {
            if (e.name == 'DataCloneError')
              reject(Error("This engine doesn't know how to clone a Blob, use Firefox"));
              throw e;
          }
        })
    })
  }

  idb.getObj = function (storeName, key, obj){
    return new Promise(function(resolve, reject) {
    idb.getTransaction(storeName, 'readonly')
      .then(function(tx) {
        // var index = tx.index('userId');
        var request = tx.get(key).onsuccess = function(event) {
          resolve(event.target.result);
        };
        request.onerror = function(event) {
              reject(Error(`${idb.getObj.name}(${this.errorCode})`))
        }
      })
    })
  }
    
  idb.updObj = function(storeName, key, obj) {
    return new Promise(function(resolve, reject) {
      idb.getTransaction(storeName, 'readwrite')
        .then(function(tx) {
          // var index = tx.index('userId');
          var request = tx.get(key).onsuccess = function(event) {
            // Get the old value that we want to update
            if (event.target.result != undefined) {
              var data = event.target.result;
              
              // update the value(s) in the object that you want to change
              data = obj;

              // Put this updated object back into the database.
              var requestUpdate = tx.put(data);
              requestUpdate.onsuccess = resolve(function(event) {return event.target.result});
              requestUpdate.onerror = function(event){
                reject(Error(`${idb.updObj.name}(${this.errorCode})`))
              }
            }
          };
          request.onerror = function(event) {
            reject(Error('Object not Found!'))
          }
        })
    })
  }
  idb.updCreated = function(storeName, key) {
    return new Promise(function(resolve, reject) {
    idb.getTransaction(storeName, 'readonly')
      .then(function(tx) {
        var index = tx.index('idxCreated');
        var request = index.openCursor(key).onsuccess = function(event) {
          var cursor = event.target.result;
          if(cursor) {
            fap.postObj(cursor.value, 'insPunch').then(
              function(res) {
                var dtPunch = new Date(res.dtPunch);
                res.dtPunch = dtPunch.toJSON();
                idb.updObj(storeName, [res.userId, res.dtPunch], res).then(
                  function(obj) { 
                    fap.showsnackbar(obj.dtCreated)},
                  fap.showErr);
              }, fap.showErr)
            cursor.continue();
          } else {
            // no more results
          }          
          resolve();
        };
        request.onerror = function(event) {
          reject(Error(`${idb.updCreated.name}(${this.errorCode})`))
        }
      })
    })
  }
  return idb;
})();
