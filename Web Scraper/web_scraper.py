import aiohttp
import asyncio
import aiofiles
import backoff
import re
from datetime import datetime, timezone
from tqdm.asyncio import tqdm as async_tqdm
from bs4 import BeautifulSoup
import json
from urllib.parse import urlparse
import time

# Create a semaphore to limit the number of concurrent requests
semaphore = asyncio.Semaphore(50)  # Number of concurrent requests
RATE_LIMIT_PERIOD = 60  # Rate limit period in seconds
last_request_time = time.time()

async def fatal_code(e):
    return 400 <= e.status < 500 and e.status != 429

@backoff.on_exception(backoff.expo, (aiohttp.ClientError, aiohttp.ClientResponseError), max_time=500, giveup=fatal_code)
async def get_url(url, session):
    async with semaphore:  # Limit concurrent requests
        global last_request_time
        now = time.time()
        elapsed = now - last_request_time
        
        # Sleep to maintain rate limit
        if elapsed < RATE_LIMIT_PERIOD / semaphore._value:
            await asyncio.sleep(RATE_LIMIT_PERIOD / semaphore._value - elapsed)
        
        last_request_time = time.time()

        async with session.get(url) as response:
            if response.status == 429:
                retry_after = int(response.headers.get("Retry-After", 60))
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


async def create_json(list, filter_):
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
    owner = list[20]
    migrated_date = list[21]
    migrated_question_id = list[22]
    migrated_url = list[23]
    

    if len(owner) > 1:
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
            "display_name": owner[0]
        }
    if migrated_url:
        other_site = {
            "site_url": migrated_url
        }
        
        migrated_from = {
            "other_site": other_site,
            "on_date": migrated_date,
            "question_id": migrated_question_id
        }
    item = {
        "tags": tags
    }
    if migrated_url:
        item["migrated_from"] = migrated_from
    item["owner"] = user_info
    item["is_answered"] = is_answered
    item["view_count"] = int(view_count)
    if bounty_amount is not None:
        item["bounty_amount"] = int(bounty_amount)
    if bounty_date is not None:
        item["bounty_closes_date"] = bounty_date
    if protected_date is not None:
        item["protected_date"] = protected_date
    if closed_date is not None:
        item["closed_date"] = closed_date
    if accepted_answer_id is not None:
        item["accepted_answer_id"] = int(accepted_answer_id)
    item["answer_count"] = int(answer_count)
    if community_wiki_date is not None:
        item["community_owned_date"] = community_wiki_date
    item["score"] = int(score)
    if locked_date is not None:
        item["locked_date"] = locked_date
    item["last_activity_date"] = activity_date
    item["creation_date"] = int(creation_date)
    if edited_date != creation_date:
        item["last_edit_date"] = edited_date
    item["question_id"] = int(question_id)
    # if content_license is not None:
    #     item["content_license"] = content_license
    item["link"] = question_link
    if closed_reason is not None:
        item["closed_reason"] = closed_reason
    item["title"] = question_string
    if filter_ == "withbody":
        item["body"] = list[24]

    return item

