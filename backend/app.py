import os
from flask import Flask, request, send_from_directory, jsonify
from generator import generate_data

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route('/api/template/<type>', methods=['GET'])
def download_template(type):
    template_dir = os.path.join(BASE_DIR, 'template')
    filename = f'{type}_Template.xlsx'
    return send_from_directory(template_dir, filename, as_attachment=True)

@app.route('/api/generate', methods=['POST'])
def api_generate():
    params = request.form.to_dict()
    for k in ['states', 'productGroups', 'groupSizes', 'fundingTypes', 'products']:
        if k in params:
            try:
                params[k] = eval(params[k]) if isinstance(params[k], str) else params[k]
            except:
                params[k] = []
    record_type = params.get('recordType', 'Account')
    csv_path = os.path.join(BASE_DIR, 'data', 'salesforce_dump.csv')
    if not os.path.exists(csv_path):
        return jsonify(success=False, error="No data source found."), 500

    with open(csv_path, encoding='utf-8-sig') as f:
        dump_data = f.read()
    result = generate_data(params, record_type, dump_data)
    result_path = os.path.join(BASE_DIR, 'data', 'result.csv')
    with open(result_path, 'w', encoding='utf-8', newline='') as f:
        f.write(result['csv'])
    # Log errors
    if result.get('error'):
        with open(os.path.join(BASE_DIR, 'logs', 'generate.log'), 'a', encoding='utf-8') as logf:
            logf.write(f"[{record_type}] {result['error']}\n")
    return jsonify({
        'success': not bool(result.get('error')),
        'resultUrl': '/api/download/result.csv',
        'stats': result['stats'],
        'error': result.get('error')
    })

@app.route('/api/download/<filename>', methods=['GET'])
def api_download(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'data'), filename, as_attachment=True)

if __name__ == '__main__':
    os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)
    os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)
    os.makedirs(os.path.join(BASE_DIR, 'template'), exist_ok=True)
    app.run(host='0.0.0.0', port=5000)