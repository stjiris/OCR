FROM python:3.10

# Install missing Debian packages
COPY install-packages.sh .
RUN ./install-packages.sh

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# Install pip requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /opt/app/

WORKDIR /opt/app

ENTRYPOINT [ "python", "app.py" ]

