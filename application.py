#!flask/bin/python
from flask import Flask, jsonify
from flask import abort, make_response, request, render_template, url_for, redirect
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room

from manager import Manager  # Main session manager/controller

import jsonpickle
import sys

async_mode = None

# Load manager and sessions list
session_manager = Manager()

application = Flask(__name__)
application.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(application, async_mode=async_mode)

CORS(application)  # Allow cross-domain requests


@application.errorhandler(404)
def not_found():
    """Handle not-found errors."""
    return make_response(jsonify({'error': 'Route (page) not found.'}), 404)


@application.route('/')
def show_index():
    """Show the host starting page."""
    return render_template('index.html')


@socketio.on('connect')
def connect_client():
    """Receive connect event and broadcast back server_connected."""
    socketio.emit('server_connect', {"data": 'Connected'})
    return True


@socketio.on('send-message')
def receive_message(data):
    """Receive message from client to share with everyone in the room."""
    rm = data['room']
    msg = data['message']
    emit('change', {"change_type": 'message', "message": msg}, room=rm)
    return True


@socketio.on('vote')
def process_vote(data):
    """Process incoming votes."""
    rm = data['room']
    try:
        sess = session_manager.get_session(rm)
        if sess is None:
            abort(404)
        else:
            names = data['username']
            votes = data['vote']
            location = data['location']
            debugmsg('Votes received for location ' + location)
            # Clear existing votes for this location
            sess.clear_location(location)
            # Get a matching set of names and votes
            dvotes = parse_votes(names, votes)
            for name, vote in dvotes:
                sess.add_vote(name, vote, location)
            debugmsg('Notify all locations of new votes (emit)')
            # Send all votes to all clients in the room
            emit('change', {"change_type": 'votes', "votes": sess.votes}, room=rm)
    except:
        debugmsg('Error during process_vote: ' + str(sys.exc_info()[0]))
        raise


def parse_votes(names, votes):
    """Parse strings of names and votes into matching arrays. Allow names to be missing."""
    dvotes = []
    if votes.find(',') >= 0:
        delim = ','
    else:
        delim = ' '

    avotes = votes.split(delim)
    anames = names.split(delim)

    i = 0
    for vote in avotes:
        if i > len(anames) - 1:
            name = 'unknown'
        else:
            name = anames[i]
        debugmsg(name + ' voted ' + vote)
        dvotes.append([name, vote])
        i += 1

    return dvotes


@socketio.on('join')
def join_event(message):
    """Receive join request from a client and confirm by sending joined event to everyone in the room."""
    rm = message['room']
    loc = message['location']
    debugmsg('Location ' + loc + ' joining room ' + rm)
    try:
        sess = session_manager.get_session(rm)
        if sess is None:
            abort(404)
        else:
            join_room(rm)  # flask function
            debugmsg('Server joined room: ' + rm)
            data = {"room": rm, "title": sess.title, "votes": sess.votes, "location": loc}
            emit('joined', data, room=rm)
    except:
        debugmsg('Error during join_event: ' + str(sys.exc_info()[0]))
        raise


@socketio.on('update')
def update_session(data):
    """Update data in a given session (room)"""
    try:
        rm = data['room']
        title = data['title']
        debugmsg('Updating title in room ' + rm + ' to ' + title)
        sess = session_manager.get_session(rm)
        if sess is None:
            abort(404)
        sess.title = title
        emit('change', {"change_type": 'title', "title": title}, room=rm)
    except:
        debugmsg('Error during update_session: ' + str(sys.exc_info()[0]))
        raise


@socketio.on('reset')
def reset_session(data):
    """Reset the votes in given session (room)"""
    try:
        debugmsg('RESET EVENT')
        rm = data['room']
        sess = session_manager.get_session(rm)
        if sess is None:
            abort(404)
        sess.reset()
        emit('change', {"change_type": 'votes', "votes": sess.votes}, room=rm)
    except:
        debugmsg('Error during reset_session: ' + str(sys.exc_info()[0]))
        raise


@application.route('/favicon.ico', methods=['GET'])
def get_favicon():
    return url_for('static', filename='favicon.ico')


@application.route('/sessions', methods=['GET'])
def get_sessions():
    """Get a list of all sessions. For admin monitoring use."""
    try:
        x = jsonpickle.encode(session_manager.session_list, unpicklable=False)
        return x
    except:
        debugmsg('Error during get_sessions: ' + str(sys.exc_info()[0]))
        raise


@application.route('/join/<session_id>', methods=['GET'])
def join_session(session_id):
    """Prompt remote users for a location to identify them as they join a session."""
    try:
        sess = session_manager.get_session(session_id)
        if sess is None:
            abort(404)
        else:
            return render_template('join.html', session_id=session_id, title=sess.title)
    except:
        debugmsg('ERROR during join_session: ' + str(sys.exc_info()[0]))
        raise


@application.route('/location', methods=['POST'])
def location_join():
    """Join a session (room) from a given location."""
    try:
        debugmsg('Get session_id from form input')
        session_id = request.form['session_id']
        sess = session_manager.get_session(session_id)
        if sess is None:
            abort(404)
        else:
            debugmsg('Get location from form input')
            loc = request.form['location']
            debugmsg('Render remote template for room ' + session_id + ', location ' + loc)
            return render_template('remote.html', session_id=session_id, location=loc, title=sess.title)
    except:
        debugmsg('ERROR during location_join: ' + str(sys.exc_info()[0]))
        raise


@application.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get a specific session."""
    try:
        sess = session_manager.get_session(session_id)
        if sess is None:
            abort(404)
        else:
            return jsonpickle.encode(sess, unpicklable=False)
    except:
        debugmsg('ERROR DURING FETCH get_session: ' + str(sys.exc_info()[0]))
        raise


@application.route('/session/new', methods=['POST'])
def create_session():
    """Create a new session."""
    try:
        sess = session_manager.create_session()
        debugmsg('Created session ' + sess.id)
        return jsonify({'id': sess.id}), 201
    except:
        debugmsg('Error during create_session: ' + str(sys.exc_info()[0]))
        raise



def delete_session(session_id):
    """Delete a session. Used by automatic housekeeping. Never by users."""
    # TODO: Replace with periodic task to remove idle sessions.
    try:
        sess = session_manager.get_session(session_id)
        if sess is None:
            abort(404)
        result = session_manager.delete_session(sess.id)
        return jsonify(result)
    except:
        debugmsg('Error during delete_session: ' + str(sys.exc_info()[0]))
        raise



def debugmsg(msg):
    """Print debug messages. For testing only."""
    print('*************************************')
    print(msg)
    print('*************************************')


if __name__ == '__main__':
    """Start the voting server."""
    try:
        socketio.run(application, debug=True)
    except Exception as e:
        print('Error in {0}: {1}'.format(__name__, str(e)), file=sys.stderr)
