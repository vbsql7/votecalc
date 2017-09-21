// Custom scripts for application

const BASE_URL = "http://localhost:5000"

$(document).ready( WireEvents );

function WireEvents(){
    $('#btnVote').click( do_vote_button );
    clear_error();
};

function do_vote_button(){
    clear_error();
    var this_username = $('#txtUser').val();
    var this_vote = $('#txtVote').val();
    var session_id = $('#lblSessionId').html();
    var url = BASE_URL + "/votecalc/session/" + session_id + "/vote";
    data = JSON.stringify({username: this_username, vote: this_vote});
    post_vote(url, data);
};

function post_vote(server_url, post_data) {
    logit('url: ' + server_url);
    logit('data: ' + post_data);
    $.ajax({
        url: server_url,
        data: post_data,
        dataType: 'json',
        type: 'POST',
        contentType: 'application/json',
        success: function (data) { handlePostVoteResponse(data) },
        error: OnError
    });
}

function handlePostVoteResponse(data) {
    show_votes(data.votes);
}

function show_votes(d) {
    result = "<tr><th>User</th><th>Vote</th></tr>";
    total = 0;
    votes = 0;
    $.map(d, function(vote, user){
        result +='<tr><td>' + user + '</td><td>' + vote + '</td></tr>';
        if ($.isNumeric(vote)){
            total += parseInt(vote);
            votes += 1;
        }
    });
    if(votes > 0) {
        avg = (total/votes).toFixed(2);
    } else {
        avg = total;
    }
    result += '<tr><td><b>Average:</b></td><td><b><span id="lblAverage">' + avg.toString() + '</span></b></td></tr>';
    $('#votes').html(result);
    // Briefly highlight the total
    $( "#lblAverage" ).effect("shake", {times:2}, 500);
    $( "#lblAverage" ).effect("highlight", 1000);

}

function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
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