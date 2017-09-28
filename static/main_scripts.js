// Custom scripts for application

const BASE_URL = "http://localhost:5000"

var socket = "";

$(document).ready( WireEvents );

function WireEvents(){
    $('#btnVote').click( do_vote_button );
    clear_error();

    // Connect through web socket to server, supplying session id as namespace
    socket = io.connect(BASE_URL);

    socket.on('joined', function(data) {
        $('#lblStatus').html('Connected');

    });

    socket.on('change', function(data) {
        // Update different things based on the type of change sent
        switch (data.change_type) {
            case "title":
                $('#lblTitle').html(data.title);
                break;
            case "votes":
                show_votes(data.votes)
                break;
        }

    });

    room = $('#lblSessionId').text();
    socket.emit('join', {room: room});

};

function do_vote_button(){
    clear_error();
    var this_room = $('#lblSessionId').text();
    var this_username = $('#txtUser').val();
    var this_vote = $('#txtVote').val();
    data = {room: this_room, username: this_username, vote: this_vote};
    socket.emit('vote', data);
};



function show_votes(votes) {
    result = "<tr><th>User</th><th>Vote</th></tr>";
    total = 0;
    vote_count = 0;
    $.map(votes, function(vote, user){
        result +='<tr><td>' + user + '</td><td>' + vote + '</td></tr>';
        if ($.isNumeric(vote)){
            total += parseInt(vote);
            vote_count += 1;
        }
    });
    if(vote_count > 0) {
        avg = (total/vote_count).toFixed(2);
    } else {
        avg = total;
    }
    result += '<tr><td><b>Average:</b></td><td><b><span id="lblAverage">' + avg.toString() + '</span></b></td></tr>';
    $('#votes').html(result);
    // Briefly highlight the total
    $( "#lblAverage" ).effect("shake", {times:2}, 500);
    $( "#lblAverage" ).effect("highlight", 1000);
}


function OnError(xhr, errorType, exception) {
    var responseText;
    $("#error_details").html("");
    try {
        responseText = $.parseJSON(xhr.responseText);
        $("#error_details").append("<div><b>" + errorType + " " + exception + "</b></div>");
        $("#error_details").append("<div><u>Exception</u>:<br /><br />" + responseText.ExceptionType + "</div>");
        $("#error_details").append("<div><u>StackTrace</u>:<br /><br />" + responseText.StackTrace + "</div>");
        $("#error_details").append("<div><u>Message</u>:<br /><br />" + responseText.Message + "</div>");
    } catch (e) {
        responseText = xhr.responseText;
        $("#error_details").html(responseText);
    }
    // Make sure error section is visible
    $("#error_details").css('visibility', 'visible');
}

function clear_error(){
    $("#error_details").html('').css('visibility', 'hidden');
}