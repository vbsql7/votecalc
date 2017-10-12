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
        show_votes(data.votes);
    });

    socket.on('change', function(data) {
        // Update different things based on the type of change sent
        switch (data.change_type) {
            case "title":
                $('#lblTitle').html(data.title);
                $( "#lblTitle" ).effect("highlight", 1000);
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
    var names = $('#txtUser').val().trim();
    var votes = $('#txtVote').val().trim();
    var error_msg = validate_vote(names, votes);

    if (error_msg == "") {

        clear_error();
        $('#txtVote').css('is-invalid', false);
        var this_room = $('#lblSessionId').text();
        data = {room: this_room, username: names, vote: votes};
        socket.emit('vote', data);

    } else {
        show_error(error_msg);
        $('#txtVote').css('is-invalid', true);
    }

};

function validate_vote(votes_text) {
    // Multiple votes can be given but must use a space or comma delimiter.
    var votes = [];
    var delim;
    var v;

    if (votes_text.indexOf(',') >= 0) {
        delim = ",";
    } else {
        delim = " ";
    }

    votes = votes_text.split(delim);

    // Check for numeric votes
    for (var i=0; i <= votes.length-1; i++) {
        v = votes[i];

        if (!Number.isInteger(parseInt(v))) {
            return 'All votes must be numeric.';
            break;
        }
    }
    return "";
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
    var msg;
    try {
        responseText = $.parseJSON(xhr.responseText);
        msg = "<div><b>" + errorType + " " + exception + "</b></div>";
        msg += "<div><u>Exception</u>:<br /><br />" + responseText.ExceptionType + "</div>";
        msg += "<div><u>StackTrace</u>:<br /><br />" + responseText.StackTrace + "</div>";
        msg += "<div><u>Message</u>:<br /><br />" + responseText.Message + "</div>";
        show_error(msg);
    } catch (e) {
        show_error(xhr.responseText);
    }

}

function show_error(msg) {
    $("#error_details").html(msg);
    // Make sure error section is visible
    $("#error_details").css('visibility', 'visible');
}

function clear_error(){
    $("#error_details").html('').css('visibility', 'hidden');
}