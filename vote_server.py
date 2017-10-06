#!flask/bin/python
from flask import Flask, jsonify
from flask import abort, make_response, request, render_template, url_for
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room

from manager import Manager  # Main session manager/controller

import jsonpickle
import sys

# TODO: Add Reset button for moderator

async_mode = None

# Load manager and sessions list
session_manager = Manager()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode)

CORS(app)  # Allow cross-domain requests


@app.errorhandler(404)
def not_found(error):
    """Handle not-found errors."""
    return make_response(jsonify({'error': 'Route (page) not found.'}), 404)


@app.route('/')
def show_index():
    """Show the host starting page."""
    return render_template('index.html')


@socketio.on('connect')
def connect_client():
    socketio.emit('server_connect', {"data": 'Connected'})
    debugmsg('Server connect event')
    return True


@socketio.on('vote')
def process_vote(data):
    rm = data['room']
    try:
        sess = session_manager.get_session(rm)
        if sess is None:
            abort(404)
        else:
            username = data['username']
            vote = data['vote']
            sess.add_vote(username, vote)
            debugmsg('VOTE received for ' + username + ': ' + vote)
            # Send all votes to all clients in the room
            debugmsg('Send back all votes: ' + str(sess.votes))
            emit('change', {"change_type": 'votes', "votes": sess.votes}, room=rm)
    except:
        debugmsg('Error during process_vote: ' + str(sys.exc_info()[0]))
        raise


@socketio.on('join')
def join_session(message):
    rm = message['room']
    try:
        sess = session_manager.get_session(rm)
        if sess is None:
            abort(404)
        else:
            join_room(rm)
            debugmsg('Server joined room: ' + rm)
            data = {"room": rm, "title": sess.title, "votes": sess.votes}
            emit('joined', data, room=rm)
    except:
        debugmsg('Error during join_session: ' + str(sys.exc_info()[0]))
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


@app.route('/favicon.ico', methods=['GET'])
def get_favicon():
    return url_for('static', filename='favicon.ico')


@app.route('/sessions', methods=['GET'])
def get_sessions():
    """Get a list of all sessions. For admin monitoring use."""
    try:
        x = jsonpickle.encode(session_manager.session_list, unpicklable=False)
        return x
    except:
        debugmsg('Error during get_sessions: ' + str(sys.exc_info()[0]))
        raise


@app.route('/join/<session_id>', methods=['GET'])
def join_session(session_id):
    """Join a given session and load the main page."""
    try:
        sess = session_manager.get_session(session_id)
        if sess is None:
            abort(404)
        else:
            return render_template('remote.html', session_id=session_id, title=sess.title)
    except:
        debugmsg('ERROR DURING JOIN get_session: ' + str(sys.exc_info()[0]))
        raise


@app.route('/session/<session_id>', methods=['GET'])
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


@app.route('/session/new', methods=['POST'])
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
        socketio.run(app, debug=True)
    except Exception as e:
        print('Error in {0}: {1}'.format(__name__, str(e)), file=sys.stderr)
