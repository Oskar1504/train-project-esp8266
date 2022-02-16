const WebS = require("ws")

const express = require('express');
const Router = require('./routes');

const app =  express();
const path = require('path');
const fs = require("fs");


const wss = new WebS.Server({port:42082})
console.log("Websocket running at port: 42082")


// TODO make an function which finish scan so the update dont spam this
wss.on("connection",ws=>{
    ws.on("message",msg=>{
        try {
            let msg2 = JSON.parse(msg)
            console.log("[received message!]: ", msg.toString())

            if (msg2.target == "server") {
                console.log("Server function")
                if(msg2.type == "mapUpdate"){

                    wss.broadcast(msg)
                    console.log("mapUpdate still WIP. just forwarding msg")
                    // msg2.target = "website"
                    // msg2.type = "map"
                    // msg2.source = "server"
                    // wss.broadcast(JSON.stringify(msg2))
                    // console.log("updateMap processed. Broadcasted message")

                }
            } else {
                wss.broadcast(msg)
            }
        }
        catch (e) {
            console.error(e.toString(), "Message: ", msg.toString())
        }
    })
});

wss.broadcast = function broadcast(msg){
    wss.clients.forEach(function each(client) {
        client.send(msg)
    });
};

function updateMap(){

    let stations = JSON.parse(fs.readFileSync(__dirname + "/public/stations.json")),
        scanInput = stations.cards[msg2.content.split(":")[1]]
    let trainName = msg2.source

    console.log("Updating train: ", msg2.source)
    if(Object.keys(stations.trains).includes(trainName)){
        let train = stations.trains[trainName]
        // beim scan kommen zwei werte
        // dieser welcher schon als active block ist wir dnun zum last block und der neue demzufolge zum neuen active
        let newlastBlock = scanInput[scanInput.indexOf(train.active_block)]
        train.last_block = newlastBlock
        scanInput.forEach(i => {
            if(i != newlastBlock){
                train.active_block = i
            }
        })
    }

    console.log("Updating Blocks active state")
    stations.blocks.forEach(block => {
        //todo wenn acitve dann error senden und stoppen
        if(block.name == stations.trains[trainName].active_block){
            block.active = true
            if(block.max_speed){
                console.log(block.max_speed)
                stations.trains[trainName].speed = block.max_speed

                wss.broadcast(JSON.stringify({
                    target:trainName,
                    type:"controlCommand",
                    pins:[{pin:"pinD2",pin_status:block.max_speed}]
                }))
            }
        }
        if(block.name == stations.trains[trainName].last_block){
            block.active = false
        }
    })
    fs.writeFileSync(__dirname + "/public/stations.json", JSON.stringify(stations, null, 4))
}

app.use(express.json());
app.use('/', Router);
app.use(express.static(path.join(__dirname, 'public')));

const port = 42081;
app.listen(port, () =>{
    console.log(`server is running at http://localhost:${port}`)
})
