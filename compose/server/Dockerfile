# Adapted from https://raw.githubusercontent.com/ocrmypdf/OCRmyPDF/master/.docker/Dockerfile
# SPDX-FileCopyrightText: 2022 James R. Barlow
# SPDX-License-Identifier: MPL-2.0

FROM ubuntu:24.04 AS base

ENV LANG=C.UTF-8
ENV TZ=UTC
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  python-is-python3

FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  python3-venv \
  python3-pip \
  python3-dev \
  ca-certificates \
  curl

COPY . /app

WORKDIR /app

# Create and enable venv
RUN python -m venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN pip3 install --no-cache-dir -r requirements/server/requirements.txt

FROM base

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /usr/local/lib/ /usr/local/lib/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

COPY --from=builder /app/ /app/

# Enable venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN sed -i 's/\r$//g' /app/start
RUN chmod +x /app/start
