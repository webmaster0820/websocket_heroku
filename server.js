'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

var wsArr = [];
var PoolForInterval = [];
var PoolForData = [];

function send_data(userId,data){
  if(PoolForData[userId] !== undefined && PoolForData[userId].length){
    console.log("insert data to " + userId + "Pool");
    PoolForData[userId].push(data);
  }else{
    console.log("create inerval for " + userId);
    PoolForData[userId] = [];
    PoolForData[userId].push(data);
    createInterval(userId);
  }
}

function createInterval(userId){
  PoolForInterval[userId] = setInterval(function(){
    if(PoolForData[userId].length){
      console.log("send and remove data to " + userId + "Pool");
      wsArr[userId].send(JSON.stringify(PoolForData[userId][0]));
      PoolForData.shift();
    }else{
      console.log("remove interval " + userId);
      clearInterval(PoolForInterval[userId]);
    }
  },1000);
}

wss.on('connection', (ws) => {

  ws.on('message',(message)=>{
    data = JSON.parse(message);
    if (data.type == "connect"){
      console.log("connected : " + data.userId);
      wsArr[data.userId] = ws;
      ws.send("connection success");
    }
    if (data.type == "send data"){
      console.log("send data to : " + data.userId);
      if (wsArr[data.userId] !== undefined){
        send_data(data.userId, data.sendData);
      }
    }
  });
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});
