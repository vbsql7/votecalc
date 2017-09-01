
import random

from session import Session


class Manager:
    def __init__(self):
        self.session_list = {}  # dictionary

    def create_session(self, title=""):
        # Evolve this to pull from a data store
        x = random.random() * 99999999
        session_id = "s" + str(int(x))  # Example: s5839483
        sess = Session(session_id, title)  # create Session object
        self.session_list[session_id] = sess  # store under random id
        return sess

    def get_session(self, key):
        if key in self.session_list:
            return self.session_list.get(key, None)
        else:
            return None  # nothing

    def delete_session(self, key):
        if key in self.session_list:
            self.session_list.pop(key, None)
        else:
            abort(404)
