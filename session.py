
class Session:
    def __init__(self, new_id, title=""):
        self.id = new_id     # generated unique session reference
        self.title = title   # title of the item being discussed and voted on
        self.votes = {}      # key = username + location, value = vote

    def add_vote(self, this_username, this_vote, location):
        """Add or Update the vote (number) for a given user|location combo (string).
        We don't care if there is already a vote here.
        """
        self.votes[this_username + '|' + location] = this_vote

    def reset(self):
        """Delete all votes (story change, typically)"""
        self.votes = {}

    def clear_location(self, location):
        """Remove all votes for a given location."""
        for key, value in self.votes.copy().items():
            item_loc = key.split('|')[1]
            if item_loc == location:
                del self.votes[key]
