from celery import Celery
from flask import Flask
from flask_cors import CORS

import os

app = Flask(__name__)
CORS(app)

CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379'),
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379')
celery = Celery("celery_app", broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND)