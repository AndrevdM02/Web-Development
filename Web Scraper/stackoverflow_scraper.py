from flask import Flask, jsonify, Response, request
import json
import aiohttp
import asyncio
import aiofiles
import re
import web_scraper
import os

app = Flask(__name__)
app.config.update({
    "JSON_SORT_KEYS": False
})

@app.route("/")
def home():
    return ""

@app.route("/questions")
async def api_question():
    list_of_params = await get_parameters(True)

    # Prints error 400 if the parameter has been given incorrectly
    if isinstance(list_of_params, tuple):
        return list_of_params

    filter_ = await get_filter_param()
    
    if isinstance(filter_, tuple):
        return filter_

    questions = await web_scraper.get_questions(list_of_params, filter_)
    return Response(json.dumps(questions, sort_keys=False, indent=0),mimetype='application/json;  charset=utf-8')

@app.route("/questions/<path:question_ids>")
async def api_questions_ids(question_ids):
    is_valid_ids = await check_ids(question_ids)
    if isinstance(is_valid_ids, tuple):
        return is_valid_ids
    
    list_of_params = await get_parameters(False)

    # Prints error 400 if the parameter has been given incorrectly
    if isinstance(list_of_params, tuple):
        return list_of_params
    
    filter_ = await get_filter_param()
    
    if isinstance(filter_, tuple):
        return filter_

    questions = await web_scraper.get_question_ids(question_ids, list_of_params, filter_)
    return Response(json.dumps(questions, sort_keys=False, indent=0),mimetype='application/json')

@app.route("/questions/<path:question_ids>/answers")
async def api_questions_ids_answers(question_ids):
    is_valid_ids = await check_ids(question_ids)
    if isinstance(is_valid_ids, tuple):
        return is_valid_ids

    list_of_params = await get_parameters(False)

    # Prints error 400 if the parameter has been given incorrectly
    if isinstance(list_of_params, tuple):
        return list_of_params

    filter_ = await get_filter_param()
    
    if isinstance(filter_, tuple):
        return filter_

    questions = await web_scraper.get_question_ids_answers(question_ids, list_of_params, filter_)
    return Response(json.dumps(questions, sort_keys=False, indent=0),mimetype='application/json')

@app.route("/answers/<path:answer_ids>")
async def api_answers(answer_ids):
    is_valid_ids = await check_ids(answer_ids)
    if isinstance(is_valid_ids, tuple):
        return is_valid_ids

    list_of_params = await get_parameters(False)

    # Prints error 400 if the parameter has been given incorrectly
    if isinstance(list_of_params, tuple):
        return list_of_params

    filter_ = await get_filter_param()
    
    if isinstance(filter_, tuple):
        return filter_

    answers = await web_scraper.get_answer_ids(answer_ids, list_of_params, filter_)
    return Response(json.dumps(answers, sort_keys=False, indent=0),mimetype='application/json')

@app.route("/collectives")
async def api_collectives():
    if request.args.get('site') != "stackoverflow":
        return (await bad_parameter('site is required'))
    filter_ = await get_filter_param()
    
    if isinstance(filter_, tuple):
        return filter_

    collectives = await web_scraper.get_collectives(filter_)
    return Response(json.dumps(collectives, sort_keys=False, indent=0),mimetype='application/json; charset=utf-8')

@app.errorhandler(404)
async def page_not_found(e):
    Response = {
        'error_id': 404,
        'error_message': "no method found with this name",
        'error_name': "no_method"
    }
    return jsonify(Response), 404

@app.errorhandler(400)
async def bad_parameter(param):
    Response = {
        'error_id': 400,
        'error_message': param,
        'error_name': "bad_parameter"
    }
    return jsonify(Response), 400

async def get_parameters(is_question):
    list = []
    page_number = None
    page_size = None
    tags  = None
    todate = None
    fromdate = None
    min_ = None
    max_ = None
    
    site = request.args.get('site')
    if site != "stackoverflow":
        return (await bad_parameter('site is required'))

    sort_order = request.args.get('sort')
    if not sort_order:
        sort_order = "activity"
    else:
        if sort_order not in ["activity", "votes", "creation"]:
            if is_question:
                if sort_order not in ["hot", "week", "month"]:
                    return(await bad_parameter("sort"))
            else:
                return(await bad_parameter("sort"))

    order = request.args.get('order')
    if not order:
        order = "desc"
    else:
        if order not in ["desc", "asc"]:
            return(await bad_parameter("order"))

    page_number = request.args.get('page')
    page_size = request.args.get('pagesize')

    if page_number:
        if not page_number.isdigit():
            return(await bad_parameter("page"))
    else:
        page_number = "1"
    
    if page_size:
        if not page_size.isdigit():
            return(await bad_parameter("pagesize"))
        elif int(page_size) > 100:
            return(await bad_parameter("pagesize"))
    else:
        page_size = "30"

    if is_question:
        tags = request.args.get('tagged')

    fromdate = request.args.get('fromdate')
    if fromdate:
        if not is_unix_timestamp(fromdate):
            return(await bad_parameter("fromdate"))
    todate = request.args.get('todate')
    if todate:
        if not is_unix_timestamp(todate):
            return(await bad_parameter("todate"))

    min_ = request.args.get('min')
    if min_:
        if sort_order in ["hot", "week", "month"]:
            return(await bad_parameter("min"))
        
        if sort_order == "votes":
            if not -2147483648 <= int(min_) <= 2147483647:
                return(await bad_parameter("min, expected integer"))
        else:
            if not is_unix_timestamp(min_):
                return(await bad_parameter("min, expected date"))

    max_ = request.args.get('max')
    if max_:
        if sort_order in ["hot", "week", "month"]:
            return(await bad_parameter("max"))
        
        if sort_order == "votes":
            if not -2147483648 <= int(max_) <= 2147483647:
                return(await bad_parameter("max, expected integer"))
        else:
            if not is_unix_timestamp(max_):
                return(await bad_parameter("max, expected date"))

    list.append(sort_order)
    list.append(order)
    list.append(page_number)
    list.append(page_size)
    list.append(tags)
    list.append(fromdate)
    list.append(todate)
    list.append(min_)
    list.append(max_)

    return list


async def get_filter_param():
    filter_ = request.args.get('filter')
    if filter_:
        if filter_ not in ["default", "withbody", "none", "total"]:
            return(await bad_parameter("Invalid filter specified"))
    else:
        filter_ = "default"

    return filter_

async def check_ids(ids):
    all_ids = ids.split(";")
    for id in all_ids:
        if not id.isdigit():
            return(await page_not_found(404))

        if not -2147483648 <= int(id) <= 2147483647:
            return(await bad_parameter("ids"))
        
    return None
            

def is_unix_timestamp(date):
    try:
        if date.isdigit():
            timestamp = int(date)

            if 0 <= timestamp <= 32503680000:
                return True
    except ValueError:
        pass
    return False

if __name__ =="__main__":
    port = int(os.getenv('STACKOVERFLOW_API_PORT', 5000))
    app.run(debug=False, port=port)