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

# populate variable for later
ARG TARGETARCH
RUN arch=$TARGETARCH \
    && if [ "$TARGETARCH" = "amd64" ]; then arch="x64"; fi \
    && echo $arch > /tmp/arch

# Note we need leptonica here to build jbig2
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential autoconf automake libtool \
  libleptonica-dev \
  zlib1g-dev \
  python3-venv \
  python3-pip \
  python3-dev \
  libffi-dev \
  ca-certificates \
  curl \
  git \
  libcairo2-dev \
  pkg-config

# Compile and install jbig2
# Needs libleptonica-dev, zlib1g-dev
RUN \
  mkdir jbig2 \
  && curl -L https://github.com/agl/jbig2enc/archive/c0141bf.tar.gz | \
  tar xz -C jbig2 --strip-components=1 \
  && cd jbig2 \
  && ./autogen.sh && ./configure && make && make install \
  && cd .. \
  && rm -rf jbig2

WORKDIR /usr/local/src

ARG PYPDFIUM2_VERSION=5.0.0
# synced with libpdfium version bundled by pypdfium above
ARG PDFIUM_VERSION=7483
ARG PDFIUM_URL=https://github.com/bblanchon/pdfium-binaries/releases/download/chromium

# build to this prefix
ARG PREFIX=/usr/local
ENV PKG_CONFIG_PATH=$PREFIX/lib/pkgconfig

RUN \
  mkdir pdfium \
  && curl -L $PDFIUM_URL/$PDFIUM_VERSION/pdfium-linux-$(cat /tmp/arch).tgz | \
  tar xz -C pdfium \
  && cd pdfium \
  && cp lib/* $PREFIX/lib \
  && cp -r include/* $PREFIX/include \
  && cd .. \
  && rm -rf pdfium

COPY . /app

WORKDIR /app

# Create and enable venv
RUN python -m venv /opt/venv
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN pip3 install --no-cache-dir -r requirements/worker/requirements.txt

FROM base

# For Tesseract 5
RUN apt-get update && apt-get install -y --no-install-recommends \
  software-properties-common gpg-agent
RUN add-apt-repository -y ppa:alex-p/tesseract-ocr5

RUN apt-get update && apt-get install -y --no-install-recommends \
  ghostscript \
  fonts-droid-fallback \
  jbig2dec \
  pngquant \
  tesseract-ocr \
  unpaper \
  file \
  && rm -rf /var/lib/apt/lists/*

ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata/

# Trained data which supports legacy Tesseract engine (non-LSTM)
ADD https://raw.githubusercontent.com/tesseract-ocr/tessdata/refs/heads/main/eng.traineddata \
    https://raw.githubusercontent.com/tesseract-ocr/tessdata/refs/heads/main/por.traineddata \
    https://raw.githubusercontent.com/tesseract-ocr/tessdata/refs/heads/main/deu.traineddata \
    https://raw.githubusercontent.com/tesseract-ocr/tessdata/refs/heads/main/fra.traineddata \
    https://raw.githubusercontent.com/tesseract-ocr/tessdata/refs/heads/main/spa.traineddata \
    https://raw.githubusercontent.com/tesseract-ocr/tessdata/refs/heads/main/equ.traineddata \
    https://raw.githubusercontent.com/tesseract-ocr/tessdata/refs/heads/main/osd.traineddata \
    /usr/share/tesseract-ocr/5/tessdata/

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
