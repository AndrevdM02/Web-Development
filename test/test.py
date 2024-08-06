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

async def create_json(tags, titles, questions_ids, list, num_items, json_name):
    
    has_accepted_answer = list[0]
    score = list[1]
    answer_count = list[2]
    view_count = list[3]
    accepted_answer_id = list[4]
    is_answered = list[5]
    question_url = list[6]
    content_license = list[7]
    creation_date = list[8]
    activity_date = list[9]
    edited_date = list[10]
    protection_date = list[11]
    community_date = list[12]
    closed_date = list[13]
    closed_reason = list[14]
    bounty_date = list[15]
    bounty_amount = list[16]
    locked_date = list[17]
    owner_info = list[18]

    items = []
    for i in range(0, num_items):
        user = owner_info[i]
        if user:
            user_info = {
                "account_id": user[0],
                "reputation": user[1],
                "user_id": user[2],
                "user_type": user[3],
                "profile_image": user[4],
                "display_name": user[5],
                "link": user[6]
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
        if protection_date[i] is not None:
            item["protected_date"] = protection_date[i]
        if has_accepted_answer[i]:
            item["accepted_answer_id"] = int(accepted_answer_id[i])
        item["answer_count"] = int(answer_count[i])
        if community_date[i] is not None:
            item["community_owned_date"] = community_date[i]
        item["score"] = int(score[i])
        if locked_date[i] is not None:
            item["locked_date"] = locked_date[i]
        item["last_activity_date"] = activity_date[i]
        item["creation_date"] = creation_date[i]
        if edited_date[i] != creation_date[i]:
            item["last_edit_date"] = edited_date[i]
        item["question_id"] = int(questions_ids[i])
        item["content_license"] = content_license[i]
        item["link"] = question_url[i]
        if closed_reason[i] is not None:
            item["closed_reason"] = closed_reason[i]
        item["title"] = titles[i]
        items.append(item)

    data = {
        "items": items
    }

    async with aiofiles.open(json_name, "w") as file:
        await file.write(json.dumps(data, indent=4))

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
            tags = get_tags(results)
            titles, num_items, questions_ids = get_titles(results)
            list = await get_info(results, session, questions_ids)
            await create_json(tags, titles, questions_ids, list, num_items, "data.json")

def get_titles(results):
    question_titles = []
    questions_ids = []
    titles = results.find_all(class_="s-link")
    num_items = len(titles)

    for i in range(num_items):
        if titles[i].string is not None:
            if "[closed]" in titles[i].string:
                cleaned_title = titles[i].string.replace("[closed]", "").strip()
                question_titles.append(cleaned_title)
            else:
                question_titles.append(titles[i].string)
    num_items = len(question_titles)

    ids = results.find_all(class_="s-post-summary js-post-summary")
    for id in ids:
        questions_ids.append(id.get('data-post-id'))

    return question_titles, num_items, questions_ids

def get_tags(results):
    all_tags = []
    questions = results.find_all(class_="js-post-summary")

    for question in questions:
        so_tags = []
        tags = question.find_all(class_="d-inline mr4 js-post-tag-list-item")
        for tag in tags:
            so_tags.append(tag.get_text(strip=True))
        all_tags.append(so_tags)
    return all_tags

async def get_info(results, session, id):
    list = []
    has_accepted_answer = []
    view_count = []
    score = []
    answer_count = []
    accepted_answer_id = []
    has_answer = []
    questions_url = []
    content_license = []
    creation_date = []
    activity_date = []
    edited_date = []
    community_date = []
    protected_date = []
    closed_date = []
    closed_reason = []
    bounty_date = []
    bounty_amount = []
    locked_date = []
    owner_info = []

    questions = results.find_all(class_="js-post-summary")
    if not questions:
        questions = [results]
        doc = results

    count = 0
    for question in async_tqdm(questions, desc="Processing questions"):
        answered = question.find(class_="svg-icon iconCheckmarkSm")
        if answered:
            has_accepted_answer.append(True)
            has_been_answered = True
        else:
            has_accepted_answer.append(False)
            has_been_answered = False
        list.append(has_accepted_answer)

        individual_question = question.find(class_="s-post-summary--content-title")
        if individual_question:
            link = individual_question.find('a')
            href = link.get('href')
            url = "https://stackoverflow.com" + href

            page = await get_url(url, session)
            doc = BeautifulSoup(page, "html.parser")
        
        else:
            q_url = doc.find(id="question-header").find('a').get('href')
            url = "https://stackoverflow.com" + q_url

        questions_url.append(url)

        view_count.append(get_view_counts(doc))
        score.append(get_score(doc))

        num_answers, answer_id, is_answered = get_answers_info(doc, has_been_answered)
        answer_count.append(num_answers)
        accepted_answer_id.append(answer_id)
        has_answer.append(is_answered)

        list.append(score)
        list.append(answer_count)
        list.append(view_count)
        list.append(accepted_answer_id)
        list.append(has_answer)

        content_license.append(get_content_license(doc))
        list.append(questions_url)
        list.append(content_license)

        c_date, a_date, e_date = get_dates(doc)
        creation_date.append(c_date)
        activity_date.append(a_date)
        edited_date.append(e_date)

        list.append(creation_date)
        list.append(activity_date)
        list.append(edited_date)

        pro_date, com_date, cls_date, cls_reason, bnt_date, bnt_amount, lckd_date, own_info = await get_pages_date(doc, session, id[count])
        protected_date.append(pro_date)
        community_date.append(com_date)
        closed_date.append(cls_date)
        closed_reason.append(cls_reason)
        bounty_date.append(bnt_date)
        bounty_amount.append(bnt_amount)
        locked_date.append(lckd_date)
        owner_info.append(own_info)

        list.append(protected_date)
        list.append(community_date)
        list.append(closed_date)
        list.append(closed_reason)
        list.append(bounty_date)
        list.append(bounty_amount)
        list.append(locked_date)
        list.append(owner_info)

        count += 1

    return list

def get_view_counts(doc):
    view = doc.find(class_="flex--item ws-nowrap mb8")
    if view is None:
        view = doc.find(class_="flex--item ws-nowrap mb8 mr16")
    title_text = view.get('title')
    total_views = re.findall(r'\d', title_text)
    view_count = ''.join(total_views)
    return view_count

def get_score(doc):
    score = doc.find(class_="js-vote-count flex--item d-flex fd-column ai-center fc-theme-body-font fw-bold fs-subheading py4")
    if not score:
        score = doc.find(class_="js-vote-count fs-title lh-md mb8 ta-center")
    return score.get_text(strip=True)

def get_answers_info(doc, is_answered):
    answer_header = doc.find(id="answers")
    answers = answer_header.find(class_="mb0")
    answer_count = answers.find('span')
    if is_answered:
        answer_id = doc.find(class_="js-accepted-answer")
        id = answer_id.get('data-answerid')
        return answer_count.get_text(strip=True), id, True
    else:
        id = None

    answer_score_string = answer_header.find(class_="js-vote-count flex--item d-flex fd-column ai-center fc-theme-body-font fw-bold fs-subheading py4")
    if answer_score_string:
        answer_score = int(answer_score_string.get_text(strip=True))

        if answer_score > 0:
            return answer_count.get_text(strip=True), id, True

    return answer_count.get_text(strip=True), id, False

def get_content_license(doc):
    lice = doc.find(class_="js-share-link")
    cl = lice.get('data-se-share-sheet-license-name')
    return cl

def get_dates(doc):
    creation_date = doc.find('time')
    c_d = creation_date.get('datetime')
    date_of_creation = datetime.strptime(c_d, "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc)
    c_date = int(date_of_creation.timestamp())

    activity_date = doc.find(class_="s-link s-link__inherit")
    a_d = activity_date.get('title')
    last_activity = datetime.strptime(a_d, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
    a_date = int(last_activity.timestamp())

    edit_date = doc.find(class_="user-action-time fl-grow1")
    edit_date = edit_date.find('span')

    if edit_date:
        e_d = edit_date.get('title')
        last_edit = datetime.strptime(e_d, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
        e_date = int(last_edit.timestamp())
    else:
        e_date = c_date

    return c_date, a_date, e_date

async def get_pages_date(doc, session, id):
    question = doc.find(id="question")

    protected_date = None
    closed_date = None
    closed_reason = None
    locked_date = None
    bounty_date = None
    bounty_amount = None

    # Checks if the question is closed and if there is a bounty
    is_not_closed = True
    is_not_locked = True
    is_closed = doc.find_all(class_ = "flex--item fl1 lh-lg")
    for closed in is_closed:
        if closed.find('b'):
            if closed.find('b').string == "Closed" or closed.find('b').string == "Closed.":
                is_not_closed = False
                
                # Find the closed date
                cls = closed
                closed_d = cls.find(class_ = "relativetime")
                while not closed_d:
                    cls = cls.parent
                    closed_d = cls.find(class_ = "relativetime")
                
                the_closed_date = closed_d.get('title')
                date_closed = datetime.strptime(the_closed_date, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
                closed_date = int(date_closed.timestamp())
        
            # Check if there's a bounty
            if closed.find('b').find('a'):
                if closed.find('b').find('a').string == "bounty":
                    b_d = closed.find('b').find('span').get('title')
                    date_bounty = datetime.strptime(b_d, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
                    bounty_date = int(date_bounty.timestamp())

                    # Get the bounty amount
                    bounty_amount = closed.find(class_ = "s-badge s-badge__bounty d-inline px4 py2 ba bc-transparent bar-sm fs-caption va-middle")
                    bounty_amount = bounty_amount.string.replace("+", "").strip()
    
    # Check if the question is locked
    if doc.find(class_ = "svg-icon iconLock"):
        is_not_locked = False

    # Checks if the question belongs to a community
    is_community = question.find(class_ = "community-wiki")
    if is_community:
        is_not_com = False
    else:
        is_not_com = True
        community_date = None

    edited_link = question.find(class_ = "user-action-time fl-grow1").find('a')
    if edited_link:
        revisions_link = edited_link.get('href')
        
        url = "https://stackoverflow.com" + revisions_link
        page = await get_url(url, session)
        document = BeautifulSoup(page, "html.parser")

    else:
        
        url = "https://stackoverflow.com/posts/" + id + "/revisions"
        page = await get_url(url, session)
        document = BeautifulSoup(page, "html.parser")

    # Get the maximum number of pages.
    num_pages = document.find_all(class_="js-pagination-item")
    if len(num_pages) > 1: 
        n_pages = num_pages[len(num_pages)-2].string
    else:
        n_pages = 1

    # Get the original owner in the edited list
    owner_info = await get_owner(document, n_pages, url, session)

    is_protected = False
    for i in range(1, int(n_pages)+1):
        if i != 1:
            url = "https://stackoverflow.com" + revisions_link + "?page=%d" % i
            page = await get_url(url, session)
            document = BeautifulSoup(page, "html.parser")
        
        search = document.find_all('b')
        
        index = 0
        for words in search:
            # Get the protection_date if there is one.
            if words.string == "Question Protected" and not is_protected:
                is_protected = True
                protected_d = search[index].parent.find('time').find('span').get('title')
                date_protected = datetime.strptime(protected_d, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
                protected_date = int(date_protected.timestamp())

            elif words.string == "Question Unprotected" and not is_protected:
                is_protected = True

            # Get the community date
            if words.string == "Post Made Community Wiki" and not is_not_com:
                is_not_com = True
                community_d = search[index].parent
                com_time = community_d.find('time')
                while not com_time:
                    community_d = community_d.parent
                    com_time = community_d.find('time')
                
                com_date = com_time.find('span').get('title')
                date_community = datetime.strptime(com_date, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
                community_date = int(date_community.timestamp())

            # Get the closed reason
            if words.string == "Post Closed" and not is_not_closed:
                cls_reason = words.next_sibling.strip()
                closed_reason = cls_reason.split('"')[1]

                is_not_closed = True

            # Get the locked date
            if words.string == "Post Locked" and not is_not_locked:
                is_not_locked = True
                locked_d = search[index].parent
                lock_time = locked_d.find('time')
                while not lock_time:
                    locked_d = locked_d.parent
                    lock_time = locked_d.find('time')
                ld_date = lock_time.find('span').get('title')
                date_locked = datetime.strptime(ld_date, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
                locked_date = int(date_locked.timestamp())

            index += 1
        
        if is_protected and is_not_com and is_not_closed and is_not_locked:
            break

    return protected_date, community_date, closed_date, closed_reason, bounty_date, bounty_amount, locked_date, owner_info
        

async def get_owner(document, n_pages, url, session):
    owner = []
    owner_name = None

    url = url + "?page=%s" % n_pages
    page = await get_url(url, session)
    doc = BeautifulSoup(page, "html.parser")

    # Get the user card
    if doc.find(class_="d-flex p4 ai-center gs4 bg-blue-100"):
        user_card = doc.find(class_="d-flex p4 ai-center gs4 bg-blue-100").find(class_ = "s-user-card--info").find('a')
        owner_name = user_card.get_text(strip=True)
        owner_link = user_card.get('href')
        owner_link = "https://stackoverflow.com" + owner_link

        own = await get_account_info(owner_link, session)
        
        for i in range(len(own)):
            owner.append(own[i])
        owner.append(owner_name)
        owner.append(owner_link)

    return owner

async def get_account_info(url, session):
    account_info = []

    page = await get_url(url, session)
    document = BeautifulSoup(page, "html.parser")

    # Get the accountId and userId
    # Find the cript tag containing the userId and accountId
    script_tag = document.find('script', text=lambda t: t and 'StackExchange.user.init' in t)
    script_text = script_tag.string

    # Search for userId and accountId
    user_id_start = script_text.find('userId:') + len('userId:')
    account_id_start = script_text.find('accountId:') + len('accountId:')

    user_id = script_text[user_id_start:script_text.find(',', user_id_start)].strip()
    account_id = script_text[account_id_start:script_text.find('}', account_id_start)].strip()

    # Find the reputation of the user
    rep = document.find(id="stats")
    rep = rep.find(class_ = "fs-body3 fc-black-600")
    reputation = int(rep.string.replace(",", "").strip())

    account_info.append(int(account_id))
    account_info.append(reputation)
    account_info.append(int(user_id))

    # Find user_type
    if document.find(class_ = "flex--item s-badge s-badge__moderator"):
        account_info.append("moderator")
    else:
        account_info.append("registered")

    # Get profile image
    image_link = document.find(class_="bar-sm bar-md d-block").get('src')
    account_info.append(image_link)

    return account_info

async def get_question_id(q_id):
    url = "https://stackoverflow.com/questions/" + q_id

    async with aiohttp.ClientSession() as session:
        page = await get_url(url, session)
        soup = BeautifulSoup(page, "html.parser")
        # results = soup.find(class_="question js-question")
    
    list = await get_info(soup, session, q_id)
    quesstion_id = [q_id]
    await create_json(["A"],["B"],quesstion_id,list,1,"question_ids.json")

# asyncio.run(get_questions())

# asyncio.run(get_question_id("37601644"))
asyncio.run(get_question_id("78840214"))