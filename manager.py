
import random
import time

from session import Session


class Manager:
    """Manage user sessions. This is the top level object in the app."""
    def __init__(self):
        self.session_list = {}  # dictionary

    def create_session(self, title=""):
        """Create a unique [to this app] session, store it, and return it."""
        session_id = generate_session_id(self)  # Example: ZRHI
        sess = Session(session_id, title)  # create Session object
        self.session_list[session_id] = sess  # store under random id
        return sess

    def get_session(self, key):
        """Return a session based on the incoming hash key"""
        if key in self.session_list:
            return self.session_list.get(key, None)
        else:
            return None  # nothing

    def delete_session(self, key):
        """Delete a session based on the incoming hash key"""
        if key in self.session_list:
            self.session_list.pop(key, None)
            return True
        else:
            abort(404)

def generate_session_id(self):
    """Generate a random id and check that it has not been used yet.
    Make it easy to remember and relay verbally. Format: AA##. Example: BK78.
    """
    while True:
        sid = ""
        # Start with two letters
        for i in range(1, 3):
            r = int(random.random() * 24)
            sid += "ABCDEFGHJKLMNPQRSTUVWXYZ"[r]  # Omitted the often confusing I and O
        # Add last two digits of time (fractional seconds)
        sid += str(time.time())[-2:]
        if sid not in self.session_list:
            break  # otherwise we loop and create another sid
    return sid

