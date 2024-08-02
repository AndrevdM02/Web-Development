from bs4 import BeautifulSoup
import requests

URL = "https://realpython.github.io/fake-jobs/"
page = requests.get(URL)

# print(page.text)

soup = BeautifulSoup(page.content, "html.parser")

results = soup.find(id="ResultsContainer")
# print(results.prettify())

job_elements = results.find_all("div", class_="card-content")
# for job_element in job_elements:
#     print(job_element, end="\n"*2)

# for job_element in job_elements:
#     title_element = job_element.find("h2", class_="title")
#     company_element = job_element.find("h3", class_="company")
#     location_element = job_element.find("p", class_="location")
#     print(title_element)
#     print(company_element)
#     print(location_element)
#     print()

# for job_element in job_elements:
#     title_element = job_element.find("h2", class_="title")
#     company_element = job_element.find("h3", class_="company")
#     location_element = job_element.find("p", class_="location")
#     print(title_element.text.strip())
#     print(company_element.text.strip())
#     print(location_element.text.strip())
#     print()

# python_jobs = results.find_all("h2", string="Python")
# print(python_jobs)

# python_jobs = results.find_all("h2", string=lambda text: "python" in text.lower())
# print(len(python_jobs))

# Wrong! Only includes the title elements
# python_jobs = results.find_all("h2", string=lambda text: "python" in text.lower())
# for job_element in python_jobs:
#     title_element = job_element.find("h2", class_="title")
#     company_element = job_element.find("h3", class_="company")
#     location_element = job_element.find("p", class_="location")
#     print(title_element.text.strip())
#     print(company_element.text.strip())
#     print(location_element.text.strip())
#     print()

# Include the parent of the h2 tag that contains all of the HTML code.
# python_jobs = results.find_all("h2", string=lambda text: "python" in text.lower())
# python_job_elements = [h2_element.parent.parent.parent for h2_element in python_jobs]
# for job_element in python_job_elements:
#     title_element = job_element.find("h2", class_="title")
#     company_element = job_element.find("h3", class_="company")
#     location_element = job_element.find("p", class_="location")
#     print(title_element.text.strip())
#     print(company_element.text.strip())
#     print(location_element.text.strip())
#     print()

# Extract Attributes from HTML elements

# Only extracts the text Learn and Apply
# python_jobs = results.find_all("h2", string=lambda text: "python" in text.lower())
# python_job_elements = [h2_element.parent.parent.parent for h2_element in python_jobs]
# for job_element in python_job_elements:
#     links = job_element.find_all("a")
#     for link in links:
#         print(link.text.strip())

# Extract the links
python_jobs = results.find_all("h2", string=lambda text: "python" in text.lower())
python_job_elements = [h2_element.parent.parent.parent for h2_element in python_jobs]
for job_element in python_job_elements:
    links = job_element.find_all("a")
    count = 0
    for link in links:
        link_url = link["href"]
        if count%2 == 0:
            print(f"Learn here: {link_url}\n")
            count += 1
        else:
            print(f"Apply here: {link_url}\n")
            count += 1