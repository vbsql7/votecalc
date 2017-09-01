
class Session:
    def __init__(self, new_id):
        self.id = new_id
        self.title = ""  # title of work being voted on
        self.votes = []  # {username:vote}
