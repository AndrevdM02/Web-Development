import aiohttp
import asyncio
import aiofiles
import backoff
import re
from datetime import datetime, timezone
from tqdm.asyncio import tqdm as async_tqdm
from bs4 import BeautifulSoup
import json

async def fatal_code(e):
    return 400 <= e.status < 500

@backoff.on_exception(backoff.expo, (aiohttp.ClientError, aiohttp.ClientResponseError), max_time=300, giveup=fatal_code)
async def get_url(url, session):
    async with aiohttp.ClientSession(raise_for_status=True) as session:
        async with session.get(url) as response:
            if response.status == 429:
                retry_after = int(response.headers.get("Retry-After", 10))
                await asyncio.sleep(retry_after)
                raise aiohttp.ClientResponseError(
                    request_info=response.request_info,
                    history=response.history,
                    code=response.status,
                    message=response.reason,
                    headers=response.headers
                )
            if response.status >= 400:
                response.raise_for_status()
            return await response.text()


async def create_json(list, json_name):
    num_items = len(list[0])
    tags = list[0]
    question_string = list[1]
    question_link = list[2]
    question_id = list[3]
    score = list[4]
    answer_count = list[5]
    view_count = list[6]
    accepted_answer_id = list[7]
    is_answered = list[8]
    creation_date = list[9]
    activity_date = list[10]
    edited_date = list[11]

    items = []
    for i in range(0, num_items):
        item = {
            "tags": tags[i]
        }
        item["is_answered"] = is_answered[i]
        item["view_count"] = int(view_count[i])
        if accepted_answer_id[i] is not None:
            item["accepted_answer_id"] = int(accepted_answer_id[i])
        item["answer_count"] = int(answer_count[i])
        item["score"] = int(score[i])
        item["last_activity_date"] = activity_date[i]
        item["creation_date"] = int(creation_date[i])
        if edited_date[i] != creation_date[i]:
            item["last_edit_date"] = edited_date[i]
        item["question_id"] = int(question_id[i])
        item["link"] = question_link[i]
        item["title"] = question_string[i]

        items.append(item)

    data = {
        "items": items
    }

    async with aiofiles.open(json_name, "w") as file:
        await file.write(json.dumps(data, indent=4))

async def get_questions_info(document, session, id):
    list = []
    tags = []
    question_string = []
    question_link = []
    question_id = []
    score = []
    num_answers = []
    num_views = []
    accepted_answer_id = []
    is_answered = []
    creation_date = []
    activity_date = []
    edited_date = []

    questions = document.find_all(class_="js-post-summary")
    
    # If the document contains an question/{id}
    if not questions:
        questions = [document]
        doc = document

    for question in async_tqdm(questions, desc="Processing questions"):
        individual_question = question.find(class_="s-post-summary--content-title")
        if individual_question:
            link = individual_question.find('a')
            href = link.get('href')
            url = "https://stackoverflow.com" + href

            page = await get_url(url, session)
            doc = BeautifulSoup(page, "html.parser")

        # Get the tags of the question
        tags.append(get_tags(doc))
        list.append(tags)

        # Get the title and link of the question
        title_string, title_link = get_title(doc)
        question_string.append(title_string)
        question_link.append(title_link)
        list.append(question_string)
        list.append(question_link)

        # Get the question id
        question_id.append(get_q_id(doc))
        list.append(question_id)

        # Get the score, number of answers and number of views
        scr, n_answers, n_views, answer_id, is_ans = get_stats(doc)
        score.append(scr)
        num_answers.append(n_answers)
        num_views.append(n_views)
        accepted_answer_id.append(answer_id)
        is_answered.append(is_ans)
        list.append(score)
        list.append(num_answers)
        list.append(num_views)
        list.append(accepted_answer_id)
        list.append(is_answered)

        # Get the creation, last edited and last activity date
        c_date, a_date, e_date = get_dates(doc)
        creation_date.append(c_date)
        activity_date.append(a_date)
        edited_date.append(e_date)
        list.append(creation_date)
        list.append(activity_date)
        list.append(edited_date)

    return list

def get_tags(document):
    tags = []
    doc = document.find(id="question").find_all(class_="d-inline mr4 js-post-tag-list-item")
    for tag in doc:
        tags.append(tag.get_text(strip=True))
    return tags

