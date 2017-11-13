
class Session:
    def __init__(self, new_id, title=""):
        self.id = new_id     # generated unique session reference
        self.title = title   # title of the item being discussed and voted on
        self.votes = {}      # key = username, value = vote}
        self.locations = []  # arbitrary name for remote location

    def add_vote(self, this_username, this_vote, location):
        """Add or Update the vote (number) for a given user (string).
        We don't care if there is already a vote here.
        """
        self.votes[this_username + ' (' + location + ')'] = this_vote

        # Maintain a list of unique locations
        if location not in self.locations:
            self.locations.append(location)

    def reset(self):
        self.votes = {}



