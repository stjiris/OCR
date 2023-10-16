# Adapted from https://raw.githubusercontent.com/ocrmypdf/OCRmyPDF/master/.docker/Dockerfile
# SPDX-FileCopyrightText: 2022 James R. Barlow
# SPDX-License-Identifier: MPL-2.0

FROM ubuntu:22.04 as base

ENV LANG=C.UTF-8
ENV TZ=UTC
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  libqpdf-dev \
  zlib1g \
  liblept5

RUN apt-get update && apt-get install -y --no-install-recommends \
	glib-2.0-dev \
	libexpat1-dev \
	libpango1.0-dev \
	librsvg2-dev \
	libpng-dev \
	libwebp-dev \
	libjpeg-turbo8-dev \
	libtiff5-dev \
	libexif-dev \
	liblcms2-dev \
	libgsf-1-dev \
	liborc-0.4-dev \
	libimagequant-dev \
	libcgif-dev \
	libheif-dev \
	libfftw3-dev

FROM base as builder

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
  python3-dev \
  python3-distutils \
  libffi-dev \
  ca-certificates \
  curl \
  git \
  libcairo2-dev \
  pkg-config \
  ninja-build

# Get the latest pip (Ubuntu version doesn't support manylinux2010)
RUN \
  curl https://bootstrap.pypa.io/get-pip.py | python3

WORKDIR /usr/local/src

# Compile and install jbig2
# Needs libleptonica-dev, zlib1g-dev
RUN \
  mkdir jbig2 \
  && curl -L https://github.com/agl/jbig2enc/archive/ea6a40a.tar.gz | \
  tar xz -C jbig2 --strip-components=1 \
  && cd jbig2 \
  && ./autogen.sh && ./configure && make && make install \
  && cd .. \
  && rm -rf jbig2

ARG PYPDFIUM2_VERSION=4.21.0
RUN pip3 install --no-cache-dir pypdfium2==$PYPDFIUM2_VERSION

# synced with libpdfium version bundled by pypdfium above
ARG PDFIUM_VERSION=6056
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

# make a pdfium.pc file libvips can use
RUN mkdir -p $PREFIX/lib/pkgconfig \
  && cd $PREFIX/lib/pkgconfig \
  && echo "prefix=$PREFIX" >> pdfium.pc \
  && echo "exec_prefix=\${prefix}" >> pdfium.pc \
  && echo "libdir=\${exec_prefix}/lib" >> pdfium.pc \
  && echo "includedir=\${prefix}/include" >> pdfium.pc \
  && echo "Name: pdfium" >> pdfium.pc \
  && echo "Description: pdfium" >> pdfium.pc \
  && echo "Version: $PDFIUM_VERSION" >> pdfium.pc \
  && echo "Requires: " >> pdfium.pc \
  && echo "Libs: -L\${libdir} -lpdfium" >> pdfium.pc \
  && echo "Cflags: -I\${includedir}" >> pdfium.pc

RUN pip3 install --no-cache-dir meson

ARG VIPS_VERSION=8.14.5
ARG VIPS_URL=https://github.com/libvips/libvips/releases/download

RUN \
  mkdir vips \
  && curl -L ${VIPS_URL}/v${VIPS_VERSION}/vips-${VIPS_VERSION}.tar.xz | \
	tar xJ -C vips --strip-components=1 \
	&& cd vips \
	&& meson setup build \
		--prefix=$PREFIX \
    --libdir=lib \
		--buildtype=release \
		-Dradiance=false \
		-Danalyze=false \
		-Dintrospection=false \
	&& cd build \
	&& meson compile \
	&& meson install \
  && cd .. \
  && rm -rf vips

ARG PYVIPS_VERSION=2.2.1
RUN pip3 install --no-cache-dir pyvips==$PYVIPS_VERSION

COPY . /app

WORKDIR /app

RUN pip3 install --no-cache-dir -r requirements.txt

FROM base

# For Tesseract 5
RUN apt-get update && apt-get install -y --no-install-recommends \
  software-properties-common gpg-agent
RUN add-apt-repository -y ppa:alex-p/tesseract-ocr-devel

RUN apt-get update && apt-get install -y --no-install-recommends \
  ghostscript \
  fonts-droid-fallback \
  jbig2dec \
  img2pdf \
  libsm6 libxext6 libxrender-dev \
  pngquant \
  tesseract-ocr \
  tesseract-ocr-chi-sim \
  tesseract-ocr-deu \
  tesseract-ocr-eng \
  tesseract-ocr-fra \
  tesseract-ocr-por \
  tesseract-ocr-spa \
  unpaper \
  file \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /usr/local/lib/ /usr/local/lib/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# For vips
RUN ldconfig
RUN vips --vips-config

COPY --from=builder /app/ /app/
RUN sed -i 's/\r$//g' /app/start
RUN chmod +x /app/start