async def get_questions_info(question, session, q_id, filter_):
    list = []
    
    individual_question = question.find(class_="s-post-summary--content-title")
    if individual_question:
        link = individual_question.find('a')
        href = link.get('href')
        url = "https://stackoverflow.com" + href

        page = await get_url(url, session)
        doc = BeautifulSoup(page, "html.parser")
    else:
        doc=question

    # Get the tags of the question
    tags = get_tags(doc)
    list.append(tags)

    # Get the title and link of the question
    question_string, question_link = get_title(doc)
    list.append(question_string)
    list.append(question_link)

    # Get the question id
    question_id = get_q_id(doc)
    list.append(question_id)
    if q_id:
        if question_id != q_id:
            return None

    # Get the score, number of answers and number of views
    score, num_answers, num_views, accepted_answer_id, is_answered = get_stats(doc)
    list.append(score)
    list.append(num_answers)
    list.append(num_views)
    list.append(accepted_answer_id)
    list.append(is_answered)

    # Get the creation, last edited and last activity date
    creation_date, activity_date, edited_date = get_dates(doc)
    list.append(creation_date)
    list.append(activity_date)
    list.append(edited_date)

    # Check if the question is a community wiki
    is_wiki = get_is_wiki(doc)
    
    if filter_ == "withbody":
        withbody = get_body(doc)

    # Create a b4s object containing the timeline
    url = "https://stackoverflow.com/posts/" + question_id + "/timeline"
    page = await get_url(url, session)
    timeline_page = BeautifulSoup(page, "html.parser")

    # Get all the information available on the timeline
    content_license, community_wiki_date, protected_date, locked_date, closed_date, closed_reason, migrated_date, migrated_question_id, migrated_url, migrated_revision_link = get_timeline_info(timeline_page, is_wiki)
    if is_wiki and not community_wiki_date:
        community_wiki_date = creation_date
        
    list.append(content_license)
    list.append(community_wiki_date)
    list.append(protected_date)
    list.append(locked_date)
    list.append(closed_date)
    list.append(closed_reason)

    # Get bounty information
    bounty_date, bounty_amount = get_bounty(doc)
    list.append(bounty_date)
    list.append(bounty_amount)

    # Get the owner information
    owner = await get_owner_info(timeline_page, session, migrated_revisions_link=migrated_revision_link)
    list.append(owner)
    
    list.append(migrated_date)
    list.append(migrated_question_id)
    list.append(migrated_url)
    
    if filter_ == "withbody":
        list.append(withbody)
    
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
    if "[closed]" in title_string:
        title_string = title_string.replace("[closed]", "").strip()
    if "[duplicate]" in title_string:
        title_string = title_string.replace("[duplicate]", "").strip()
    href = title.get('href')
    title_link = "https://stackoverflow.com" + href
    title_string = replace_strings(title_string)
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

def get_body(document):
    body = document.find(class_="s-prose js-post-body")
    
    # body = body.decode_contents()
    for div_tags in body.find_all('div'):
        div_tags.decompose()
        
    for emails in body.find_all(class_="__cf_email__"):
        r = int(emails.get('data-cfemail').strip()[:2], 16)
        email = ''.join([chr(int(emails.get('data-cfemail').strip()[i:i+2], 16) ^ r) for i in range(2, len(emails.get('data-cfemail').strip()), 2)])
        emails.replace_with(email)

    # Extract the HTML content with preserved formatting
    content = body.decode_contents().lstrip()
    
    # Convert to a BeautifulSoup object for formatting
    soup = BeautifulSoup(content, 'html.parser')
    
    # Convert to a string while preserving newlines and HTML tags
    formatted_content = ''.join(str(tag) for tag in soup)
    
    return formatted_content

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
    migrated_date = None
    migrated_url = None
    migrated_question_id = None
    migrated_revision_link = None

    is_protected = False
    is_locked = False
    is_closed = False
    has_higer_content_license = False
    is_migrated = False
    # Get all the events
    all_events = document.find(class_="event-rows fs-body").find_all('tr')
    for i in range(0, len(all_events)):
        # Get the community wiki date
        if is_wiki:
            wiki_event = all_events[i].find(string="Post Made Community Wiki")
            if wiki_event:
                community_wiki_date = datetime_to_unix(all_events[i].find(class_='relativetime').get('title'))
                is_wiki = False
                    
        if all_events[i].find(class_="mtn2") and all_events[i].find(class_="js-load-revision") and not has_higer_content_license:
            if all_events[i].find(class_="wmn1").get_text(strip=True) == "edited":
                content_license = "CC BY-SA 4.0"

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
                    content_license = None
                    has_higer_content_license = True
                    closed_date = datetime_to_unix(all_events[i].find(class_='relativetime').get('title'))
                    closed_reason = all_events[i].find(class_="event-comment").find('span').get_text(strip=True)
                    if "Duplicate" in closed_reason:
                        closed_reason = "Duplicate"

            opened_event = content_blocks.find(string=lambda text: "reopened" in text.lower())
            if opened_event:
                if opened_event.strip() == "reopened":
                    is_closed = True
                    
        if not is_migrated:
            content_blocks = all_events[i].find(class_="wmn1")
            migrated_event = content_blocks.find(string=lambda text: "migrated" in text.lower())
            
            if migrated_event:
                is_migrated = True
                migrated_date = datetime_to_unix(all_events[i].find(class_='relativetime').get('title'))
                migrated_url = all_events[i].find(class_="event-comment").find('a').get_text(strip=True)
                if migrated_url == "programmers.stackexchange.com":
                    migrated_url = "softwareengineering.stackexchange.com"
                migrated_url = "https://" + migrated_url
                migrated_revision_link = all_events[i].find(class_="event-comment").find('a').find_next_sibling().get('href')
                parts = migrated_revision_link.split('/')
                
                # Iterate through the parts to find the ID
                for part in parts:
                    if part.isdigit():  # Check if the part is composed of digits
                        migrated_question_id = int(part)
                
    return content_license, community_wiki_date, protected_date, locked_date, closed_date, closed_reason, migrated_date, migrated_question_id, migrated_url, migrated_revision_link

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

