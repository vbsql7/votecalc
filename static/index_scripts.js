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
    $('#txtSession').blur( force_id_uppercase );

    clear_error();

    // Connect through web socket to server, supplying session id as namespace
    socket = io.connect(BASE_URL);

    socket.on('server_connect', function (msg) {
        logit('Server connected');
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

function force_id_uppercase() {
    var x = $('#txtSession').val();
    $('#txtSession').val(x.toUpperCase());
};

function do_join_button(){
    clear_error();
    var session_id = $('#txtSession').val();
    logit('join room ' + session_id);
    socket.emit('join', {room: session_id});
};


function do_set_title_button(){
    clear_error();
    room = $('#lblSessionId').text();
    var title_text = $('#txtTitle').val();
    logit('Send title change');
    socket.emit('update', {room: room, title: title_text});
};

function do_vote_button(){
    clear_error();
    var this_room = $('#lblSessionId').text();
    var this_username = $('#txtUser').val();
    var this_vote = $('#txtVote').val();
    data = {room: this_room, username: this_username, vote: this_vote};
    logit('Send vote for ' + JSON.stringify(data));
    socket.emit('vote', data);
};

function do_create_button(){
    // Create a new session
    clear_error();
    var url = BASE_URL + "/session/new";
    request_create(url);
    $('#btnCreate').prop('disabled', true)

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
    logit('url: ' + server_url);
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
    $('#txtSession').val(data.id);
    do_join_button();
}

function logit(msg) {
    $('#Log').prepend(msg + '<br/>');
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