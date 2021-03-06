// let  wss = new WebSocket("wss://a0f8afe0228e.ngrok.io")

let  wss = new WebSocket("ws://localhost:42082")
// let  wss = new WebSocket("ws://53b5-2003-c6-9704-6000-5fd-8ede-34b-9c5d.ngrok.io")

wss.onmessage = async function (event) {
    let msg = JSON.parse(await (new Response(event.data)).text())
    msg.timestamp = new Date().toLocaleTimeString("de-DE")

    if (msg.target == "website"){
        console.log(msg)
    }
    app.debug.unshift(msg)
    if(app.debug.length > 5){app.debug.pop()}
}
wss.onclose = async function (event) {
    console.error("WS Con closed")
    console.log(event)
}

var app = new Vue({
    el: '#app',
    data: {
        commands:[
            {name:"Ping Website",source:"website",target:"website",type:"message",content:"Ping!"},
            {name:"mapUpdate mock",source:"website",target:"server",type:"mapUpdate",content:"001.002:--------"},
            {name:"Ping",target:"website",type:"ping",content:"ping"}
        ],
        debug: [],
        exampleSocket: wss,
        pinMessage:{
            pin:"pinD1",
            pin_status: 0,
            target: "esp_1",
            type: "updatePin"
        },
        updateMapMessage:{
            source:"esp_1",
            type:"mapUpdate",
            content:"001.002:--------",
            target: "server"
        },
        commands2:[
            {
                message:{
                    source:"esp_1",
                    target:"server",
                    type:"mapUpdate",
                    content:""
                }
            }
        ]
    },
    created() {

    },
    methods: {
        sendMessage: function (command) {
            this.exampleSocket.send(JSON.stringify(command))
        },
        sendPinMessage: function(){
            let command = this.pinMessage
            this.exampleSocket.send(JSON.stringify(command))
        },
        sendupdateMapMessage: function () {
            let command = this.updateMapMessage
            this.exampleSocket.send(JSON.stringify(command))
        },
        sendPinMessageRainbow: async function(){
            let pins = ["pinD1","pinD2","pinD3","pinD4"],
                previosPin = "pinD4"

            for (const pin of pins) {
                this.exampleSocket.send(JSON.stringify({type:"updatePin",target:"esp_1",pin:previosPin,pin_status:0}))
                this.exampleSocket.send(JSON.stringify({type:"updatePin",target:"esp_1",pin:pin,pin_status:1}))
                previosPin = pin
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            this.exampleSocket.send(JSON.stringify({type:"updatePin",target:"esp_1",pin:pins[pins.length-1],pin_status:0}))
            let command = this.pinMessage
            this.exampleSocket.send(JSON.stringify(command))
        },
        getKey: function(obj,key2){
            return Object.keys(obj).filter(function(key) {return obj[key] === key2})[0];
        },
        sendImage: function(command){
            fetch('/getImage/lol')
                .then(response => response.json())
                .then(data => {
                    this.exampleSocket.send(createMessage(command.source,command.target,command.type,JSON.stringify(data)))
                });
        }
    }
});

function createMessage(source,target,type,content){
    return JSON.stringify({
        source:source,
        target:target,
        type:type,
        content:content
    })
}
