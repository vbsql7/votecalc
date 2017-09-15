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
CORS(app)  # Allow cross-domain requests

@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Resource not found'}), 404)


@app.route('/votecalc/sessions', methods=['GET'])
#  @auth.login_required
def get_sessions():
    x = jsonpickle.encode(session_manager.session_list, unpicklable=False)
    return x


@app.route('/votecalc/session/<session_id>', methods=['GET'])
def get_session(session_id):
    sess = session_manager.get_session(session_id)
    if sess is None:
        abort(404)
    else:
        return jsonpickle.encode(sess, unpicklable=False)


@app.route('/votecalc/session/new', methods=['POST'])
def create_session():
    sess = session_manager.create_session()
    return jsonify({'id': sess.id}), 201


@app.route('/votecalc/session/<session_id>', methods=['PUT'])
def update_session(session_id):
    if not request.is_json:
        abort(400)
    sess = session_manager.get_session(session_id)
    if sess is None:
        abort(404)
    # Extract incoming json object
    data = request.json
    # Update session attributes
    t = data['title']
    sess.title = t
    return jsonpickle.encode(sess, unpicklable=False)


@app.route('/votecalc/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    sess = session_manager.get_session(session_id)
    if sess is None:
        abort(404)
    result = session_manager.delete_session(sess.id)
    return jsonify(result)


def debugmsg(msg):
    print('*************************************')
    print(msg)
    print('*************************************')


if __name__ == '__main__':
    try:
        app.run(debug=True)
    except (ValueError, TypeError) as e:
        print('Error in {0}: {1}'.format(__name__, str(e)), file=sys.stderr)
