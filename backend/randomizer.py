import random
import string
import uuid
from datetime import datetime, timedelta

def rand_num(digits=4):
    return ''.join(random.choices(string.digits, k=int(digits)))

def rand_choice(choices):
    arr = choices if isinstance(choices, list) else [s.strip() for s in str(choices).split(',')]
    return random.choice(arr)

def rand_guid():
    return str(uuid.uuid4())

def rand_date(start, end):
    fmt = "%Y-%m-%d"
    dt_start = datetime.strptime(start, fmt)
    dt_end = datetime.strptime(end, fmt)
    days = (dt_end - dt_start).days
    rand_days = random.randint(0, days)
    return (dt_start + timedelta(days=rand_days)).strftime(fmt)

def rand_email():
    user = 'user' + rand_num(5)
    domains = ['example.com', 'testmail.com', 'mailinator.com']
    return f"{user}@{rand_choice(domains)}"

def apply_random_format(fmt):
    # Example: "Demo_{randNum:6}_Account", "{randChoice:a,b,c}", "{randGuid}"
    val = fmt
    for _ in range(5):  # allow nested randoms
        val = val.replace('{randGuid}', rand_guid())
        val = val.replace('{randEmail}', rand_email())
        # randNum
        val = re_sub(r'\{randNum(?::(\d+))?\}', lambda m: rand_num(m.group(1) or 4), val)
        # randChoice
        val = re_sub(r'\{randChoice:([^}]+)\}', lambda m: rand_choice(m.group(1).split(',')), val)
        # randDate
        val = re_sub(r'\{randDate:([^,}]+),([^}]+)\}', lambda m: rand_date(m.group(1), m.group(2)), val)
    return val

import re
def re_sub(pattern, repl, string):
    return re.sub(pattern, repl, string)
