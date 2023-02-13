from elasticsearch import Elasticsearch
from os import environ

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
        "Jornal": {
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
        "Imagem Página": {
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
        if not self.client.indices.exists(index=self.ES_INDEX):
            self.create_index()

    def create_index(self):
        self.client.indices.create(
            index=self.ES_INDEX,
            mappings=self.mapping,
            settings=self.settings
        )

    def delete_index(self):
        self.client.indices.delete(
            index=self.ES_INDEX,
            ignore=[400, 404]
        )

    def add_document(self, document):
        self.client.index(
            index=self.ES_INDEX,
            id=document["Id"],
            document=document
        )

    def update_document(self, id, text):
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
        self.client.delete(
            index=self.ES_INDEX,
            id=id
        )

    def get_docs(self):
        return list(self.client.search(index=self.ES_INDEX, body={
            'size': 100,
            'query': {
                'match_all': {}
            }
        })["hits"]["hits"])

def create_document(path, extension, text, page=None):
    if extension in ["jpg", "jpeg", "png"]:
        return {
            "Id": f"{path}.{extension}",
            "Jornal": path,
            "Imagem Página": f"./images/{path}_1.jpg",
            "Text": text
        }
    else:
        return {
            "Id": f"{path}_{page}.{extension}",
            "Jornal": path,
            "Page": page,
            "Imagem Página": f"./images/{path}_{page}.jpg",
            "Text": text
        }