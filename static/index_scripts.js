// Custom scripts for application

const BASE_URL = "http://localhost:5000"  // Will be http://votecalc.com

var socket = "";

$(document).ready( WireEvents );

function WireEvents(){
    $('#btnJoin').click( do_join_button );
    $('#btnSetTitle').click( do_set_title_button );
    $('#btnCreate').click( do_create_button );
    $('#btnVote').click( do_vote_button );
    $('#btnShare').click( do_share_button );
    $('#btnReset').click( do_reset_button );
    $('#txtSession').keyup( validate_session );

    $('input[type="radio"][name=optSession]').click( do_session_choice );

    do_session_choice();
    clear_error();
    show_votes_error(false);

    // Connect through web socket to server, supplying session id as namespace
    socket = io.connect(BASE_URL);

    socket.on('server_connect', function (msg) {
        // logit('Server connected');
    });

    socket.on('joined', function(data) {
        $('#lblSessionId').html(data.room);
        $('#txtTitle').val(data.title);

        // Hide session input row
        $('#rowJoin').css('visibility', 'hidden')

    });

    socket.on('change', function(data) {
        // Update different things based on the type of change sent
        switch (data.change_type) {
            case "title":
                // $('#txtTitle').val(data.title); --- Host should not receive title changes
                break;
            case "votes":
                show_votes(data.votes)
                break;
        }

    });
};

function do_session_choice() {
    var choice = $('input[name=optSession]:checked').val();
    if (choice == 'new') {
        $('#btnCreate').prop('disabled', false);
        $('#txtSession').prop('disabled', true);
        $('#btnJoin').prop('disabled', true);
    } else {
        $('#txtSession').prop('disabled', false);
        $('#btnCreate').prop('disabled', true);
    }
}

function validate_session() {
    var x = $('#txtSession').val();
    $('#txtSession').val(x.toUpperCase());
    // Enable Join if session entry looks ok
    if ($('#txtSession').val().search(/([A-Z])([A-Z])([0-9])([0-9])/) >= 0) {
        $('#btnJoin').prop('disabled', false);
    } else {
        $('#btnJoin').prop('disabled', true);
    }
};

function do_vote_button(){
    var votes = $('#txtVote').val().trim();

    if (validate_vote(votes)) {

        show_votes_error(false);
        var this_room = $('#lblSessionId').text();
        var names = $('#txtUser').val().trim();
        data = {room: this_room, username: names, vote: votes};
        socket.emit('vote', data);

    } else {
        show_votes_error(true);
    }

};

function show_votes_error(has_error) {
    if (has_error) {
        $('#ctlVotes').addClass('has-error');
        $('#lblVoteError').show()
    } else {
        $('#ctlVotes').removeClass('has-error');
        $('#lblVoteError').hide()
    }
}

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
            return false;
            break;
        }
    }
    return true
};

function do_join_button(){
    clear_error();
    var session_id = $('#txtSession').val();
    // logit('join room ' + session_id);
    socket.emit('join', {room: session_id});
};


function do_set_title_button(){
    clear_error();
    room = $('#lblSessionId').text();
    var title_text = $('#txtTitle').val();
    // logit('Send title change');
    socket.emit('update', {room: room, title: title_text});
};


function do_create_button(){
    // Create a new session
    clear_error();
    var url = BASE_URL + "/session/new";
    request_create(url);
    $('#btnCreate').prop('disabled', true)
    $( "#btnReset" ).prop('disabled', true);
};

function do_share_button(){
    // Populate a text box with the share link, make it visible and select it for the user to easily copy
    var url = BASE_URL + "/join/" + $('#lblSessionId').text()
    $('#txtShare').css('visibility', 'visible')
    $('#txtShare').val(url)
    $('#txtShare').focus()
    $('#txtShare').select()
    $('#btnShare').prop('disabled', true)

};



function request_create(server_url) {
    // logit('url: ' + server_url);
    $.ajax({
        url: server_url,
        type: 'POST',
        dataType: 'json',
        crossDomain: true,
        jsonp: false,
        success: function (data) { handleCreateResponse(data) },
        error: OnError
    });
}


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
        // Enable reset button
        $( "#btnReset" ).prop('disabled', false);
    } else {
        avg = total;
    }
    result += '<tr><td><b>Average:</b></td><td><b><span id="lblAverage">' + avg.toString() + '</span></b></td></tr>';
    $('#votes').html(result);
    // Briefly highlight the total
    $( "#lblAverage" ).effect("shake", {times:2}, 500);
    $( "#lblAverage" ).effect("highlight", 1000);

}

function handleCreateResponse(data) {
    socket.emit('join', {room: data.id});
}

function do_reset_button() {
    clear_error();
    var this_room = $('#lblSessionId').text();
    // logit('Reset ' + this_room);
    data = {room: this_room};
    socket.emit('reset', data);
}


function logit(msg) {
    $('#Log').prepend(msg + '<br/>');
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