async def get_owner_info(document, session, migrated_revisions_link=None):
    owner = []

    owner_info = document.find(class_='owner')
    if owner_info or migrated_revisions_link:
        if owner_info:
            owner_name = owner_info.get_text(strip=True)
            href = owner_info.get('href')
            owner_link = "https://stackoverflow.com" + href

            page = await get_url(owner_link, session)
            doc = BeautifulSoup(page, "html.parser")
        else:
            owner_link = None
            page = await get_url(migrated_revisions_link, session)
            doc = BeautifulSoup(page, "html.parser")
            
            user_tag = doc.find(class_="d-flex p4 ai-center gs4 bg-blue-100")
            if user_tag:
                user_href = user_tag.find(class_="s-user-card--link lh-lg").get('href')
                
                parsed_url = urlparse(migrated_revisions_link)
                domain = parsed_url.netloc
                
                user_link = "https://" + domain + user_href
                async with aiohttp.ClientSession() as session:
                    page = await get_url(user_link, session)
                    doc = BeautifulSoup(page, "html.parser")
                
                has_communities = doc.find(class_="flex--item3 fl-shrink0 md:order-last").find(class_="s-card bar-md")
                if has_communities:
                    communities = has_communities.find_all(class_="pr4")
                    for community in communities:
                        if community.find(class_="truncate").get_text(strip=True) == "Stack Overflow":
                            owner_link = community.parent.get('href')
                            
                            page = await get_url(owner_link, session)
                            doc = BeautifulSoup(page, "html.parser")
                            owner_name = doc.find(class_="lh-xs").get_text(strip=True)
                            # Find the <link> tag with rel="canonical"
                            canonical_link = doc.find('link', rel='canonical')
                            owner_link = canonical_link.get('href')
                            
            if not owner_link:
                all_events = document.find(class_="event-rows fs-body").find_all('tr')
                for event in all_events:
                    if event.find(class_="wmn1").get_text(strip=True) == "asked" or event.find(class_="wmn1").get_text(strip=True) == "answered":
                        owner.append(event.find(class_="wmn1").find_next_sibling().get_text(strip=True))
                        
                return owner

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
        user_type = None
        if doc.find(class_ = "flex--item s-badge s-badge__moderator"):
            user_type = "moderator"
        elif doc.find(class_="flex--item s-badge s-badge__votes"):
            if doc.find(class_="flex--item s-badge s-badge__votes").get_text(strip=True).lower() == "unregistered":
                user_type = "unregistered"
        
        if not user_type:
            user_type = "registered"

        owner.append(user_type)

        # Get profile image
        image_link = doc.find(class_="bar-sm bar-md d-block").get('src')
        owner.append(image_link)

        owner.append(owner_name)
        owner.append(owner_link)
        
    else:
        all_events = document.find(class_="event-rows fs-body").find_all('tr')
        for event in all_events:
            if event.find(class_="wmn1").get_text(strip=True) == "asked" or event.find(class_="wmn1").get_text(strip=True) == "answered":
                owner.append(event.find(class_="wmn1").find_next_sibling().get_text(strip=True))

    return owner

def replace_strings(text):
    """Replace single quotes with HTML entity in a given text."""
    text = text.replace("'", "&#39;")
    text = text.replace("\"", "&quot;")
    return text

