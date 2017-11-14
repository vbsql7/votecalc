// Custom scripts for application

const APP_NAME = "Vote"
const BASE_URL = "http://localhost:5000"

var socket = "";
var this_location = "host";     // Remote client will override this
var location_has_voted = false; // Reset every time the title changes; Used to mask votes of others.

$(document).ready( WireEvents );

function WireEvents(){

    // Set application name
    $('#app-name').html(APP_NAME);

    $('#btnJoin').click( do_join_button );
    // $('#btnJoinRemote').click( do_join_remote );
    $('#btnSetTitle').click( do_set_title_button );
    $('#btnCreate').click( do_create_button );
    $('#btnVote').click( do_vote_button );
    $('#btnShare').click( do_share_button );
    $('#btnReset').click( do_reset_button );
    $('#txtSession').keyup( validate_session );
    $('button[name=btnNumber]').click( do_number_button );

    // Disable Share button
    $('#btnShare').prop('disabled', true)

    $('input[type="radio"][name=optSession]').click( do_session_choice );

    do_session_choice();
    clear_error();
    show_votes_error('');

    // Connect through web socket to server, supplying session id as namespace
    socket = io.connect(BASE_URL);

    socket.on('joined', function(data) {
        $('#lblSessionId').html(data.room);
        $('#txtTitle').val(data.title);
        $('#btnShare').prop('disabled', false);
        $('#btnShare').removeClass('disabled');

        var loc = data.location;
        if (loc.length > 0) {
            logit('Location ' + loc + ' has joined.')
        }

        show_votes(data.votes, true);

    });

    socket.on('change', function(data) {
        // Update different things based on the type of change sent
        switch (data.change_type) {
            case "title":
                $('#lblTitle').html(data.title);
                $( "#lblTitle" ).effect("highlight", 1000);
                location_has_voted = false; // new story requires a new vote
                break;
            case "votes":
                show_votes(data.votes);
                break;
            case "message":
                logit(data.message);
                break;
        }

    });


};

function do_number_button() {
    var v = $(this).val();
    add_local_vote(v)
}

function add_local_vote(v) {
    x = $('#txtVote').val();
    $('#txtVote').val(x + ' ' + v).trim;
}

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

        var users = $('#txtUser').val().trim();

        if (validate_vote_count(users, votes)) {

            show_votes_error('');
            var this_room = $('#lblSessionId').text();
            var names = $('#txtUser').val().trim();
            location_has_voted = true;
            data = {room: this_room, username: names, vote: votes, location: this_location};
            socket.emit('vote', data);
            // Clear local votes (but not names)
            $('#txtVote').val('')

        } else {
            show_votes_error('Vote count differs from Name count');
        }

    } else {
        show_votes_error('Only integers with spaces or commas');
    }

};

function show_votes_error(error_msg) {
    if (error_msg != "") {
        $('#ctlVotes').addClass('has-error');
        $('#lblVoteError').text(error_msg);
        $('#lblVoteError').show();
    } else {
        $('#ctlVotes').removeClass('has-error');
        $('#lblVoteError').hide();
    }
}

