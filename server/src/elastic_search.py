from os import environ

from elasticsearch import Elasticsearch
from src.utils.file import get_file_basename
from src.utils.file import FILES_PATH

ES_URL = environ.get("ES_URL", "http://localhost:9200/")
IMAGE_PREFIX = environ.get("IMAGE_PREFIX", ".")
ES_INDEX = "jornais.0.1"

settings = {
    "analysis": {
        "analyzer": {
            "filename_analyzer": {
                "type": "pattern",
                "pattern": "\\W|_",
                "lowercase": True
            },
            "text_analyzer": {
                "tokenizer": "whitespace",
                "filter": ["stop_eng_pt"],
            }
        },
        "filter": {
            "stop_eng_pt": {
                "type": "stop",
                "ignore_case": True,
                "stopwords": ["_english_", "_portuguese_"]
            }
        },
        "normalizer": {
            "term_normalizer": {
                "type": "custom",
                "filter": ["lowercase", "asciifolding"],
            }
        }
    },
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "max_result_window": 550000,
}

mapping = {
    "properties": {
        "Document": {
            "type": "text",
            "analyzer": "filename_analyzer",
            "fields": {
                "keyword": {
                    "type": "keyword"
                }
            },
        },
        "Path": {
            "type": "text",
            "analyzer": "filename_analyzer"
        },
        "Page": {
            "type": "integer",
            "fields": {
                "raw": {
                    "type": "keyword"
                },
                "keyword": {
                    "type": "keyword",
                    "normalizer": "term_normalizer"
                },
            },
        },
        "Text": {
            "type": "text",
            "analyzer": "text_analyzer",
            "fields": {
                "raw": {
                    "type": "keyword"
                },
                "keyword": {
                    "type": "keyword",
                    "normalizer": "term_normalizer"
                },
            },
        },
        "Engine": {
            "type": "keyword",
            "normalizer": "term_normalizer"
        },
        "Config": {  # TODO: store configs differently and allow querying with them
            "type": "object",
            "dynamic": False
        },
        "Page Image": {"enabled": False},
    }
}


class ElasticSearchClient:
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
            index=self.ES_INDEX, mappings=self.mapping, settings=self.settings
        )

    def delete_index(self):
        """
        Delete the index
        """

        self.client.indices.delete(index=self.ES_INDEX, ignore=[400, 404])

    def add_document(self, id, document):
        """
        Add the document to the index
        """

        self.client.index(index=self.ES_INDEX, id=id, document=document)

    def update_document(self, id, text):
        """
        Update the document with the new text
        """

        self.client.update(index=self.ES_INDEX, id=id, body={"doc": {"Text": text}})

    def delete_document(self, id):
        """
        Delete the document from the index
        """

        self.client.delete(index=self.ES_INDEX, id=id)

    def get_all_docs_names(self):
        """
        Get the list of documents from the index
        """
        results = self.client.search(
            index=self.ES_INDEX,
            body={
                "size": 0,
                "aggs": {
                    "docs_names" : {
                        "terms": {
                            "field": "Document.keyword",
                            "size": 10000
                        }
                    }
                }
            }
        )["aggregations"]["docs_names"]["buckets"]
        return [doc["key"] for doc in results]

    def get_docs(self, docs: list[str]):
        """
        Get all content of the specified documents from the index
        """
        results = self.client.search(
            index=self.ES_INDEX,
            body={
                "size": 1000,
                "query": {
                    "bool": {
                        "filter": {
                            "terms": {
                                "Document.keyword": docs
                            }
                        }
                    }
                }
            }
        )["hits"]["hits"]
        for r in results:
            r.pop("_index", None)
            r.pop("_score", None)
        return results

    def search(self, string: str, docs: list[str] = None):
        """
        Search for the words on the given string within the indexed texts and document names.
        If a list of documents is given, the search is restricted to these filenames.
        """
        query = {
            "multi_match" : {
                "query": string,
                "type": "best_fields",
                "fuzziness": "AUTO",
                "fields": [ "Text", "Document" ]
            }
        }

        if docs is not None:
            body = {
                "size": 1000,
                "query": {
                    "bool": {
                        "must": query,
                        "filter": {
                            "terms": {
                                "Document.keyword": docs
                            }
                        }
                    }
                }
            }
        else:
            body = {
                "size": 1000,
                "query": query
            }

        results = self.client.search(
                    index=self.ES_INDEX,
                    body=body
                    )["hits"]["hits"]
        for r in results:
            r.pop("_index", None)
            r.pop("_score", None)
        return results


def create_document(path: str, engine: str, config: dict, text: str, extension: str = "pdf", page: int = None):
    basename = get_file_basename(path)
    page_extension = ".jpg" if extension == "pdf" else ".png" if extension == "zip" else f".{extension}"

    page_url = (IMAGE_PREFIX
                + "/images/"
                + "/".join(path.split('/')[1:-2])
                + f"/_pages/{basename}"
                + page_extension)

    if page is None:
        return {
            "Document": path.split("/")[-3],
            "Path": path,
            "Text": text,
            "Engine": engine,
            "Config": config,
            "Page Image": page_url,
        }
    else:
        return {
            "Document": path.split("/")[-3],
            "Path": path,
            "Page": page,
            "Text": text,
            "Engine": engine,
            "Config": config,
            "Page Image": page_url,
        }
