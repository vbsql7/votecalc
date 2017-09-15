// Custom scripts for application

$(document).ready( WireEvents );

function WireEvents(){
    $('#btnJoin').click( do_join_button );
    $('#btnSetTitle').click( do_set_title_button );
};

function do_join_button(){
    var s = $('#txtSession').val();
    var url = "http://localhost:5000/votecalc/session/" + s;
    request_join(url);
};

function do_set_title_button(){
    var s = $('#txtSession').val();
    var title_text = $('#txtTitle').val();
    var post_data = JSON.stringify({title: title_text});
    var url = "http://localhost:5000/votecalc/session/" + s;
    post_title(url, post_data);
};

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

}