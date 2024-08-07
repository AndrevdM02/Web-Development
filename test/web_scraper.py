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


async def create_json(list, has_more, json_name):
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
    content_license = list[12]
    community_wiki_date = list[13]
    protected_date = list[14]
    locked_date = list[15]
    closed_date = list[16]
    closed_reason = list[17]
    bounty_date = list[18]
    bounty_amount = list[19]
    owner_info = list[20]

    items = []
    for i in range(0, num_items):
        owner = owner_info[i]
        if owner:
            user_info = {
                "account_id": owner[0],
                "reputation": owner[1],
                "user_id": owner[2],
                "user_type": owner[3],
                "profile_image": owner[4],
                "display_name": owner[5],
                "link": owner[6]
            }
        else:
            user_info = {
                "user_type": "does_not_exist",
                "display_name": "anon"
            }
        item = {
            "tags": tags[i],
            "owner": user_info
        }
        item["is_answered"] = is_answered[i]
        item["view_count"] = int(view_count[i])
        if bounty_amount[i] is not None:
            item["bounty_amount"] = int(bounty_amount[i])
        if bounty_date[i] is not None:
            item["bounty_closes_date"] = bounty_date[i]
        if closed_date[i] is not None:
            item["closed_date"] = closed_date[i]
        if protected_date[i] is not None:
            item["protected_date"] = protected_date[i]
        if accepted_answer_id[i] is not None:
            item["accepted_answer_id"] = int(accepted_answer_id[i])
        item["answer_count"] = int(answer_count[i])
        if community_wiki_date[i] is not None:
            item["community_owned_date"] = community_wiki_date[i]
        item["score"] = int(score[i])
        if locked_date[i] is not None:
            item["locked_date"] = locked_date[i]
        item["last_activity_date"] = activity_date[i]
        item["creation_date"] = int(creation_date[i])
        if edited_date[i] != creation_date[i]:
            item["last_edit_date"] = edited_date[i]
        item["question_id"] = int(question_id[i])
        if content_license[i] is not None:
            item["content_license"] = content_license[i]
        item["link"] = question_link[i]
        if closed_reason[i] is not None:
            item["closed_reason"] = closed_reason[i]
        item["title"] = question_string[i]

        items.append(item)

    data = {
        "items": items,
        "has_more": has_more
    }

    async with aiofiles.open(json_name, "w") as file:
        await file.write(json.dumps(data, indent=4))

async def get_questions_info(document, session):
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
    content_license = []
    community_wiki_date = []
    protected_date = []
    locked_date = []
    closed_date = []
    closed_reason = []
    bounty_date = []
    bounty_amount = []
    owner = []
    has_more = False

    questions = document.find_all(class_="js-post-summary")
    
    # If the document contains an question/{id}
    if not questions:
        questions = [document]
        doc = document
    
    # Check if there are more pages
    else:
        if document.parent.find(class_="s-pagination site1 themed pager float-left"):
            has_more = True

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
        q_id = get_q_id(doc)
        question_id.append(q_id)
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

        # Check if the question is a community wiki
        is_wiki = get_is_wiki(doc)

        # Create a b4s object containing the timeline
        url = "https://stackoverflow.com/posts/" + q_id + "/timeline"
        page = await get_url(url, session)
        timeline_page = BeautifulSoup(page, "html.parser")

        # Get all the information available on the timeline
        cont_license, wiki_date, pro_date, lock_date, clsd_date, clsd_info = get_timeline_info(timeline_page, is_wiki)
        content_license.append(cont_license)
        community_wiki_date.append(wiki_date)
        protected_date.append(pro_date)
        locked_date.append(lock_date)
        closed_date.append(clsd_date)
        closed_reason.append(clsd_info)
        list.append(content_license)
        list.append(community_wiki_date)
        list.append(protected_date)
        list.append(locked_date)
        list.append(closed_date)
        list.append(closed_reason)

        # Get bounty information
        bnt_date, bnt_amount = get_bounty(doc)
        bounty_date.append(bnt_date)
        bounty_amount.append(bnt_amount)
        list.append(bounty_date)
        list.append(bounty_amount)

        # Get the owner information
        owner.append(await get_owner_info(timeline_page, session))
        list.append(owner)
    return list, has_more

def get_tags(document):
    tags = []
    doc = document.find(id="question").find_all(class_="d-inline mr4 js-post-tag-list-item")
    for tag in doc:
        tags.append(tag.get_text(strip=True))
    return tags

def get_title(document):
    title = document.find(id="question-header").find(class_="question-hyperlink")
    title_string = title.get_text(strip=True)
    if "[closed]" in title_string:
        title_string = title_string.replace("[closed]", "").strip()
    if "[duplicate]" in title_string:
        title_string = title_string.replace("[duplicate]", "").strip()
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
    score = document.find(class_="js-vote-count flex--item d-flex fd-column ai-center fc-theme-body-font fw-bold fs-subheading py4")
    if not score:
        score = document.find(class_="js-vote-count fs-title lh-md mb8 ta-center")
    score = score.get_text(strip=True)
    
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

def get_is_wiki(document):
    is_wiki = False
    wiki = document.find(id="question").find(class_="community-wiki")
    if wiki:
        is_wiki = True

    return is_wiki

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

