import unittest
import requests

class SessionTest(unittest.TestCase):
    @classmethod
    def setUpClass(self):
        print('\nSETTING UP TESTS')
        self.base_url = "http://localhost:5000/"
        self.session_id = create_session()  # This id will be used for singleton tests
        _ = create_session()  # Create another one for list testing but we don't keep the id
        self.assertIsNotNone(self, self.session_id)

    def test_a_get(self):
        print('\nTESTING GET')
        url = self.base_url + "votecalc/session/" + self.session_id
        print('URL: ' + url)
        result = requests.get(url)
        d = result.json()
        self.assertEqual(d['id'], self.session_id)

    def test_b_put(self):
        print('\nTESTING PUT')
        test_val = "TEST TITLE"
        url = self.base_url + "votecalc/session/" + self.session_id
        parms = {"title": test_val}
        hdr = '{"Content-Type: application/json"}'
        print('URL: ' + url + ", PARMS: " + str(parms))
        result = requests.put(url, json=parms)
        # result should contain the modified session object
        d = result.json()
        self.assertEqual(d['title'], test_val)

    def test_c_list(self):
        print('\nTESTING LIST')
        url = self.base_url + "votecalc/sessions"
        print('URL: ' + url)
        result = requests.get(url)
        sessions = result.json()
        counter = 0
        for key, item in sessions.items():
            print('\nKEY: ' + key)
            print("id: " + item['id'])
            print("title: " + item['title'])
            counter += 1
        self.assertGreater(counter, 0)

    def test_d_delete(self):
        print('\nTESTING DELETE')
        url = self.base_url + "votecalc/session/" + self.session_id
        result = requests.delete(url)
        # Delete returns True if object was found and deleted
        self.assertTrue(result)


def create_session():
    url = SessionTest.base_url + "votecalc/session/new"
    result = requests.post(url)
    d = result.json()
    session_id = d['id']
    return session_id

# Run all unit tests
if __name__ == '__main__':
    unittest.main()
