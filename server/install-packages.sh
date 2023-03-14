#!/bin/bash

# Bash "strict mode", to help catch problems and bugs in the shell
# script. Every bash script you write should include this. See
# http://redsymbol.net/articles/unofficial-bash-strict-mode/ for
# details.
set -euo pipefail

# Tell apt-get we're never going to be able to give manual
# feedback:
export DEBIAN_FRONTEND=noninteractive

# Update the package listing, so we know what package exist:
apt-get update

# Install security updates:
apt-get -y upgrade

# Install poppler and poppler-utils (e.g., pdftoppm)
apt-get -y install --no-install-recommends poppler-utils
# Install tesseract-ocr
apt-get -y install --no-install-recommends tesseract-ocr
# Install the supported languages and scripts
apt-get -y install --no-install-recommends tesseract-ocr-cat \
                                           tesseract-ocr-deu \
                                           tesseract-ocr-eng \
                                           tesseract-ocr-eus \
                                           tesseract-ocr-fra \
                                           tesseract-ocr-gle \
                                           tesseract-ocr-glg \
                                           tesseract-ocr-ita \
                                           tesseract-ocr-nld \
                                           tesseract-ocr-por \
                                           tesseract-ocr-spa

# Delete cached files we don't need anymore (note that if you're
# using official Docker images for Debian or Ubuntu, this happens
# automatically, you don't need to do it yourself):
apt-get clean
# Delete index files we don't need anymore:
rm -rf /var/lib/apt/lists/*