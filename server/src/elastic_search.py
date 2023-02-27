from src.utils.file import get_file_basename
from elasticsearch import Elasticsearch
from os import environ

import random, uuid

ES_URL = environ.get('ES_URL', 'http://localhost:9200/')
ES_INDEX = "jornais.0.1"

settings = {
    "analysis": {
        "normalizer": {
            "term_normalizer": {
                "type": 'custom',
                "filter": ['lowercase', 'asciifolding']
            }
        }
    },
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "max_result_window": 550000
}

mapping = {
    "properties": {
        "Id": {
            "type": "keyword",
            "normalizer": "term_normalizer"
        },
        "Document": {
            "type": 'text',
            "fields": {
                "raw": {
                    "type": "keyword"
                },
                "keyword": {
                    "type": "keyword",
                    "normalizer": "term_normalizer"
                }
            }
        },
        "Path": {
            "type": 'text',
            "fields": {
                "raw": {
                    "type": "keyword"
                },
                "keyword": {
                    "type": "keyword",
                    "normalizer": "term_normalizer"
                }
            }
        },
        "Page": {
            "type": 'integer',
            "fields": {
                "raw": {
                    "type": "keyword"
                },
                "keyword": {
                    "type": "keyword",
                    "normalizer": "term_normalizer"
                }
            }
        },
        "Text": {
            "type": 'text',
            "fields": {
                "raw": {
                    "type": "keyword"
                },
                "keyword": {
                    "type": "keyword",
                    "normalizer": "term_normalizer"
                }
            }
        },
        " Page Image": {
            "enabled": False
        },
    }
}

class ElasticSearchClient():
    def __init__(self, ES_URL, ES_INDEX, mapping, settings):
        self.ES_URL = ES_URL
        self.ES_INDEX = ES_INDEX
        self.mapping = mapping
        self.settings = settings

        self.client = Elasticsearch(ES_URL)
        # self.delete_index()
        if not self.client.indices.exists(index=self.ES_INDEX):
            self.create_index()

    def create_index(self):
        """
        Create the index with the mapping and settings
        """

        self.client.indices.create(
            index=self.ES_INDEX,
            mappings=self.mapping,
            settings=self.settings
        )

    def delete_index(self):
        """
        Delete the index
        """

        self.client.indices.delete(
            index=self.ES_INDEX,
            ignore=[400, 404]
        )

    def add_document(self, id, document):
        """
        Add the document to the index
        """

        self.client.index(
            index=self.ES_INDEX,
            id=id,
            document=document
        )

    def update_document(self, id, text):
        """
        Update the document with the new text
        """

        self.client.update(
            index=self.ES_INDEX,
            id=id,
            body={
                "doc" : {
                    "Text": text
                }
            }
        )

    def delete_document(self, id):
        """
        Delete the document from the index
        """

        self.client.delete(
            index=self.ES_INDEX,
            id=id
        )

    def get_docs(self):
        """
        Get the documents from the index
        """

        return list(self.client.search(index=self.ES_INDEX, body={
            'size': 1000,
            'query': {
                'match_all': {}
            }
        })["hits"]["hits"])

def create_document(path, algorithm, config, text, page=None):
    basename = get_file_basename(path)
    image = "http://localhost/images/" + '/'.join(path.split('/')[1:-2]) + '/' + basename + ".jpg"

    if page is None:
        return {
            "Path": path,
            "Algorithm": algorithm,
            "Config": config,
            "Document": path.split('/')[-3],
            "Page Image": image,
            "Text": text
        }
    else:
        return {
            "Path": path,
            "Algorithm": algorithm,
            "Config": config,
            "Document": path.split('/')[-3],
            "Page": page,
            "Page Image": image,
            "Text": text
        }