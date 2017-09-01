
class Session:
    def __init__(self, new_id, title=""):
        self.id = new_id
        self.title = title
        self.votes = []  # {username:vote}
