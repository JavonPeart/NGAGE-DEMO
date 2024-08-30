from flask import Flask, request, jsonify, render_template
import firebase_admin, requests
from firebase_admin import credentials, firestore
from GeminiAIChat.core import API
from flask_cors import CORS


app = Flask(__name__)
CORS(app)

# Initialize Firebase Admin SDK
cred = credentials.Certificate("C:/Users/javon/Downloads/ngage-demo-2e589-firebase-adminsdk-i92aj-0eaf89c114.json")
firebase_admin.initialize_app(cred)


# Initialize Firestore
db = firestore.client()

@app.route('/analyze', methods=['GET'])
def analyze():
    return render_template('/base.html')

@app.route('/userId', methods=['POST'])
def analyze_user():
    data = request.json
    user_id = data.get('userId')
    query = data.get('query')
    
    if user_id:
        # Fetch user data from Firestore using the user_id
        content = f'Categorize "{query}" into one of these categories: Technology, Health, Science, Finance, Entertainment, Education, Travel, Politics, Lifestyle, History. Only respond with the matching category'

        res = ("redacted") # https://aistudio.google.com/app/apikey
        res.prompt(content)
        category = res.response()
        
        if category:
            print(query, category)
            return jsonify({'success': True, 'category': category})
        else: 
            return jsonify({'success': False, 'message': 'Uncategorized'})
    else:
        return jsonify({'success': False, 'message': 'No user ID provided'})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
