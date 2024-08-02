from bs4 import BeautifulSoup
import requests

def get_questions():
    url = "https://stackoverflow.com/questions"
    page = requests.get(url)
    
    soup = BeautifulSoup(page.content, "html.parser")
    results = soup.find(id="questions")

    if results:
        questions = results.find_all(class_ = "s-link")
    
        for result in questions:
            print(result.prettify(), "\n")

get_questions()
