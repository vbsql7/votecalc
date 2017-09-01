#!flask/bin/python
from flask import Flask, jsonify
from flask import abort
from flask import make_response
from flask import request
from flask_httpauth import HTTPBasicAuth

from controllers.manager import Manager

import sys

auth = HTTPBasicAuth()

# Load manager and sessions list
session_manager = Manager()

# Require master user and password to prevent random invocations
@auth.get_password
def get_password(username):
    if username == 'voter':
        return 'cast'
    return None

@auth.error_handler
def unauthorized():
    return make_response(jsonify({'error': 'Unauthorized access'}), 401)

app = Flask(__name__)

@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Resource not found'}), 404)


@app.route('/votecalc/sessions', methods=['GET'])
@auth.login_required
def get_sessions():
    sess_list = []
    for session in session_manager.session_list:
        sess_list.append(jsonify(session))
    return sess_list


@app.route('/votecalc/sessions/<int:session_id>', methods=['GET'])
def get_session(session_id):
    sess = session_manager.get_session(session_id)
    if sess is None:
        abort(404)
    else:
        return jsonify({'session': sess})


@app.route('/votecalc/session/new', methods=['GET'])
def create_session():
    sess = session_manager.create_session()
    return jsonify({'Session ID:': sess.id}), 201


@app.route('/votecalc/sessions/<int:session_id>', methods=['PUT'])
def update_session(session_id):
    if not request.json:
        abort(400)
    sess = session_manager.get_session(session_id)
    if sess is None:
        abort(404)
    # Update session attributes
    sess.title = request.json.get('title')
    return jsonify({'session': sess})


@app.route('/votecalc/sessions/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    if not request.json:
        abort(400)
    sess = session_manager.get_session(session_id)
    if sess is None:
        abort(404)
    session_manager.delete_session(sess.id)
    return jsonify({'result': True})

if __name__ == '__main__':
    try:
        app.run(debug=True)
    except (ValueError, TypeError) as e:
        print('Error in {0}: {1}'.format(__name__, str(e)), file=sys.stderr)