function validate_vote(votes_text) {
    // Multiple votes can be given but must use a space or comma delimiter.
    var votes = [];
    var delim = " ";
    var v;

    if (votes_text.indexOf(',') >= 0) {
        delim = ",";
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

function validate_vote_count(users, votes) {
    // Ensure there are enough users to cover the votes cast
    var delim = " "
    if (votes.indexOf(',') >= 0) {
        delim = ",";
    }
    var user_count = users.split(delim).length;
    var vote_count = votes.split(delim).length;

    // If more than one name or vote is present, we assume that user has multiple people at that location and
    // therefore we take the trouble to help them get voting right by matching votes with names.
    // If only one value is given, we can identify the vote with the location and don't really need the name.
    if ((vote_count != user_count) && ((vote_count > 1) || (user_count > 1))){
        return false
    } else {
        return true // OK
    }

}

function do_join_button(){
    clear_error();
    var session_id = $('#txtSession').val();
    socket.emit('join', {room: session_id, location: this_location});
};

function do_join_remote(){
    var loc = $('#txtLocation').val().trim();

    if (loc.length > 0) {

        show_location_error(false);
        var room = $('#lblSessionId').text();
        alert('room = ' + room);
        request_join(room, loc);

    } else {
        show_location_error(true);
    }

};

function do_set_title_button(){
    clear_error();
    room = $('#lblSessionId').text();
    var previous_title = $('#lblTitle').text();
    var title_text = $('#txtTitle').val();
    $('#lblTitle').html(title_text);
    socket.emit('update', {room: room, title: title_text});

    // If Reset desired, reset votes and show previous story
    if ($('#chkResetVotes').is(':checked')) {
        // Send completed story message to room
        // if (previous_title != 'no title yet'){
        if (location_has_voted){
            var data = {room: room, message: 'Completed: ' + previous_title + ' (' +  $('#lblAverage').text() + ')'};
            socket.emit('send-message', data);
        }
        // Reset all votes
        reset_votes();
    }
};


function do_create_button(){
    // Create a new session
    clear_error();
    var url = BASE_URL + "/session/new";
    request_create(url);
    $('#btnCreate').prop('disabled', true)
    $('#btnReset').prop('disabled', true);
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

function show_location_error(has_error) {
    if (has_error) {
        $('#ctlLocation').addClass('has-error');
        $('#lblLocationError').show()
    } else {
        $('#ctlLocation').removeClass('has-error');
        $('#lblLocationError').hide()
    }
}

function request_join(this_room, this_loc) {
    $.ajax({
        url: BASE_URL + '/location/' + this_room + '?location=' + this_loc,
        type: 'GET',
        dataType: 'json',
        crossDomain: true,
        jsonp: false,
        success: function (data) { handleJoinResponse(data) },
        error: OnError
    });
}

function handleJoinResponse(data){
    // Nothing happens here. Server will redirect to Remote.html.
}

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
    var result = "<tr><th>User</th><th>Vote</th></tr>";
    var total = 0;
    var vote_count = 0;
    var avg = 0;
    var displayed_avg;

    var extreme_votes = find_extreme_votes(votes);

    for (var key in votes) {
        // key is in the form user|location
        var user = key.split('|')[0];
        var loc = key.split('|')[1];
        var vote = votes[key];
        var extreme_class = '';
        var marker = '';
        if (location_has_voted) {
            displayed_vote = vote;

            if (extreme_votes.indexOf(Number(vote)) >= 0){
                extreme_class = ' bgcolor="yellow" ';
                marker = ' !'
            }
        } else {
            displayed_vote = '**';
        }

        result +='<tr><td>' + user + ' (' + loc + ')</td><td' + extreme_class + '>' + displayed_vote + marker + '</td></tr>';

        if ($.isNumeric(vote)){
            total += parseInt(vote);
            vote_count += 1;
        }
    };

    if(vote_count > 0) {
        avg = (total/vote_count).toFixed(2);
        // Enable reset button
        $( "#btnReset" ).prop('disabled', false);
    } else {
        avg = total;
    }

    if (location_has_voted) {
        displayed_avg = avg.toString();
    } else {
        displayed_avg = "****";
    }

    result += '<tr><td><b>Average:</b></td><td><b><span id="lblAverage">' + displayed_avg + '</span></b></td></tr>';
    $('#votes').html(result);

    // $('#votes').redraw();

    // Briefly highlight the total
    $( "#lblAverage" ).effect("clip");
    $( "#lblAverage" ).effect("highlight", 2000);

}

function handleCreateResponse(data) {
    socket.emit('join', {room: data.id, location: 'host'});
}

function find_extreme_votes(votes) {
    // Find extreme votes, defined as votes more than two gaps apart in the number sequence.
    var numbers = [1, 2, 3, 5, 9, 13, 21, 34, 55, 89]
    var min_num = 777
    var max_num = 0

    // Find the min and max in the list
    for (var key in votes) {
        var vote = Number(votes[key]);
        if (vote < min_num) {
            min_num = vote;
        }
        if (vote > max_num) {
            max_num = vote;
        }
    }

    // First, find the position of min and max votes
    var min_pos = 99;
    var max_pos = -1;
    for(i=0; i < numbers.length; i++){
        if (numbers[i] == min_num) {
            min_pos = i;
        }
        if (numbers[i] == max_num) {
            max_pos = i;
        }
    }

    // Second, measure the distance between the positions
    if ((max_pos - min_pos) > 2){
        return [min_num, max_num];
    } else {
        return []; // There are no extreme votes
    }
}

function do_reset_button() {
    clear_error();
    reset_votes();
}

function reset_votes() {
    var this_room = $('#lblSessionId').text();
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