from bs4 import BeautifulSoup
import requests
from requests.auth import HTTPBasicAuth

basic = HTTPBasicAuth('user', 'pass')
page = requests.get('https://httpbin.org/basic-auth/user/pass', auth=basic)
print(page.text)