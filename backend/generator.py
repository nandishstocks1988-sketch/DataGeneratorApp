import csv
import io
import json
import os
from itertools import combinations
from randomizer import apply_random_format

def parse_array(val):
    if not val:
        return []
    if isinstance(val, list):
        return val
    if isinstance(val, str):
        try:
            arr = json.loads(val)
            if isinstance(arr, list): return arr
        except:
            pass
        return [s.strip() for s in val.split(',') if s.strip()]
    return []

def best_match_rows(rows, filters):
    # Try all subsets of filters (excluding empty set), most specific first
    filter_keys = [k for k, v in filters.items() if v]
    n = len(filter_keys)
    for r in range(n, 0, -1):
        for combo in combinations(filter_keys, r):
            matched = [row for row in rows if all(row.get(k, '') in filters[k] for k in combo)]
            if matched:
                return matched
    return []

def load_config(record_type):
    config_path = os.path.join(os.path.dirname(__file__), 'config', f'{record_type}Form.config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'randomize': {}}

def generate_data(params, record_type, dump_data):
    # Read CSV as list of dicts
    f = io.StringIO(dump_data)
    reader = csv.DictReader(f)
    all_rows = [row for row in reader if any(row.values())]
    if not all_rows:
        return {'csv': '', 'stats': {'success': 0, 'failed': 0}, 'error': 'No data source found or file is empty.'}

    filters = {
        'State': parse_array(params.get('states')),
        'ProductGroup': parse_array(params.get('productGroups')),
        'GroupSize': parse_array(params.get('groupSizes')),
        'FundingType': parse_array(params.get('fundingTypes')),
        'Product': parse_array(params.get('products'))
    }
    matching = best_match_rows(all_rows, filters)
    if not matching:
        return {'csv': '', 'stats': {'success': 0, 'failed': 0}, 'error': 'No data found for selected configuration.'}

    num_records = int(params.get('numRecords', 10))
    config = load_config(record_type)
    randomize = config.get('randomize', {})

    # Prepare output rows
    output = []
    failed = 0
    for i in range(num_records):
        base_row = dict(matching[i % len(matching)])
        try:
            for field, fmt in randomize.items():
                base_row[field] = apply_random_format(fmt)
            base_row['Status'] = 'Success'
            base_row['Message'] = ''
        except Exception as e:
            base_row['Status'] = 'Failed'
            base_row['Message'] = str(e)
            failed += 1
        output.append(base_row)

    # Get union of all fields
    all_fields = set()
    for row in output:
        all_fields.update(row.keys())
    fieldnames = list(reader.fieldnames) if reader.fieldnames else list(all_fields)
    for extra in ['Status', 'Message']:
        if extra not in fieldnames:
            fieldnames.append(extra)

    # Write to CSV
    outbuf = io.StringIO()
    writer = csv.DictWriter(outbuf, fieldnames=fieldnames, lineterminator='\n')
    writer.writeheader()
    for row in output:
        writer.writerow({k: row.get(k, '') for k in fieldnames})

    return {
        'csv': outbuf.getvalue(),
        'stats': {'success': len(output) - failed, 'failed': failed},
        'error': 'Some records failed to randomize.' if failed else ''
    }