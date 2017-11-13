# votecalc
Team voting tool for Agile story estimation.

Author: Michael Wilkes

## Background
Having used multiple tools for story estimation, I found that there is at least one situation they do not handle well: Teams that share one login at a given location, regardless of how many locations are involved. This scenario presents some unique challenges for gathering votes and calculating results.
Other tools assume that each voting member will be logged into the tool separately, thereby giving the developer a unique user to get votes from. While this may be true of a distributed workforce, it is sometimes the case that there are multiple people in a conference room at one or multiple locations, and these people are interacting with each other visually with only one person at the location logged in.
This app focuses on locations rather than users. It handles multiple votes arriving, not from logged in users, but from locations (connections to the 'room'). Each location can cast multiple voter, giving each one a name. Both name and location are identified in the votes display.

## Dependencies

- flask
- flask-httpauth
- flask-cors
- flask_socketio
- gevent
- jsonpickle
- requests


