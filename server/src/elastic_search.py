from elasticsearch import Elasticsearch

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
        # "Imagem Página": "https://cdn.flipsnack.com/template/4708/small/page_1?v=1635417761",
        "Text": text
    }