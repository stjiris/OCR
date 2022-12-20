from elasticsearch import Elasticsearch

ES_URL = 'http://localhost:9200/'
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
        self.delete_index()
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
        print(self.client.index(
            index=self.ES_INDEX,
            document=document
        ))

def create_document(jornal, page_number, text):
    return {
        "Id": f"{jornal}_{page_number}",
        "Jornal": jornal,
        "Page": page_number,
        "Imagem Página": f"http://localhost/images/{jornal}_{page_number}.jpg",
        "Text": text
    }