async def get_questions(list_of_params, filter_):
    if filter_ == "none":
        return {}
    
    sort_order = list_of_params[0]
    order = list_of_params[1]
    page_number = list_of_params[2]
    page_size = list_of_params[3]
    tags  = list_of_params[4]
    todate = list_of_params[5]
    fromdate = list_of_params[6]
    min_ = list_of_params[7]
    max_ = list_of_params[8]
    
    if tags:
        tags_list = tags.split(';')
        url = "https://stackoverflow.com/questions/tagged/" + "+".join(tags_list) + "?pagesize=30"
    else:
        url = "https://stackoverflow.com/questions?pagesize=30"
    
    if sort_order == "hot":
        url = "https://stackoverflow.com/?tab=hot"
    elif sort_order == "month":
        url = "https://stackoverflow.com/?tab=month"
    elif sort_order == "week":
        url = "https://stackoverflow.com/?tab=week"
    elif sort_order == "activity":
        url += "&tab=active"
    elif sort_order == "creation":
        url += "&tab=newest"
    else:
        url += "&tab=votes"

    items = []

    async with aiohttp.ClientSession() as session:
        page = await get_url(url, session)
        soup = BeautifulSoup(page, "html.parser")
        results = soup.find(id="questions")
        
        if filter_ == "total":
            num_questions = soup.find(class_="fs-body3 flex--item fl1 mr12 sm:mr0 sm:mb12")
            if num_questions:
                number_questions = num_questions.get_text(strip=True)
                number_questions = re.findall(r'\d', number_questions)
                number_questions = ''.join(number_questions)
                return int(number_questions)
            else:
                return 1000

        if not results:
            results = soup.find(id="question-mini-list")
        
        if not results:
            results = soup.find(class_="flush-left js-search-results")

        if results:
            number_of_pages = 1
            has_pages = soup.find_all(class_="s-pagination--item js-pagination-item")
            if has_pages:
                number_of_pages = int(has_pages[-2].get_text(strip=True))
            
            for i in range(1, number_of_pages + 1):
                questions = results.find_all(class_="js-post-summary")
                for question in async_tqdm(questions, desc="Processing questions"):
                    list = await get_questions_info(question, session, None, filter_)
                    item = await create_json(list, filter_)
                    items.append(item)
                
                if i + 1 <= number_of_pages and list:
                    paged_url = url + "&page=%d" % (i + 1)
                    # async with aiohttp.ClientSession() as session:
                    page = await get_url(paged_url, session)
                    results = BeautifulSoup(page, "html.parser")

            if sort_order not in ["hot", "week", "month"]:
                sorted_data = min_and_max(items, sort_order, min_, max_)
                sorted_data = sort_data(sorted_data, sort_order, order)
                sorted_data, has_more = pages(sorted_data, page_number, page_size)
            else:
                sorted_data, has_more = pages(items, page_number, page_size)

            data = {
                "items": sorted_data,
                "has_more": has_more
            }

            async with aiofiles.open("question.json", "w") as file:
                await file.write(json.dumps(data, indent=4, ensure_ascii=False))

            return data
        
async def get_question_ids(q_id, list_of_params, filter_):
    if filter_ == "none":
        return {}
    
    sort_order = list_of_params[0]
    order = list_of_params[1]
    page_number = list_of_params[2]
    page_size = list_of_params[3]
    fromdate = list_of_params[5]
    todate = list_of_params[6]
    min_ = list_of_params[7]
    max_ = list_of_params[8]
    
    items = []
    all_ids = q_id.split(";")
    if filter_ != "total":
        # for id in all_ids:
        question_id = []
        for id in async_tqdm(all_ids, desc="Processing questions"):
            if id not in question_id:
                url = "https://stackoverflow.com/questions/" + id

                async with aiohttp.ClientSession() as session:
                    page = await get_url(url, session)
                    soup = BeautifulSoup(page, "html.parser")
                
                    # Get the info
                    list = await get_questions_info(soup, session, id, filter_)
                    if list:
                        item = await create_json(list, filter_)
                        items.append(item)
                question_id.append(id)

        sorted_data = from_and_to_date(items, fromdate, todate)

        sorted_data = min_and_max(sorted_data, sort_order, min_, max_)

        sorted_data = sort_data(sorted_data, sort_order, order)

        sorted_data, has_more = pages(sorted_data, page_number, page_size)

        data = {
            "items": sorted_data,
            "has_more": has_more
        }
    else:
        for id in all_ids:
            if id not in items:
                url = "https://stackoverflow.com/questions/" + id
                async with aiohttp.ClientSession() as session:
                    page = await get_url(url, session)
                    soup = BeautifulSoup(page, "html.parser")
                    question_id = get_q_id(soup)
                    if question_id == id:
                        items.append(id)
        data = {
            "total": len(items)
        }

    async with aiofiles.open("question_ids.json", "w") as file:
        await file.write(json.dumps(data, indent=4, ensure_ascii=False))

    return data

