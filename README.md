# votecalc
Team voting tool useful for Agile story estimation among other things.

Author: Michael Wilkes

## Background
Having used multiple tools for remote planning, I found that there is one situation they do not handle well: A hybrid team that is both local (multiple people in the office) and remote. This scenario presents some unique challenges for gathering votes and calculating results.

## Dependencies

- flask
- flask-httpauth
- jsonpickle
- requests

## Unit Tests

See test.py

## Manual Testing

Note that the triple quotes are required only for testing in Windows.

Get a list of sessions:
    curl -u user:pass -i http://localhost:5000/votecalc/sessions

Get a single session:
    curl -u user:pass -i http://localhost:5000/votecalc/session/s1234567

Create a new session:
    curl -u user:pass -i http://localhost:5000/votecalc/session/new

Update a session:
    curl -u user:pass -i -H "Content-Type: application/json" -X PUT -d """{"title":"The New Title"}""" http://localhost:5000/votecalc/session/s1234567

Delete a session:
    curl -u user:pass -i -X DELETE -d http://localhost:5000/votecalc/session/s1234567
