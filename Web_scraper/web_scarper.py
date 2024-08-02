from bs4 import BeautifulSoup
import requests
import json

def get_questions():
    url = "https://stackoverflow.com/questions"
    page = requests.get(url)
    
    soup = BeautifulSoup(page.content, "html.parser")
    results = soup.find(id="questions")

    if results:
        titles = results.find_all(class_ = "s-link")
        items = []
        num_items = len(titles)

        for i in range(num_items):
            item = {
                "title" : titles[i].string,
            }
            
            items.append(item)
        
        # Prepare the final data structure
        data = {
            "items": items
        }
        
        with open("data.json", "w") as file:
            json.dump(data, file, indent=4)

get_questions()