def get_timeline_info(document, is_wiki):
    # Get the content license
    content_license = None
    lice = document.find(class_="subheader mb16 d-flex fd-column h-auto").find('h3').find('a')
    if lice:
        content_license = lice.get_text(strip=True)
    
    community_wiki_date = None
    protected_date = None
    locked_date = None
    closed_date = None
    closed_reason = None

    is_protected = False
    is_locked = False
    is_closed = False
    # Get all the events
    all_events = document.find(class_="event-rows fs-body").find_all('tr')
    for i in range(0, len(all_events)):
        # Get the community wiki date
        if is_wiki:
            wiki_event = all_events[i].find(string="Post Made Community Wiki")
            if wiki_event:
                community_wiki_date = datetime_to_unix(all_events[i].find(class_='relativetime').get('title'))
                    
        # Get protected date if the question is protected
        if not is_protected:
            content_blocks = all_events[i].find(class_="wmn1")
            protected_event = content_blocks.find(string=lambda text: "protected" in text.lower())
            if protected_event:
                if protected_event.strip() == "protected":
                    is_protected = True
                    protected_date = datetime_to_unix(all_events[i].find(class_='relativetime').get('title'))

                elif protected_event.strip() == "unprotected":
                    is_protected = True

        # Get locked date if the question is locked
        if not is_locked:
            content_blocks = all_events[i].find(class_="wmn1")
            locked_event = content_blocks.find(string=lambda text: "locked" in text.lower())
            if locked_event:
                if locked_event.strip() == "locked":
                    is_locked = True
                    locked_date = datetime_to_unix(all_events[i].find(class_='relativetime').get('title'))

                elif locked_event.strip() == "unlocked":
                    is_locked = True

        # Get closed date if the question is closed
        if not is_closed:
            content_blocks = all_events[i].find(class_="wmn1")
            closed_event = content_blocks.find(string=lambda text: "closed" in text.lower())
            
            if closed_event:
                if closed_event.strip() == "closed":
                    is_closed = True
                    closed_date = datetime_to_unix(all_events[i].find(class_='relativetime').get('title'))
                    closed_reason = all_events[i].find(class_="event-comment").find('span').get_text(strip=True)
                    if "Duplicate" in closed_reason:
                        closed_reason = "Duplicate"

            opened_event = content_blocks.find(string=lambda text: "reopened" in text.lower())
            if opened_event:
                if opened_event.strip() == "reopened":
                    is_closed = True


    return content_license, community_wiki_date, protected_date, locked_date, closed_date, closed_reason

def datetime_to_unix(date):
    unix = datetime.strptime(date, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
    unix_date = int(unix.timestamp())
    return unix_date

def get_bounty(document):
    bounty_date = None
    bounty_amount = None
    has_bounty = document.find(class_="svg-icon iconClock")
    if has_bounty:
        banners = document.find_all(class_ = "flex--item fl1 lh-lg")
        for banner in banners:
            if banner.find('b'):
                if banner.find('b').find('a') and banner.find('b').find('span'):
                    if banner.find('b').find('a').get_text(strip=True) == "bounty":
                        bounty_date = datetime_to_unix(banner.find('b').find('span').get('title'))

                        bounty_amount = banner.find(class_ = "s-badge s-badge__bounty d-inline px4 py2 ba bc-transparent bar-sm fs-caption va-middle")
                        bounty_amount = bounty_amount.string.replace("+", "").strip()
    
    return bounty_date, bounty_amount

async def get_owner_info(document, session):
    owner = []

    owner_info = document.find(class_='owner')
    if owner_info:
        owner_name = owner_info.get_text(strip=True)
        href = owner_info.get('href')
        owner_link = "https://stackoverflow.com/" + href

        page = await get_url(owner_link, session)
        doc = BeautifulSoup(page, "html.parser")

        # Get the accountId and userId
        # Find the cript tag containing the userId and accountId
        script_tag = doc.find('script', text=lambda t: t and 'StackExchange.user.init' in t)
        script_text = script_tag.string

        # Search for userId and accountId
        user_id_start = script_text.find('userId:') + len('userId:')
        account_id_start = script_text.find('accountId:') + len('accountId:')
        
        user_id = script_text[user_id_start:script_text.find(',', user_id_start)].strip()
        account_id = script_text[account_id_start:script_text.find('}', account_id_start)].strip()

        # Find the reputation of the user
        rep = doc.find(id="stats")
        rep = rep.find(class_ = "fs-body3 fc-black-600")
        reputation = int(rep.string.replace(",", "").strip())

        owner.append(int(account_id))
        owner.append(reputation)
        owner.append(int(user_id))

        # Find user_type
        if doc.find(class_ = "flex--item s-badge s-badge__moderator"):
            owner.append("moderator")
        else:
            owner.append("registered")

        # Get profile image
        image_link = doc.find(class_="bar-sm bar-md d-block").get('src')
        owner.append(image_link)

        owner.append(owner_name)
        owner.append(owner_link)
    
    return owner

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
            list, has_more = await get_questions_info(results, session)
            await create_json(list, has_more, "question.json")
        
async def get_question_ids(q_id):
    url = "https://stackoverflow.com/questions/" + q_id

    async with aiohttp.ClientSession() as session:
        page = await get_url(url, session)
        soup = BeautifulSoup(page, "html.parser")
    
    # Get the info
        list, has_more = await get_questions_info(soup, session)
        await create_json(list, has_more, "question_ids.json")

        
asyncio.run(get_questions())
asyncio.run(get_question_ids("11227809"))
asyncio.run(get_question_ids("37601644"))