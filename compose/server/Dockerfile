FROM python:3.10

WORKDIR /opt/app

RUN apt-get update && apt-get install -y python3-opencv poppler-utils tesseract-ocr  tesseract-ocr-all

RUN python -m venv env

COPY ./requirements.txt .

RUN ./env/bin/pip install -r requirements.txt

COPY . .

ENTRYPOINT [ "./env/bin/python", "app.py" ]

