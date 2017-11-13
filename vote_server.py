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
            names = data['username']
            votes = data['vote']
            dvotes = parse_votes(names, votes)
            for name, vote in dvotes:
                sess.add_vote(name, vote)
            # Send all votes to all clients in the room
            emit('change', {"change_type": 'votes', "votes": sess.votes}, room=rm)
    except:
        debugmsg('Error during process_vote: ' + str(sys.exc_info()[0]))
        raise

def parse_votes(names, votes):
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
    rm = message['room']
    debugmsg('Server asked to join room ' + rm)
    try:
        sess = session_manager.get_session(rm)
        if sess is None:
            abort(404)
        else:
            join_room(rm)  # flask function
            debugmsg('Server joined room: ' + rm)
            data = {"room": rm, "title": sess.title, "votes": sess.votes}
            emit('joined', data, room=rm)
    except:
        debugmsg('Error during join_event: ' + str(sys.exc_info()[0]))
        raise


# @socketio.on('joining')
# def joining_session(message):
#     rm = message['room']
#     try:
#         sess = session_manager.get_session(rm)
#         if sess is None:
#             abort(404)
#         else:
#             loc = message['location']
#             debugmsg('Location ' + loc + ' joining room ' + rm)
#             return render_template('remote.html', session_id=rm, title=sess.title, location=loc)
#     except:
#         debugmsg('Error during joining_session: ' + str(sys.exc_info()[0]))
#         raise


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
    """Prompt for location to join a session."""
    try:
        sess = session_manager.get_session(session_id)
        if sess is None:
            abort(404)
        else:
            return render_template('join.html', session_id=session_id, title=sess.title)
    except:
        debugmsg('ERROR during join_session: ' + str(sys.exc_info()[0]))
        raise


@app.route('/location', methods=['POST'])
def location_join():
    """Prompt for location to join a session."""
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
