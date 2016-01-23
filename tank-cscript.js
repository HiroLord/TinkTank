
function main() {
    setupMessages();

    $(".move-option").data("dir", 0);

    $(".move-option").click(function() {
        if ($(".move-selected")) {
            $(this).html($(".move-selected").html());
            $(this).data("dir",  $(".move-selected").data("dir"));
        }
    });

    $(".fire-option").click(function() {
        if ($(".fire-selected")) {
            $(this).html($(".fire-selected").html());
            $(this).data("dir",  $(".fire-selected").data("dir"));
        }
    });

    $(".move-btn").on("click", function() {
        $(".move-btn").removeClass("move-selected");
        $(this).addClass("move-selected");
    });

    $(".fire-btn").on("click", function() {
        $(".fire-btn").removeClass("fire-selected");
        $(this).addClass("fire-selected");
    });

    $("#confirm").addClass("disabled");

    $("#confirm").click(function() {
        if (!$(this).hasClass("disabled")) {
            var packet = newPacket(1);
            packet.write(pID);
            packet.write($("#move-one").data("dir"));
            packet.write($("#move-two").data("dir"));
            packet.write($("#move-three").data("dir"));
            packet.write($("#move-four").data("dir"));
            packet.write($("#fire-one").data("dir"));
            packet.write($("#fire-two").data("dir"));
            packet.write($("#fire-three").data("dir"));
            packet.write($("#fire-four").data("dir"));
            packet.send();
            $(this).addClass("disabled");
        }
    });

    setInterval(handleNetwork, 16);
    var packet = newPacket(0);
    packet.write(pID);
    packet.send();
}


function setupMessages() {
    var i999 = createMsgStruct(MSG_LOGIN, false);
    i999.addChars(2);

    var i0 = createMsgStruct(0, false);

    var i2 = createMsgStruct(2, false);
    var i3 = createMsgStruct(3, false);

    var o999 = createMsgStruct(MSG_LOGIN, true);
    o999.addChars(4);
    o999.addString(4);

    var o997 = createMsgStruct(997, true);
    o997.addChars(2);
    o997.addString();

    var o0 = createMsgStruct(0, true);
    o0.addChars(2);

    var o1 = createMsgStruct(1, true);
    o1.addChars(2);
    o1.addChars(2);
    o1.addChars(2);
    o1.addChars(2);
    o1.addChars(2);
    o1.addChars(2);
    o1.addChars(2);
    o1.addChars(2);
    o1.addChars(2);
}

/*
function startConnection() {
    var onopen = function() {
        if ($("#host").val() === "0000" || $("#host").val().length != 4) {
            alert("Invalid Hostcode.");
            return;
        }
        $("#notify").text("Logging in...");
        var packet = newPacket(MSG_LOGIN);
        packet.write($("#host").val().toUpperCase());
        packet.write($("#name").val());
        packet.send();

    }

    var onclose = function() {
        window.location.href = '/';
    }

    $("#notify").text("Connecting...");  
    wsconnect("ws://games.room409.xyz:8886", onopen, onclose);
}
*/

function handleNetwork() {
    if (!canHandleMsg()) {
        return;
    }

    var packet = readPacket();

    msgID = packet.msgID;

    if (msgID === 0) {
    } else if (msgID === 2) {
        $("#confirm").removeClass("disabled");
        $(".move-option").html("");
        $(".fire-option").html("");
        $(".move-option").data("dir", 0);
        $(".fire-option").data("dir", 0);
    } else if (msgID === 3) {
        $("#confirm").addClass("disabled");
    }

}
