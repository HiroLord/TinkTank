var hostCode = "0000";

var squareWidth = 48;
var squareHeight = squareWidth;

var startX = 32;
var startY = 48;

var gridWidth = 12;
var gridHeight = gridWidth;

$(document).ready(function() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    var path = new Path2D();

    var width = squareWidth;
    var height = squareHeight;

    for (var r=0; r<gridHeight+1; r++) {
        for (var c=0; c<gridWidth+1; c++) {
            path.moveTo(startX, startY + c*width);
            path.lineTo(startX + height*gridHeight, startY + c*width);
            path.moveTo(startX + r*height, startY);
            path.lineTo(startX + r*height, startY + width*gridWidth);
        }
    }

    grid = path;

    setInterval(function() {
        handleNetwork();
        gameLoop(ctx);
    }, 16);

    setupMessages();
    startConnection();
});

function setupMessages() {
    var i999 = createMsgStruct(999, false);
    i999.addChars(4);

    var i998 = createMsgStruct(998, false);
    i998.addChars(2);
    i998.addString();

    var i997 = createMsgStruct(997, false);
    i997.addChars(2);
    i997.addString();

    var i0 = createMsgStruct(0, false);
    i0.addChars(2);

    var i1 = createMsgStruct(1, false);
    i1.addChars(2);
    i1.addChars(1);
    i1.addChars(1);

    var o999 = createMsgStruct(999, true);
    o999.addChars(4);
    o999.addString();

    var o0 = createMsgStruct(0, true);

    var o1 = createMsgStruct(1, true);

    var o2 = createMsgStruct(2, true);

    var o3 = createMsgStruct(3, true);
}

function startConnection() {
    var onopen = function() {
        var packet = newPacket(999);
        packet.write("0000");
        packet.write("YES");
        packet.send();
    }

    var onclose = function() {
        alert("Lost connection...");
    }

    wsconnect("ws://games.room409.xyz:8886", onopen, onclose);
}

function handleNetwork() {
    if (!canHandleMsg()) {
        return;
    }

    var packet = readPacket();
    var msgID = packet.msgID;

    if (msgID === 999) {
        hostCode = packet.read();
        //generateMap();
        //httpGet("/map.txt", parseMap, false);
    } else if (msgID === 998) {
        var pID = packet.readInt();
        var n = packet.read();
        newPlayer(pID, n);
    } else if (msgID === 997) {
        var pID = packet.readInt();
        var n = packet.read();
        players[pID].setName(n);
    } else if (msgID === 0) {
        var sID = packet.read();
        var pID = parseInt(sID);
        if (stage == STAGE_SET) {
            var packet = newPacket(2);
            packet.send(sID);
        }
    } else if (msgID === 1) {
        var pID = packet.readInt();
        var num = packet.readInt();
        var dir = packet.readInt();
        var nextFour = pTanks[pID].nextFour;
        if (dir === 1) {
            nextFour[num] = [-1, 0];
        } else if (dir === 2) {
            nextFour[num] = [0, 1];
        } else if (dir === 3) {
            nextFour[num] = [1, 0];
        } else if (dir === 4) {
            nextFour[num] = [0, -1];
        } else {
            nextFour[num] = [0, 0];
        }
        var packet = newPacket(1);
        packet.send(extend(pID, 2));
    }
}

function newPlayer(pID, name) {
    newTank(pID, name);
}


var tanks = [];
var pTanks = [];
var bullets = [];
var gameObjects = [];

function newTank(tID, name) {
    var t = {};
    t.tID = tID;
    t.name = name;

    t.health = 4;

    t.r = parseInt(Math.random() * gridHeight);
    t.c = parseInt(Math.random() * gridWidth);
    t.newR = t.r;
    t.newC = t.c;

    t.x = 24;
    t.y = 24;

    t.width = 30;
    t.height = 30;

    t.next = [];
    t.nextWep = [];

    t.nextFour = [[0,0], [0,0], [0,0], [0,0]];

    t.movePosition = function(dR, dC) {
        this.next.push([dR, dC]);
    }

    t.nextWeapon = function(wep, dir) {
        this.nextWep.push([wep, dir]);
    }

    t.reposition = function() {
        t.x = startX + (t.c * squareWidth) + squareWidth/2;
        t.y = startY + (t.r * squareHeight) + squareHeight/2;
    }

    t.takeDamage = function(dam) {
        this.health -= dam;
        if (this.health < 1) {
            
        }
    }

    t.setPositions = function() {
        for (var i=0; i<4; i++) {
            this.movePosition(this.nextFour[i][0], this.nextFour[i][1]);
            this.nextFour[i] = [0, 0];
        }
    }

    t.nextPosition = function() {
        if (this.next.length > 0) {
            var pos = this.next.shift();
            this.newR = this.r + pos[0];
            this.newC = this.c + pos[1];
            if (this.newR < 0) {
                this.newR = 0;
            } else if (this.newR >= gridHeight) {
                this.newR = gridHeight-1;
            }

            if (this.newC < 0) {
                this.newC = 0;
            } else if (this.newC >= gridWidth) {
                this.newC = gridWidth-1;
            }
        }
    }

    t.fire = function() {
        if (this.health < 1) {
            return;
        }
        if (this.nextWep.length > 0) {
            var wep = this.nextWep.shift();
            if (wep[0] == 1) {
                newBullet(this, wep[1])
            }
        }
    }

    t.move = function(stage) {
        if (stage != STAGE_MOVE || this.health < 1) {
            return;
        }
        var newX = this.x;
        var newY = this.y;

        //if (this.newR < 0 || this.newC < 0) {}
        
        if (this.newR != this.r) {
            newY = startY + (squareHeight * this.newR) + squareHeight/2;
        }
        if (this.newC != this.c) {
            newX = startX + (squareWidth * this.newC) + squareWidth/2;
        }

        if (this.x == newX && this.y == newY) {
            this.r = this.newR;
            this.c = this.newC;
            //this.newR = -1;
            //this.newC = -1;
            return;
        }

        if (this.x < newX) {
            this.x += 1;
        } else if (this.x > newX){
            this.x -= 1;
        }

        if (this.y < newY) {
            this.y += 1;
        } else if (this.y > newY) {
            this.y -= 1;
        }
    }

    t.draw = function(ctx) {
        if (this.health < 1) {
            return;
        }
        ctx.fillStyle = "rgb(200,10,0)";
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "rgb(0,0,50)";
        ctx.fillText(this.name + " : " + this.health, this.x-20, this.y+4);
    }

    t.reposition();

    pTanks[tID] = t;
    tanks.push(t);
    gameObjects.push(t);

    return t;
}

