// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker, isMainThread, parentPort } = require('worker_threads');
const funct = require('./custom_functions/functions.js')

const now = new Date();
const formattedDate = now.toISOString().split('T')[0]

function startCCTVWorker(web){
  const worker = new Worker(path.resolve(__dirname,"worker.js"));

  worker.on('message', (msg)=>{
    console.log(msg);
    worker.postMessage({ type: 'connect', web:web })
  })
}





const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins (you can specify your frontend URL here)
    methods: ["GET", "POST"]
  }
});
function get_data(){
  try{
    let sr = fs.readFileSync(path.join(__dirname,"saves/latest.dt"))
    let dt = fs.readFileSync(path.join(__dirname,"saves",sr.toString())) || {blocks:[],invs:[]}
    fs.writeFileSync(path.join(__dirname,"saves/latest.dt"),formattedDate+".save")
    return JSON.parse(dt)
  }catch(e){
    fs.writeFileSync(path.join(__dirname,"saves/latest.dt"),formattedDate+".save")
    console.log(e)
    return {blocks:[],invs:[]}
  }
}
let alldt = get_data()
let clients = {};
const blocks = alldt.blocks || []
const inventorys = alldt.invs || []

const settings = {gui:{maxSlots:9,maxItemsPerSlot:64}}
const starter = [{id:"van:dirt",amount:64,slot:1}]
io.on('connection', (socket) => {
  console.log('A user connected');

  // Generate and assign a unique token for each user
  const tk = token(20);
  socket.token = tk;
  clients[tk] = socket;
  socket.olddt = {}

  socket.on('cctvFeed', (imageData) => {
    const base64Data = imageData.replace(/^data:image\/png;base64,/, "")
    fs.writeFile(__dirname+'/views/view_'+socket.token+'.png', base64Data, 'base64', (err) => {
      if (err) {
          console.error('Error saving image:', err);
      }
    });
    //fs.writeFileSync(__dirname+'/views/view_'+socket.token+'.png',img)
  })

  socket.on('get_startup',() => {
    socket.emit("settings",settings)
  })

  socket.on('store_my_inv',(inv,secret_code) => {
    let dat = {tk:socket.token,en_save:funct.encode(JSON.stringify(inv),secret_code),sr:secret_code.slice(0,(secret_code.length/8)).repeat((secret_code.length/2)+1)}
    let got = false
    inventorys.forEach((v,i)=>{
      if(v.tk == socket.token){
        got = true
        inventorys[i] = dat
      }
    })
    if(!got) inventorys.push(dat);
    fs.writeFileSync(path.join(__dirname,"saves",formattedDate+".save"),JSON.stringify({blocks:blocks,invs:inventorys}))
  })

  socket.on('getting_my_inv',(secret_code) => {
    let got = false
    inventorys.forEach((v,i)=>{
      if(v.sr == secret_code.slice(0,(secret_code.length/8)).repeat((secret_code.length/2)+1)){
        got = true
        socket.emit('my_inv',JSON.parse(funct.decode(v.en_save,secret_code)))
      }
    })
    if(!got) socket.emit('my_inv',starter)
  })

  // Handle player position updates
  socket.on('clientposnw', (data) => {
    // Check if data is valid and changed before emitting
    if (isValidData(data) && !isEqual(socket.olddt, data)) {
      socket.olddt = data;
      sendAll('clientpos', data, socket);
    }
  });

  socket.on('get_players',()=>{
    sendAll('reset_pl',"",socket)
  })

  // Handle player joining (new player information)
  socket.on('joined', (data) => {
    if (isValidData(data)) {
      socket.uuid = data.uuid
      clients[socket.token] = socket
      sendAll('playerJoined', data, socket);
    }
  });

  // Handle client messages (this can be for chat or other data)
  socket.on('clientMessage', (data) => {
    if (isValidMessage(data)) {
      sendAll('clientMessage', data, socket);
    }
  });

  socket.on('cl_blocks_update_req',()=>{
    socket.emit('blocks_updated',blocks)
  })
  socket.on('cl_remove_block',(block)=>{
    sendAll('remove_block',block,socket)
    blocks.forEach((val,idx) => {
      if(val.uuid==block.uuid){
        blocks.splice(idx,1)
      }
    });
    fs.writeFileSync(path.join(__dirname,"saves",formattedDate+".save"),JSON.stringify({blocks:blocks,invs:inventorys}))
  })
  socket.on('cl_add_block', (block) => {
    blocks.push(block)
    sendAll('add_block',block,socket)
    fs.writeFileSync(path.join(__dirname,"saves",formattedDate+".save"),JSON.stringify({blocks:blocks,invs:inventorys}))
  })
  // Handle client disconnection
  socket.on('disconnect', () => {
    sendAll('playerLeft', { uuid: socket.uuid }, socket);
    delete clients[socket.token];
  });
  socket.on("offer", offer => socket.broadcast.emit("offer", offer));
  socket.on("answer", answer => socket.broadcast.emit("answer", answer));
  socket.on("candidate", candidate => socket.broadcast.emit("candidate", candidate));
});

