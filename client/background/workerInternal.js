// ** DEBUG
if (typeof console !== 'undefined') {
  postMessage = function(msg) {
    console.log(msg);
  };
  importScripts = function() {
    return;
  };
}
// for (var prop in this) {
//   postMessage(prop);
//   if (typeof console === 'undefined') {
//     postMessage(JSON.stringify(this[prop]));
//   }
// }
if (typeof console === 'undefined') {
  console = {};
  console.log = function(msg) {
    postMessage(JSON.stringify(msg)||'');
  };
}
var debug = function(msg) {
  postMessage({type:'debug',msg:msg});
};
// ** END DEBUG

//init
importScripts('../components/q/q.min.js');
importScripts('../components/socket.io-client/dist/socket.io.min.js');
importScripts('indexedDb.js');
importScripts('workerInternalEvents.js');
var socket = io.connect('http://localhost');
var db;

var attachSockets = function() {
  socket.on('users', function (data) {
    var array = JSON.parse(data);
    var i = array.length;
    var users = db.transaction(["users"], IDBTransaction.READ_WRITE)
                    .objectStore("users");
    users.onerror = function(e){
      console.log('Error adding: '+e);
    };
    users.onsuccess = function(e){
      //something
    };
    var obj,id;
    while(i--) {
      //put takes (value, key)
      obj = array[i];
      id = obj.uuid;
      delete obj.uuid;
      users.put(obj.uuid);
    }
  });
};

var initDb = function(data) {
  db = createDB({
    title:data.dbTitle,
    version:data.dbVersion,
    stores:[{name:'users',keys:{keyPath: 'uuid'}}]
  })
  .then(function(db) {
    attachSockets();
    db.onerror = function(event) {
      console.log('database error: ' + event.target.errorCode);
    };
  },function() {
    //show an alert to user!
  });
};

addEventListener('message', function(event) {
  var data = event.data;
  console.log(data);
  if (data.uuid && data.registered) {
    this.uuid = data.uuid;
    this.registered = data.registered;
  }
  if (data.init) {
    //throw exception if no title or no version
    initDb(data);
  }
});

addMessageEvent(function(msg) {
  return msg === 'getUsers';
}, function(msg) {
  var users = [];
  db.transaction("users").objectStore("users").openCursor()
  .onsuccess = function(event) {
    var cursor = event.target.result;
    if (cursor) {
      customers.push(cursor.value);
      cursor.continue();
    }
    else {
      msg = {
        replyTo:msg,
        data:users
      };
      postMessage(msg);
    }
  };
});