def get_title(document):
    title = document.find(id="question-header").find(class_="question-hyperlink")
    title_string = title.get_text(strip=True)
    href = title.get('href')
    title_link = "https://stackoverflow.com" + href
    return title_string, title_link

def get_q_id(document):
    # Find the script tag containing the questionId
    script_tag = document.find('script', text=lambda t: t and 'StackExchange.question.init' in t)
    script_text = script_tag.string
    
    # Search for questionId
    question_id_start = script_text.find('questionId:') + len('questionId:')
    question_id = script_text[question_id_start:script_text.find('}', question_id_start)].strip()
    return question_id
    

def get_stats(document):
    # Get the score of the question
    score = document.find(class_="js-vote-count flex--item d-flex fd-column ai-center fc-theme-body-font fw-bold fs-subheading py4").get_text(strip=True)
    if not score:
        score = document.find(class_="js-vote-count fs-title lh-md mb8 ta-center").get_text(strip=True)
    
    # Get the number of answers
    num_answers = 0
    is_answered = False
    accepted_answer_id = None
    has_answers = document.find(id="answers")
    if has_answers:
        answers = has_answers.find(class_="mb0")
        num_answers = answers.get('data-answercount')

        accepted_answer = document.find(class_="answer js-answer accepted-answer js-accepted-answer")
        if accepted_answer:
            accepted_answer_id = accepted_answer.get('data-answerid')
            is_answered = True
        
        else:
            answer_score = has_answers.find(class_="js-vote-count flex--item d-flex fd-column ai-center fc-theme-body-font fw-bold fs-subheading py4")
            if answer_score:
                answer_score_int = int(answer_score.get_text(strip=True))
                if answer_score_int > 0:
                    is_answered = True
    # Get the numberof views
    num_views = 0
    view = document.find(class_="flex--item ws-nowrap mb8")
    if view is None:
        view = document.find(class_="flex--item ws-nowrap mb8 mr16")
    views_string = view.get('title')
    total_views = re.findall(r'\d', views_string)
    num_views = ''.join(total_views)
    
    return score, num_answers, num_views, accepted_answer_id, is_answered

def get_dates(document):
    c_date = document.find('time').get('datetime')
    date_of_creation = datetime.strptime(c_date, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
    creation_date = int(date_of_creation.timestamp())

    a_date = document.find(class_="s-link s-link__inherit").get('title')
    last_activity = datetime.strptime(a_date, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
    activity_date = int(last_activity.timestamp())

    e_date = document.find(class_="user-action-time fl-grow1").find('span')
    if e_date:
        e_d = e_date.get('title')
        last_edit = datetime.strptime(e_d, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
        edit_date = int(last_edit.timestamp())
    else:
        edit_date = creation_date
    
    return creation_date, activity_date, edit_date

async def get_questions():
    # url = "https://stackoverflow.com/questions"
    url = "https://stackoverflow.com/questions?sort=MostVotes&edited=true&pagesize=15"
    # url = "https://stackoverflow.com/questions?sort=RecentActivity&edited=true"
    # url = "https://stackoverflow.com/questions?tab=votes&page=2&pagesize=50"

    # url = "https://stackoverflow.com/questions/tagged/python%20enums?sort=MostVotes&edited=true"

    # url = "https://stackoverflow.com/questions?sort=MostVotes&filters=Bounty&edited=true"

    # url = "https://stackoverflow.com/?tab=week"
    # url = "https://stackoverflow.com/questions/78829195/eof-error-in-using-a-sample-function-of-random-module"

    async with aiohttp.ClientSession() as session:
        page = await get_url(url, session)
        soup = BeautifulSoup(page, "html.parser")
        results = soup.find(id="questions")

        if not results:
            results = soup.find(id="question-mini-list")

        if results:
            list = await get_questions_info(results, session, None)
            await create_json(list, "question.json")
        
async def get_question_ids(q_id):
    url = "https://stackoverflow.com/questions/" + q_id

    async with aiohttp.ClientSession() as session:
        page = await get_url(url, session)
        soup = BeautifulSoup(page, "html.parser")
    
    # Get the info
        list = await get_questions_info(soup, session, q_id)
        await create_json(list, "question_ids.json")

        
asyncio.run(get_questions())
asyncio.run(get_question_ids("11227809"))
# asyncio.run(get_question_ids("78840901"))