def sort_data(items, sort_order, order):
    # Sort these values:
    if sort_order == "votes":
        if order == "desc":
            sorted_data = sorted(items, key=lambda x: x['score'], reverse=True)
        else:
            sorted_data = sorted(items, key=lambda x: x['score'], reverse=False)
    elif sort_order == "creation":
        if order == "desc":
            sorted_data = sorted(items, key=lambda x: x['creation_date'], reverse=True)
        else:
            sorted_data = sorted(items, key=lambda x: x['creation_date'], reverse=False)
    else:
        if order == "desc":
            sorted_data = sorted(items, key=lambda x: x['last_activity_date'], reverse=True)
        else:
            sorted_data = sorted(items, key=lambda x: x['last_activity_date'], reverse=False)

    return sorted_data

def min_and_max(items, sort_order, min_, max_):
    data = []
    if min_ or max_:
        for item in items:
            if sort_order == "creation":
                date = item['creation_date']
                if min_ and max_:
                    if int(min_) <= int(date) < int(max_):
                        data.append(item)
                elif min_:
                    if int(date) >= int(min_):
                        data.append(item)
                else:
                    if int(date) < int(max_):
                        data.append(item)

            elif sort_order == "votes":
                votes = item['score']
                if min_ and max_:
                    if int(min_) <= int(votes) <= int(max_):
                        data.append(item)
                elif min_:
                    if int(votes) >= int(min_):
                        data.append(item)
                else:
                    if int(votes) <= int(max_):
                        data.append(item)

            else:
                date = item['last_activity_date']
                if min_ and max_:
                    if int(min_) <= int(date) < int(max_):
                        data.append(item)
                elif min_:
                    if int(date) >= int(min_):
                        data.append(item)
                else:
                    if int(date) < int(max_):
                        data.append(item)
    else:
        return items
    
    return data


def from_and_to_date(items, fromdate, todate):
    data = []
    if fromdate or todate:
        for item in items:
            date = item['creation_date']
            if fromdate and todate:
                if int(fromdate) <= int(date) < int(todate):
                    data.append(item)
            elif fromdate:
                if int(date) >= int(fromdate):
                    data.append(item)
            else:
                if int(date) < int(todate):
                    data.append(item)
    else:
        return items

    return data

def pages(items, page_number, page_size):
    data = []
    has_more = False
    count = 0
    page_count = (int(page_size) * int(page_number)) - int(page_size)
    if items:
        for i in range(int(page_size)):
            if (page_count+i) < len(items):
                data.append(items[page_count + i])
                count += 1

        if (page_count+count) < len(items):
            has_more = True
    
    return data, has_more

# Answer objects

async def create_json_answer(list, filter_):
    is_accepted = list[0]
    score = list[1]
    answer_id = list[2]
    question_id = list[3]
    creation_date = list[4]
    edit_date = list[5]
    content_license = list[6]
    activity_date = list[7]
    community_date = list[8]
    owner = list[9]
    recommendations = list[10]
    collective_posted = list[11]

    if len(owner) > 1:
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
            "display_name": owner[0]
        }
    item = {}
    if recommendations:
        item["recommendations"] = recommendations
    if collective_posted:
        item["posted_by_collectives"] = collective_posted
    item["owner"] = user_info
    item["is_accepted"] = is_accepted
    if community_date is not None:
        item["community_owned_date"] = community_date
    item["score"] = int(score)
    item["last_activity_date"] = activity_date
    if edit_date is not None:
        item["last_edit_date"] = edit_date
    item["creation_date"] = creation_date
    item["answer_id"] = int(answer_id)
    item["question_id"] = int(question_id)
    # item["content_license"] = content_license
    if filter_ == "withbody":
        item["body"] = list[12]

    return item


async def get_answer_info(answer, session, q_id, filter_):
    list = []
    all_recommendations = []

    # Get the stats of the answer object
    is_accepted, score, answer_id, question_id = get_answer_stats(answer)
    list.append(is_accepted)
    list.append(score)
    list.append(answer_id)
    list.append(question_id)
    
    if q_id:
        if question_id != q_id:
            return None
    # Get the creation date and the last edited date
    edit_date = get_answer_dates(answer)

    # Check if the answer is community owned
    is_comm = False
    if answer.find(class_="community-wiki"):
        is_comm = True

    # Check if the answer has a collective recommendation
    recommendations = await get_recommendations(answer, session)

    # Check if the post is posted by a collective
    collective_posted = await get_posted_by_collective(answer, session)

    if filter_ == "withbody":
        withbody = get_body(answer)

    # Page into the timeline page
    url = "https://stackoverflow.com/posts/" + answer_id + "/timeline"
    # async with aiohttp.ClientSession() as session:
    page = await get_url(url, session)
    document = BeautifulSoup(page, "html.parser")

    # Get the info from the timeline
    creation_date, content_license, activity_date, community_date, recom = get_answers_timeline(document, is_comm, recommendations)
    list.append(creation_date)
    list.append(edit_date)
    list.append(content_license)
    list.append(activity_date)
    list.append(community_date)

    owner = await get_owner_info(document, session)
    list.append(owner)

    if recom:
        all_recommendations.append(await create_json_collectives(recom, True))
        list.append(all_recommendations)
    else:
        list.append([])

    if collective_posted:
        list.append(collective_posted)
    else:
        list.append([])
        
    if filter_ == "withbody":
        list.append(withbody)

    return list

