from bs4 import BeautifulSoup
import requests

with open("index.html", "r") as f:
    doc = BeautifulSoup(f, "html.parser")

# Finds first tag in the document
    
tag = doc.title
# print(tag.string)
# Changes the string
# tag.string = "Hello"
# print(tag.string)

# Search for tag not first in Document
# tags = doc.find_all("p")
# print(tags)

# print(doc)
# print(tag.string)

# Access nested tags in p tags
# tags = doc.find_all("p")[0]
# print(tags.find_all("b"))

url = "https://www.newegg.ca/gigabyte-geforce-rtx-4070-ti-super-gv-n407tsaero-oc-16gd/p/N82E16814932675"
# url = "https://stackoverflow.com/"

result = requests.get(url)
doc = BeautifulSoup(result.text, "html.parser")
# print(doc.prettify())

prices = doc.find_all(text="$")
parent = prices[0].parent
# print(parent)

strong = parent.find("strong")
# print(strong)
print(strong.string)