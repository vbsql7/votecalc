// Custom scripts for application

$(document).ready( WireEvents );

function WireEvents(){
    $('#btnJoin').click( do_join_button );
    $('#btnSetTitle').click( do_set_title_button );
    $('#btnCreate').click( do_create_button );
    $('#btnVote').click( do_vote_button );
    clear_error();
};

function do_join_button(){
    clear_error();
    var s = $('#txtSession').val();
    var url = "http://localhost:5000/votecalc/session/" + s;
    request_join(url);
};

function do_set_title_button(){
    clear_error();
    var s = $('#txtSession').val();
    var title_text = $('#txtTitle').val();
    var post_data = JSON.stringify({title: title_text});
    var url = "http://localhost:5000/votecalc/session/" + s;
    post_title(url, post_data);
};

function do_vote_button(){
    clear_error();
    var this_username = $('#txtUser').val();
    var this_vote = $('#txtVote').val();
    var session_id = $('#lblSessionId').html();
    var url = "http://localhost:5000/votecalc/session/" + session_id + "/vote";
    data = JSON.stringify({username: this_username, vote: this_vote});
    post_vote(url, data);
};

function do_create_button(){
    clear_error();
    var url = "http://localhost:5000/votecalc/session/new";
    request_create(url);
};

function post_vote(server_url, post_data) {
    logit('url: ' + server_url);
    logit('data: ' + post_data);
    $.ajax({
        url: server_url,
        data: post_data,
        dataType: 'json',
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', make_base_auth('voter', 'cast'));
        },
        contentType: 'application/json',
        success: function (data) { handlePostVoteResponse(data) },
        error: OnError
    });
}

function post_title(server_url, post_data) {
    logit('url: ' + server_url);
    logit('data: ' + post_data);
    $.ajax({
        url: server_url,
        data: post_data,
        dataType: 'json',
        type: 'PUT',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', make_base_auth('voter', 'cast'));
        },
        contentType: 'application/json',
        success: function (data) { handlePostTitleResponse(data) },
        error: OnError
    });
}

function request_create(server_url) {
    logit('url: ' + server_url);
    $.ajax({
        url: server_url,
        type: 'POST',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', make_base_auth('voter', 'cast'));
        },
        dataType: 'json',
        crossDomain: true,
        jsonp: false,
        success: function (data) { handleCreateResponse(data) },
        error: OnError
    });
}

function request_join(server_url) {
    logit('url: ' + server_url);
    $.ajax({
        url: server_url,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', make_base_auth('voter', 'cast'));
        },
        dataType: 'json',
        crossDomain: true,
        jsonp: false,
        success: function (data) { handleJoinResponse(data) },
        error: OnError
    });
}

function handleJoinResponse(data) {
    // Hide session input box
    $('#txtSession').css('visibility', 'hidden')
    $('#btnJoin').css('visibility', 'hidden')
    // Show data retrieved
    $('#lblSessionId').html(data.id);
    $('#lblSessionId').css('visibility','visible');
    $('#lblTitle').html(data.title);
}

function handlePostVoteResponse(data) {
    var x = 'id: ' + data.id + ', title: ' + data.title + ', votes: ' + dump_duct(data.votes);
    logit('Vote response: ' + x);
}

function dump_duct(d) {
    result = "";
    $.map(d, function(value, key){
        result += key + '=' + value + '; '
    });
    return result
}

function handleCreateResponse(data) {
    logit('New id: ' + data.id);
}

function handlePostTitleResponse(data) {
    $('#lblTitle').html(data.title);
}

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}

function logit(msg) {
    $('#Log').append('<br/>' + msg);
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