def get_answer_stats(document):
    # Is the answer accepted or not
    is_accepted = False
    if not document.find(class_="js-accepted-answer-indicator flex--item fc-green-400 py6 mtn8 d-none"):
        is_accepted = True

    # Get the score of the answer
    score = document.get('data-score').strip()

    # Get the answer_id
    answer_id = document.get('data-answerid').strip()

    # Get the question_id
    question_id = document.get('data-parentid').strip()

    return is_accepted, score, answer_id, question_id
    
def get_answer_dates(document):
    edit_date = None
    dates = document.find(class_="user-action-time fl-grow1").find(class_="js-gps-track")
    if dates:
        edit_date = datetime_to_unix(dates.find(class_="relativetime").get('title'))
    return edit_date

async def get_recommendations(document, session):
    recommendations = []
    if document.find(class_="fc-theme-primary"):
        recommendations = await get_collectives_info(document, session)
    return recommendations

async def get_posted_by_collective(document, session):
    collective_posted = []
    if document.find(class_="s-link s-link__inherit js-gps-track"):
        collective_items = document.find_all(class_="s-link s-link__inherit js-gps-track")
        for item in collective_items:
            collective_item = await get_collectives_info(item, session)
            collective_posted.append(await create_json_collectives(collective_item, False))

    return collective_posted


def get_answers_timeline(document, is_comm, recommendation):
    content_license = document.find(class_="subheader mb16 d-flex fd-column h-auto").find('h3').find('a').get_text(strip=True)
    
    activity_date = None
    has_recent_activity = False
    community_wiki_date = None
    creation_date = None
    if document.find(class_="simultaneous"):
        if document.find(class_="simultaneous").find(class_="wmn1").get_text(strip=True).lower() != "late answers":
            activity_date = datetime_to_unix(document.find(class_="simultaneous").find(class_="relativetime").get('title'))

    all_events = document.find(class_="event-rows fs-body").find_all('tr')
    for event in all_events:
        if event.find(class_="js-load-revision") and not has_recent_activity:
            if "bot" not in event.find(class_="wmn1").find_next_sibling().get_text(strip=True).lower():
                has_recent_activity = True
                latest_activity = datetime_to_unix(event.find(class_="relativetime").get('title'))
                if activity_date:
                    if latest_activity > activity_date:
                        activity_date = latest_activity
                else:
                    activity_date = latest_activity
            elif event.find(class_="mtn2"):
                content_license = "CC BY-SA 4.0"

        if is_comm:
            wiki_event = event.find(string="Post Made Community Wiki")
            if wiki_event:
                community_wiki_date = datetime_to_unix(event.find(class_='relativetime').get('title'))
                is_comm = False
        
        if recommendation:
            if "notice added" in event.find(class_="wmn1").get_text(strip=True):
                recommendation_date = datetime_to_unix(event.find(class_="relativetime").get('title'))
                recommendation.append(recommendation_date)

        if "answered" in event.find(class_="wmn1").get_text(strip=True):
            creation_date = datetime_to_unix(event.find(class_="relativetime").get('title'))
    if not activity_date:
        activity_date = creation_date

    return creation_date, content_license, activity_date, community_wiki_date, recommendation