// Helper function to send data to all other clients
function sendAll(event, message, senderSocket) {
  for (const token in clients) {
    if (senderSocket.token !== clients[token].token) {
      try {
        clients[token].emit(event, message);
      } catch (error) {
        console.error(`Error sending message to ${token}:`, error);
      }
    }
  }
}

// Generate random characters for the token
const rand = () => {
  const tmp2 = Math.random().toString(36).substr(2);
  const ri = Math.floor(Math.random() * tmp2.length);
  return tmp2.slice(ri, ri + 1);
};

// Generate a random token of a given length
const token = (len) => {
  let tmp = '';
  for (let i = 0; i < len; i++) {
    tmp = tmp + rand();
  }
  return tmp;
};

// Validate position data to avoid invalid or overly complex objects
function isValidData(data) {
  return data && typeof data === 'object' && !hasCircularReferences(data);
}

// Simple check for circular references in data
function hasCircularReferences(obj, seen = new WeakSet()) {
  if (obj && typeof obj === 'object') {
    if (seen.has(obj)) {
      return true;
    }
    seen.add(obj);
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && hasCircularReferences(obj[key], seen)) {
        return true;
      }
    }
  }
  return false;
}

// Compare two data objects to check if they are deeply equal
function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Validate simple client messages
function isValidMessage(data) {
  return typeof data === 'string' && data.trim().length > 0;
}

// Start the server
server.listen(8079, () => {
  console.log('Server running on http://localhost:8079');
});

const contentTypes = {
	'html': 'text/html',
	'png': 'image/png',
  'js': 'application/javascript',
  'css': 'text/css',
  'ico': 'image/x-icon',
	// Add more content types as needed
  }

const htserver = http.createServer((req, res) => {
	if (req.url === '/') {
	  res.writeHead(200, { 'Content-Type': contentTypes });
	  fs.createReadStream(__dirname+'/game.html').pipe(res);
	  
	} else {
    try{
      const filePath = path.join(__dirname , req.url);
      const extname = String(filePath).split('.').pop();
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          console.error(err)
          return;
        }
        let dt = data
        if(extname=="js"){
          dt = data.toString('utf-8')
          dt = dt.replace(/%%localhost:3000%%/g, ipv4+":"+8079)
          dt = Buffer.from(dt, 'utf-8')
        }
        res.writeHead(200, { 'Content-Type': contentTypes[extname] });
        res.end(dt);
      });
    }catch(e){}
  }
});

htserver.listen(8080,() => {
	console.log('HTTP server listening on server: http://'+ipv4+':'+8080);
  startCCTVWorker('http://'+ipv4+':'+8080)
});


const networkInterfaces = os.networkInterfaces();
ipv4 = ""
Object.keys(networkInterfaces).forEach(function (interfaceName) {
  networkInterfaces[interfaceName].forEach(function (address) {
    if (address.family === 'IPv4' && !address.internal) {
		ipv4 = address.address
    }
  });
});