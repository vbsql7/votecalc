#!flask/bin/python
from flask import Flask, jsonify
from flask import abort
from flask import make_response
from flask import request
from flask_httpauth import HTTPBasicAuth
from flask_cors import CORS, cross_origin

from manager import Manager

from json import loads

import jsonpickle

import sys

auth = HTTPBasicAuth()

# Load manager and sessions list
session_manager = Manager()

app = Flask(__name__)
CORS(app)  # Allow cross-domain requests

# Require master user and password to prevent random invocations
@auth.get_password
def get_password(username):
    """Return the password for the special user required to connect."""
    if username == 'voter':
        return 'cast'
    return None

@auth.error_handler
def unauthorized():
    """Handle unauthorized access."""
    return make_response(jsonify({'error': 'Unauthorized access'}), 401)


@app.errorhandler(404)
def not_found(error):
    """Handle not-found errors."""
    return make_response(jsonify({'error': 'Resource not found'}), 404)


@app.route('/votecalc/sessions', methods=['GET'])
#  @auth.login_required
def get_sessions():
    """Get a list of all sessions."""
    try:
        x = jsonpickle.encode(session_manager.session_list, unpicklable=False)
        return x
    except:
        debugmsg('Error during get_sessions: ' + str(sys.exc_info()[0]))
        raise


@app.route('/votecalc/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get a specific session."""
    try:
        sess = session_manager.get_session(session_id)
        if sess is None:
            abort(404)
        else:
            return jsonpickle.encode(sess, unpicklable=False)
    except:
        debugmsg('Error during get_session: ' + str(sys.exc_info()[0]))
        raise

@app.route('/votecalc/session/new', methods=['POST'])
def create_session():
    """Create a new session."""
    try:
        sess = session_manager.create_session()
        return jsonify({'id': sess.id}), 201
    except:
        debugmsg('Error during create_session: ' + str(sys.exc_info()[0]))
        raise

@app.route('/votecalc/session/<session_id>', methods=['PUT'])
def update_session(session_id):
    """Update the title for a given session."""
    # TODO: Reset votes on title change
    if not request.is_json:
        abort(400)
    try:
        sess = session_manager.get_session(session_id)
        if sess is None:
            abort(404)
        # Extract incoming json object
        data = request.json
        # Update session attributes
        t = data['title']
        sess.title = t
        return jsonpickle.encode(sess, unpicklable=False)
    except:
        debugmsg('Error during update_session: ' + str(sys.exc_info()[0]))
        raise

@app.route('/votecalc/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a given session."""
    try:
        sess = session_manager.get_session(session_id)
        if sess is None:
            abort(404)
        result = session_manager.delete_session(sess.id)
        return jsonify(result)
    except:
        debugmsg('Error during delete_session: ' + str(sys.exc_info()[0]))
        raise

@app.route('/votecalc/session/<session_id>/vote', methods=['POST'])
def add_vote(session_id):
    """Cast one user vote for a given session."""
    if not request.is_json:
        abort(400)
    try:
        sess = session_manager.get_session(session_id)
        if sess is None:
            abort(404)
        # Extract incoming json object
        data = request.json
        username = data['username']
        vote = data['vote']
        # Tell session to add or update one vote
        sess.add_vote(username, vote)
        return jsonpickle.encode(sess, unpicklable=False)
    except:
        debugmsg('Error during vote: ' + str(sys.exc_info()[0]))
        raise

def debugmsg(msg):
    """Print debug messages. For testing only."""
    print('*************************************')
    print(msg)
    print('*************************************')


if __name__ == '__main__':
    """Start the voting server."""
    try:
        app.run(debug=True)
    except (ValueError, TypeError) as e:
        print('Error in {0}: {1}'.format(__name__, str(e)), file=sys.stderr)