function newBullet(source, dir) {
    var b = {};
    b.x = source.x;
    b.y = source.y;
    b.source = source;
    b.dir = dir;

    b.move = function(stage) {
        for (var t=0; t<tanks.length; t++) {
            if (tanks[t] == this.source) {
                continue;
            }
            if (Math.abs(tanks[t].x-this.x) < squareWidth/3 && Math.abs(tanks[t].y-this.y) < squareHeight/3) {
                tanks[t].takeDamage(1);
                removeBullet(this);
            }
        }

        if (stage != STAGE_SHOOT) {
            return;
        }
        if (this.dir > 0 && this.dir < 4) {
            this.x += 4;
        } else if (dir > 4) {
            this.x -= 4;
        }

        if (this.dir < 2 || this.dir > 6) {
            this.y -= 4;
        } else if (this.dir > 2 && this.dir < 6) {
            this.y += 4;
        }

        if (this.x < startX || this.x > startX + gridWidth * squareWidth) {
            removeBullet(this);
        }
        else if (this.y < startY || this.y > startY + gridHeight * squareHeight) {
            removeBullet(this);
        }
    }

    b.draw = function(ctx) {
        ctx.fillStyle = "rgb(0,0,40)";
        ctx.fillRect(this.x-3, this.y-3, 6, 6);
        //ctx.rotate(this.dir * 45 * Math.PI/180);
    }

    gameObjects.push(b);
    bullets.push(b);

    return b;
}

function removeBullet(obj) {
    var i = bullets.indexOf(obj);
    if (i > -1) {
        bullets.splice(i, 1);
    }
    i = gameObjects.indexOf(obj);
    if (i > -1) {
        gameObjects.splice(i, 1);
    }
}

var grid;
var stage = 0;
var STAGE_WAIT = 0;
var STAGE_SET = 1;
var STAGE_MOVE = 2;
var STAGE_SHOOT= 3;

var stageTimer = 60 * 15;
var round = 0;

function gameLoop(ctx) {
    var canvasWidth = 1280;
    var canvasHeight = 720;
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.stroke(grid);

    for (i in gameObjects) {
        if (gameObjects[i]) {
            gameObjects[i].draw(ctx);
            gameObjects[i].move(stage);
        }
    }

    ctx.font = "26px sans-serif";
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillText("Host code: "+hostCode+" | games.room409.xyz", 10, 30);
    ctx.fillText("Stage " + stage, 10, 658);
    ctx.fillRect(10,680,stageTimer,20);

    stageTimer -= 1;
    if (stageTimer < 1) {
        stageTimer = 2;
        if (stage == STAGE_MOVE) {
            changeStage(STAGE_SHOOT);
        } else if (stage == STAGE_SET) {
            changeStage(STAGE_MOVE);
        } else if (stage == STAGE_SHOOT) {
            if (bullets.length > 0) {
                stageTimer = 5;
            } else {
                //alert("Movin'");
                changeStage(STAGE_MOVE);
            }
        } else if (stage == STAGE_WAIT) {
            changeStage(STAGE_SET);
        }
    }
}

function changeStage(newStage) {
    if (stage == STAGE_SET) {
        for (var t=0; t<tanks.length; t++) {
            var packet = newPacket(3);
            packet.send(extend(tanks[t].tID, 2));
        }
    }

    if (stage == STAGE_SHOOT) { 
        for (var b=0; b<bullets.length; b++) {
            removeBullet(bullets[b]);
        }
    }

    if (stage == STAGE_SET && newStage == STAGE_MOVE) {
        for (var t=0; t<tanks.length; t++) {
            tanks[t].setPositions();
        }
    }

    stage = newStage;

    if (newStage == STAGE_MOVE) {
        stageTimer = 60;
        for (var t=0; t<tanks.length; t++) {
            tanks[t].nextPosition();
        }
        round += 1;
        if (round > 4) {
            round = 0;
            changeStage(STAGE_SET);
        }
    }

    if (newStage == STAGE_SHOOT) {
        stageTimer = 10;
        for (var t=0; t<tanks.length; t++) {
            tanks[t].fire();
        }
    }

    if (newStage == STAGE_SET) {
        stageTimer = 60*60;
        for (var t=0; t<tanks.length; t++) {
            var packet = newPacket(2);
            packet.send(extend(tanks[t].tID, 2));
        }
    }
}
