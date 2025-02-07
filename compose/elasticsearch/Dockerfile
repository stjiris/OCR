FROM elasticsearch:8.17.1

ARG DEBIAN_FRONTEND=noninteractive

WORKDIR /usr/share/elasticsearch

COPY --chown=elasticsearch:elasticsearch ./stopwords_pt.txt config/
