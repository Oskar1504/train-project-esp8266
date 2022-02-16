let scale  = 40;
let zeilenAbstand = 20;
let leftOffset = 190 ;

let svgElm = document.getElementById("map")
svgElm.setAttribute("height", window.innerHeight +"px")
svgElm.setAttribute("width", window.innerWidth * 0.5 +"px")


fetch('./data/stations.json').then(response => {
    return response.json();
}).then(data => {
    console.log(data);

    renderMap(data)
    app.stations = data;
}).catch(err => {

});


let  wss = new WebSocket("ws://localhost:42082")
// let  wss = new WebSocket("ws://192.168.178.42:42082")

wss.onmessage = async function (event) {
    let msg = JSON.parse(await (new Response(event.data)).text())
    msg.type == "controlCommand"? msg.content = msg.pins.map(pin => {return pin.pin + " -> " + pin.pin_status}).join(", ") : null
    app.debug.unshift(msg)
    app.debug.length > 5 ? app.debug.pop() : null
    if (msg.target == "website"){
        console.log(msg)
        if (msg.type == "map") {
            fetch('./data/stations.json').then(response => {
                return response.json();
            }).then(data => {
                console.log(data);

                renderMap(data)
                app.stations = data;
            }).catch(err => {

            });
        }
    }
}

wss.onclose = async function (event) {
    console.error("WS Con closed")
    console.log(event)
}

function renderMap(data){
    let svgElm = document.getElementById("map")

    //clear svg
    svgElm.querySelectorAll('*').forEach(n => n.remove());
    data.blocks.forEach(block => {
        block.lines.forEach(line => {
            let newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
            newLine.setAttribute('x1',line.p1[0] * scale - leftOffset);
            newLine.setAttribute('y1',line.p1[1] * scale);
            newLine.setAttribute('x2',line.p2[0] * scale - leftOffset);
            newLine.setAttribute('y2',line.p2[1] * scale);
            newLine.setAttribute("stroke", "black")
            // newLine.setAttribute("stroke", block.color)
            newLine.setAttribute("stroke-width", 6)

            if(block.command){
                newLine.addEventListener("click", function(){
                    window[block.command](block);
                })
            }

            svgElm.append(newLine);

            if(line.label){
                let newText = document.createElementNS('http://www.w3.org/2000/svg','text');
                newText.setAttribute('x',line.p1[0] * scale + 25 - leftOffset);
                newText.setAttribute('y',line.p1[1] * scale + 25);
                newText.innerHTML = block.name;
                svgElm.append(newText);

                let loks = 1
                Object.values(data.trains).forEach(train => {
                    if(train.active_block == block.name){
                        let newText = document.createElementNS('http://www.w3.org/2000/svg','text');
                        newText.setAttribute('x',line.p1[0] * scale + 25 - leftOffset);
                        newText.setAttribute('y',line.p1[1] * scale + 25 + (zeilenAbstand * loks));
                        newText.innerHTML = train.name;
                        svgElm.append(newText);
                        loks++
                    }
                })
            }


            if(block.active){
                let newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
                newLine.setAttribute('id','line2');
                newLine.setAttribute('x1',line.p1[0] * scale - leftOffset);
                newLine.setAttribute('y1',line.p1[1] * scale);
                newLine.setAttribute('x2',line.p2[0] * scale - leftOffset);
                newLine.setAttribute('y2',line.p2[1] * scale);
                newLine.setAttribute("class", "line")
                svgElm.append(newLine);
            }
        })
    })
}

function debug(block) {
    console.log("debug")
    console.log(block)
}


var app = new Vue({
    el: '#app',
    data: {
        exampleSocket: wss,
        stations:{},
        debug:[],
        commands:{
            pinStatus:{
                send:function (target, pin, pin_status) {
                    wss.send(JSON.stringify({
                        target:target,
                        type:"updatePin",
                        pin:pin,
                        pin_status:pin_status
                    }))
                }
            },
            controlCommand:{
                send:function (target, pin, pin_status) {
                    document.querySelectorAll(".direction").forEach(elm => {elm.classList.remove("active")})
                    event.srcElement.classList.add("active");
                    wss.send(JSON.stringify({
                        target:target,
                        type:"controlCommand",
                        pins: pin.map((pin, index) => {
                            return {pin:pin,pin_status:pin_status[index]}
                        })
                    }))
                }
            }
        }
    },
    created() {

    },
    methods: {
        swag: function (train) {
            console.log(train.speed)
        }
    }
});