async def get_question_ids_answers(q_id, list_of_params, filter_):
    if filter_ == "none":
        return {}

    items = []
    all_ids = q_id.split(";")
    total_answers = 0

    sort_order = list_of_params[0]
    order = list_of_params[1]
    page_number = list_of_params[2]
    page_size = list_of_params[3]
    fromdate = list_of_params[5]
    todate = list_of_params[6]
    min_ = list_of_params[7]
    max_ = list_of_params[8]

    for id in async_tqdm(all_ids, desc="Processing questions answers"):
    # for id in all_ids:
        url = "https://stackoverflow.com/questions/" + id
        async with aiohttp.ClientSession() as session:
            page = await get_url(url, session)
            soup = BeautifulSoup(page, "html.parser")

            if filter_ != "total":
                number_of_pages = 1
                has_pages = soup.find_all(class_="s-pagination--item")
                if has_pages:
                    number_of_pages = int(has_pages[-2].get_text(strip=True))
                
                for i in range(1, number_of_pages+1):
                    answers = soup.find_all(class_ = "js-answer")
                    
                    # for answer in async_tqdm(answers, desc="Processing answers"):
                    for answer in answers:
                        list = await get_answer_info(answer, session, id, filter_)
                        if list:
                            item = await create_json_answer(list, filter_)
                            items.append(item)
                    
                    if i+1 <= number_of_pages and list:
                        url = "https://stackoverflow.com/questions/" + id + "?page=%d" % (i+1)
                        # async with aiohttp.ClientSession() as session:
                        page = await get_url(url, session)
                        soup = BeautifulSoup(page, "html.parser")
                                
                else:
                    question_id = get_q_id(soup)
                    if id == question_id:
                        num_answers = soup.find(id="answers-header").find(class_="mb0").get('data-answercount')
                        total_answers += int(num_answers)
    
    if filter_ != "total":
        sorted_data = from_and_to_date(items, fromdate, todate)

        sorted_data = min_and_max(sorted_data, sort_order, min_, max_)

        sorted_data = sort_data(sorted_data, sort_order, order)

        sorted_data, has_more = pages(sorted_data, page_number, page_size)

        data = {
            "items": sorted_data,
            "has_more": has_more
        }

    else:
        data = {
            "total": total_answers
        }

    async with aiofiles.open("question_ids_answers.json", "w") as file:
        await file.write(json.dumps(data, indent=4, ensure_ascii=False))

    return data

async def get_answer_ids(a_id, list_of_params, filter_):
    if filter_ == "none":
        return {}
    
    sort_order = list_of_params[0]
    order = list_of_params[1]
    page_number = list_of_params[2]
    page_size = list_of_params[3]
    fromdate = list_of_params[5]
    todate = list_of_params[6]
    min_ = list_of_params[7]
    max_ = list_of_params[8]

    items = []
    all_ids = a_id.split(";")

    # for id in async_tqdm(all_ids, desc="Processing answers"):
    for id in all_ids:
        url = "https://stackoverflow.com/questions/" + id
        async with aiohttp.ClientSession() as session:
            page = await get_url(url, session)
            soup = BeautifulSoup(page, "html.parser")

            answer = soup.find(id = "answer-"+id)
            if answer and filter_ != "total":
                list = await get_answer_info(answer, session, None, filter_)
                item = await create_json_answer(list, filter_)
                items.append(item)
            
            elif answer and filter_ == "total":
                if id not in items:
                    items.append(id)

    if filter_ != "total":
        sorted_data = from_and_to_date(items, fromdate, todate)

        sorted_data = min_and_max(sorted_data, sort_order, min_, max_)

        sorted_data = sort_data(sorted_data, sort_order, order)

        sorted_data, has_more = pages(sorted_data, page_number, page_size)

        data = {
            "items": sorted_data,
            "has_more": has_more
        }

    else:
        data = {
            "total": len(items)
        }

    async with aiofiles.open("answer_ids.json", "w") as file:
        await file.write(json.dumps(data, indent=4, ensure_ascii=False))

    return data


# Get the collectives endpoint

async def create_json_collectives(list, is_recommended):
    name = list[0]
    slug = list[1]
    description = list[2]
    link = list[3]
    external_links = list[4]
    tags = list[5]

    if not is_recommended:
        item = {
            "tags": tags
        }
        item["external_links"] = external_links
        item["description"] = description
        item["link"] = link
        item["name"] = name
        item["slug"] = slug
    else:
        recommendation_date = list[6]
        collective = {
            "tags": tags
        }
        item = {}
        collective["external_links"] = external_links
        collective["description"] = description
        collective["link"] = link
        collective["name"] = name
        collective["slug"] = slug
        item["collective"] = collective
        item["creation_date"] = recommendation_date

    return item

