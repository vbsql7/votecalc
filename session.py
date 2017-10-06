
class Session:
    def __init__(self, new_id, title=""):
        self.id = new_id     # generated unique session reference
        self.title = title   # title of the item being discussed and voted on
        self.callbacks = []  # js functions to update connected clients
        self.votes = {}      # key = username, value = vote}

    def add_vote(self, this_username, this_vote):
        """Add or Update the vote (number) for a given user (string).
        We don't care if there is already a vote here.
        """
        self.votes[this_username] = this_vote

    def reset(self):
        self.votes = {}