async def get_collectives_info(collective, session):
    list = []

    link = get_collective_home_info(collective)

    # Page into the collective
    url = "https://stackoverflow.com" + link
    async with aiohttp.ClientSession() as session:
        page = await get_url(url, session)
        document = BeautifulSoup(page, "html.parser")
    
    # Get the external links of the collection
    name, links, slug, description = get_external_links(document)
    list.append(name)
    list.append(slug)
    list.append(description)
    list.append(link)
    list.append(links)

    # Page to the tags page
    href = document.find(id="community-header").find(class_="ml4 ws-nowrap")
    if href:
        href = href.get('href')
        url = "https://stackoverflow.com" + href
        async with aiohttp.ClientSession() as session:
            page = await get_url(url, session)
            document = BeautifulSoup(page, "html.parser")

        tags = await get_collectives_tags(document, href, True, session)

    else:
        tags = await get_collectives_tags(document, None, False, session)

    list.append(tags)

    return list

def get_collective_home_info(document):
    link = document.find(class_="js-gps-track")
    if not link:
        link = document
    link = link.get('href')

    return link

def get_external_links(document):
    links = []

    name_with_collective = document.find(id = "community-header").find(class_="mb2").get_text(strip=True)
    name = name_with_collective.replace("Collective", "").strip()

    all_links = document.find(id="community-header").find(class_="flex--item ml-auto md:d-none").find_all(class_="s-link s-link__inherit ml12")
    for link in all_links:
        url = link.get('href')
        if "email-protection" in url:

            # Extract the part after the #
            obfuscated_string = url.split('#')[-1]
            # The obfuscated email starts with a prefix length of 2
            r = int(obfuscated_string[:2], 16)
            url = ''.join([chr(int(obfuscated_string[i:i+2], 16) ^ r) for i in range(2, len(obfuscated_string), 2)])
            url = "mailto:" + url

        link_type = link.find(class_="d-none").get_text(strip=True)
        if link_type == "Contact":
            link_type = "support"
        link_type = link_type.lower()
        item = {
            "type": link_type,
            "link": url
        }
        links.append(item)
    
    slug = document.find(id="community-header").find(class_="js-join-community").get('data-slug')
    description = document.find(id="community-header").find(class_="wmx7").get_text(strip=True)
    return name, links, slug, description

async def get_collectives_tags(document, href, has_link, session):
    tags = []
    if has_link:
        pages = document.find_all(class_="s-pagination--item")
        if pages:
            n_pages = int(pages[len(pages)-2].get_text(strip=True))
        else:
            n_pages = 1

        for i in range(2, n_pages+2):
            all_tags = document.find_all(class_="post-tag")
            for tag in all_tags:
                tags.append(tag.get_text(strip=True))
            
            if i != n_pages+1:
                url = "https://stackoverflow.com" + href + "&page=%d" % i
                async with aiohttp.ClientSession() as session:
                    page = await get_url(url, session)
                    document = BeautifulSoup(page, "html.parser")
    else:
        tags_location = document.find(id="community-header").find_all(class_="post-tag")
        for tag in tags_location:
            tags.append(tag.get_text(strip=True))

    return tags

async def get_collectives(filter_):
    if filter_ == "none":
        return {}

    items = []
    url = "https://stackoverflow.com/collectives-all"
    async with aiohttp.ClientSession() as session:
        page = await get_url(url, session)
        soup = BeautifulSoup(page, "html.parser")

    all_collectives = soup.find_all(class_="flex--item s-card bs-sm mb12 py16 fc-black-500")

    if filter_ == "total":
        data = {
            "total": len(all_collectives)
        }
        return data

    for collective in all_collectives:
        list = await get_collectives_info(collective, session)
        items.append(await create_json_collectives(list, False))
    
    data = {
        "items": items,
        "has_more": False
    }

    async with aiofiles.open("collectives.json", "w") as file:
        await file.write(json.dumps(data, indent=4, ensure_ascii=False))

    return data


# asyncio.run(get_collectives())

# asyncio.run(get_questions())
# asyncio.run(get_question_ids("927358;11227809;37601644;2003505"))
# asyncio.run(get_question_ids("6591213"))
# asyncio.run(get_question_ids_answers("5475306"))
# asyncio.run(get_question_ids_answers("78852132"))
# asyncio.run(get_question_ids_answers("11227809"))
# asyncio.run(get_question_ids_answers("77497067"))
# asyncio.run(get_question_ids_answers("2003505"))
# asyncio.run(get_question_ids_answers("11227809;2003505"))
# asyncio.run(get_answer_ids("11227902"))
# asyncio.run(get_answer_ids("16563284"))
# q_id: 78853687, a_id: 78853890
# question = https://stackoverflow.com/a/78842806 answer = https://stackoverflow.com/q/78841964