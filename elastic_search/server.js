const express = require('express');
const app = express();
const {Client} = require('@elastic/elasticsearch');
const client = new Client({node: 'http://localhost:9200'});
const path = require('path');

app.set('view engine', 'pug');
app.set('views', './views');

/*const properties = {
    "Afiliação Associativa Objecto" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Afiliação Associativa Texto" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Ano de admissão" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Aposentação - Data" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Aposentação - Motivo" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Assinatura" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Assinatura Texto" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Assinatura URL" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Assinatura WikiCommons" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Até Data" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Avaliação" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Cargo" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Classificação" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Coordenadas" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Curso" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Cônjuge" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de Promoção" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de Readmissão" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de admissão" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de conclusão" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de desfiliação" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de encerramento" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de inicio" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de inscrição" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de inscrição Carteira Profissional" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de inscrição IGE" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Data de inscrição Previdência" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Deficiência" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Descendência" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Descrição" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Descrição de imagem" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Director (ISC) - Data de fim" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Director (ISC) - Data de inicio" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Direitos de Mercê" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Divida à saída" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Documentos oficiais" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Elementos de identificação ou distinção" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Empregador" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Especialidade" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Estado civil" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Fiador" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Filiação materna" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Filiação paterna" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Fonte" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Fontes externas" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Formação - Escola" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Função" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Id" : {
      "type" : "keyword",
      "normalizer" : "term_normalizer"
    },
    "Inabilidade - Data" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Inabilidade - Motivo" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Instituição" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Instrumento" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Local de Morte" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Local de admissão" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Local de nascimento" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Mapa URL" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Mapa WikiCommons" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Modo de Morte" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Modo de desfiliação" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Morte" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Músico Militar - Categoria" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Músico Militar - Ramo" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Nascimento" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Nome" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Nomes alternativos" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Número IGE" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Número de Carteira Profissional" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Número de Previdência" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Número de Sócio/ entrada" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Observações" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Outros números" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Pagamentos - Associação Afiliativa" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Posto" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Professor" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Profissão musical" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Profissão não musical" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Propriedade empresarial" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Registo de voz" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Religião" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Rendimentos" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Residência" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Retrato" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Retrato Texto" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Retrato Url" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Retrato WikiCommons" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Saldação de dívida" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Sexo" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Sócio Proponente" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Tipo de empresa" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Tipo de formação" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Tipologia" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Transcrição da Assinatura" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Título" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "URL" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Unidade Monetária" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    },
    "Área Formativa" : {
      "type" : "text",
      "fields" : {
        "keyword" : {
          "type" : "keyword",
          "normalizer" : "term_normalizer"
        },
        "raw" : {
          "type" : "keyword"
        }
      }
    }
};*/

const properties = {
  "Id": {
    "type": "keyword",
    "normalizer": "term_normalizer"
  },
  "Jornal": {
    "type": "text",
    "fields": {
      "keyword": {
        "type": "keyword",
        "normalizer": "term_normalizer"
      },
      "raw": {
        "type": "keyword"
      }
    }
  },
  "Page": {
    "type": "integer",
    "fields": {
      "keyword": {
        "type": "keyword",
        "normalizer": "term_normalizer"
      },
      "raw": {
        "type": "keyword"
      }
    }
  },
  "Text": {
    "type": "text",
    "fields": {
      "keyword": {
        "type": "keyword",
        "normalizer": "term_normalizer"
      },
      "raw": {
        "type": "keyword"
      }
    }
  },
  "Imagem Página": {
    "type": "text",
    "fields": {
      "keyword": {
        "type": "keyword",
        "normalizer": "term_normalizer"
      },
      "raw": {
        "type": "keyword"
      }
    }
  }
};

const INDEXNAME = "jornais.0.1"
const filterableProps = Object.entries(properties).filter(([_, obj]) => obj.type == 'keyword' || (obj.fields && obj.fields.keyword)).map( ([name, _]) => name).filter( o => o != "URL" && o != "UUID")

let aggs = {}

filterableProps.forEach(name => {
    console.log(name, properties[name])
    let key = properties[name].fields ? name + ".keyword" : name
    aggs[name] = {
        terms: {
            field: key,
            size: 65536,
            order: {
                _term: "asc"
            }
        }
    }
});

const DEFAULT_AGGS = {};

const RESULTS_PER_PAGE = 50;

let queryObject = (string) => {
    if( !string ){
        return {
            match_all: {}
        };
    }
    return [{
        simple_query_string: {
            query: Array.isArray(string) ? string.join(" ") : string,
            fields: ["*"],
            default_operator: 'OR'
        }
    }];
}

let search = (
    query, // query string, ideally given by queryObject()
    filters={pre: [], after: []}, // filters to be applied, pre for before the query, after for after the query (affects aggregations)
    page=0, // page number [0, ...]
    saggs=DEFAULT_AGGS, // aggregations to be applied
    rpp=RESULTS_PER_PAGE, // results per page
    extras={}  // extra fields to aply to the search if needed
) => client.search({
    index: INDEXNAME,
    query: {
        bool: {
            must: query,
            filter: filters.pre
        }
    },
    post_filter: { // Filter after aggregations
        bool: {
            filter: filters.after
        }
    },
    aggs: saggs,
    size: rpp,
    from: page*rpp,
    track_total_hits: true,
    _source: filterableProps,
    ...extras
});

const padZero = (num, size=4) => {
    let s = num.toString();
    while( s.length < size ){
        s = "0" + s;
    }
    return s;
}

const populateFilters = (filters, body={}, afters=["MinAno","MaxAno"]) => { // filters={pre: [], after: []}
    const filtersUsed = {}
    for( let key in aggs ){
        let aggName = key;
        let aggObj = aggs[key];
        let aggField = aggObj.terms ? "terms" : "significant_terms";
        if( !aggObj[aggField] ) continue;
        if( body[aggName] ){
            filtersUsed[aggName] = (Array.isArray(body[aggName]) ? body[aggName] : [body[aggName]]).filter(o => o.length > 0);
            let when = "pre";
            if( afters.indexOf(aggName) != -1 ){
                when = "after";
            }
            filters[when].push({
                bool: {
                    should: filtersUsed[aggName].map( o => (o.startsWith("\"") && o.endsWith("\"") ? {
                        term: {
                            [aggObj[aggField].field]: { value: `${o.slice(1,-1)}` }
                        }
                    } : {
                        wildcard: {
                            [aggObj[aggField].field]: { value: `*${o}*` }
                        }
                    }))
                }
            });
        }
    }
    if( body.notHasField ){
        filtersUsed.notHasField = (Array.isArray(body.notHasField) ? body.notHasField : [body.notHasField]).filter(o => o.length> 0);
        filtersUsed.notHasField.forEach(field => {
            filters.pre.push({
                bool: {
                    must_not: {
                        exists: {
                            field: field
                        }
                    }
                }
            });
        });
    }
    if( body.hasField ){
        filtersUsed.hasField = (Array.isArray(body.hasField) ? body.hasField : [body.hasField]).filter(o => o.length> 0);
        filtersUsed.hasField.forEach(field => {
            filters.pre.push({
                bool: {
                    must: {
                        exists: {
                            field: field
                        }
                    },
                    must_not: {
                        term: {
                            [field]: ""
                        }
                    }
                }
            });
        });
    }
    return filtersUsed;
}

function queryString(originalUrl, drop=["page", "sort"]){
    let url = new URL(originalUrl, "a://b");
    let query = new URLSearchParams(url.searchParams);
    for( let k of drop ){
        query.delete(k);
    }
    return query.toString();
}

let searchedArray = (string) => client.indices.analyze({
    index: INDEXNAME,
    text: string
}).then( r => r.tokens.map( o => o.token) ).catch( e => [])

let allSearchAggPromise = search(queryObject(""), {pre:[],after:[]}, 0, DEFAULT_AGGS, 0).catch( e => {
    console.log("Server couldn't reach elastic search. Using assumed values.")
    return {
        aggregations: {
            MinAno: {
                value_as_string: "1931"
            },
            MaxAno: {
                value_as_string: new Date().getFullYear().toString()
            }
        }
    }
}).then( r => r.aggregations )

function shouldCapitalize(word){
    let exceptions = ["e","o","a","os","as","de","da","do","das","dos","à","no","na","nos","nas","em","por","com","ao","aos"]
    return exceptions.indexOf(word.toLowerCase()) == -1
}

function titleCase(str){
    return str.split(" ").map( o => shouldCapitalize(o) ? `${o.substr(0,1).toUpperCase()}${o.substr(1).toLowerCase()}` : o.toLowerCase()).join(" ")
}

const tmp = app.render.bind(app);
app.render = async (name, obj, next) => {
    let aggsGlobal = await allSearchAggPromise;
    tmp(name, { aggsGlobal, titleCase, properties: filterableProps, requestStart: new Date(), ...obj }, next);
}

// Returns page with filters
app.get("/", (req, res) => {
    const sfilters = {pre: [], after: []};
    const filtersUsed = populateFilters(sfilters, req.query);
    let page = parseInt(req.query.page) || 0;
    search(queryObject(req.query.q), sfilters, page, DEFAULT_AGGS, 0).then(async results => {
        res.render("search", {
            q: req.query.q, querystring: queryString(req.originalUrl),
            body: results,
            hits: results.hits.hits,
            aggs: results.aggregations,
            filters: filtersUsed,
            page: page,
            pages: Math.ceil(results.hits.total.value/RESULTS_PER_PAGE),
            open: Object.keys(filtersUsed).length > 0,
            searchedArray: await searchedArray(req.query.q)
        });
    }).catch(async e => {
        console.log(e);
        res.render("search", {
            q: req.query.q, querystring: queryString(req.originalUrl),
            body: {},
            hits: [],
            aggs: {},
            filters: {},
            page: page,
            pages: 0,
            open: true,
            error: e,
            searchedArray: await searchedArray(req.query.q)
        });
    })
})

// returns only acordãos
app.get("/acord-only", (req, res) => {
    const sfilters = {pre: [], after: []};
    populateFilters(sfilters, req.query);
    let page = parseInt(req.query.page) || 0;
    search(queryObject(req.query.q), sfilters, page, {}, RESULTS_PER_PAGE).then( async results => {
        res.render("acord-article", {
            hits: results.hits.hits,
            max_score: results.hits.max_score
        });
    }).catch(e => {
        console.log(e);
        res.render("acord-article", {
            hits: [],
            max_score: 0,
        });
    });
});

function listAggregation(term){
    return {
        MinAno: aggs.MinAno,
        MaxAno: aggs.MaxAno,
        [term]: {
            terms: {
                field: aggs[term].terms.field.replace("keyword","raw"),
                size: 65536/5,
                order: {
                    _term: "asc",
                }
            }
        }
    }
}

app.get("/indices", (req, res) => {
    const term = req.query.term || "Nome";
    const fields = filterableProps;
    if( fields.indexOf(term) == -1 ){
        return res.render("list", {q: req.query.q, querystring: queryString(req.originalUrl), body: {}, error: `O campo "${term}" não foi indexado.`, aggs: {}, letters: {}, filters: {}, term: term, fields: fields})
    }
    const sfilters = {pre: [], after: []};
    const filters = populateFilters(sfilters, req.query, []);

    search(queryObject(req.query.q), sfilters, 0, listAggregation(term), 0).then( body => {
        res.render("list", {q: req.query.q, querystring: queryString(req.originalUrl), body: body, aggs: body.aggregations, filters: filters, term: term, open: Object.keys(filters).length > 0, fields: fields});
    }).catch( err => {
        console.log(req.originalUrl, err)
        res.render("list", {q: req.query.q, querystring: queryString(req.originalUrl), body: {}, error: err, aggs: {}, letters: {}, filters: {}, term: term, fields: fields});
    });
});

app.get("/indices.csv", (req, res) => {
    const term = req.query.term || "Relator";
    const fields = filterableProps;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    if( fields.indexOf(term) == -1 ){
        res.write(`"Erro"\r\n`);
        res.write(`O campo "${term}" não foi indexado.\r\n`);
        return res.end();
    }
    const sfilters = {pre: [], after: []};
    const filters = populateFilters(sfilters, req.query, []);
    res.write(`"${term}"\t"Quantidade Total"\t"Primeira Data"\t"Última Data"\r\n`);
    search(queryObject(req.query.q), sfilters, 0, listAggregation(term), 0).then( body => {
        body.aggregations[term].buckets.forEach( bucket => {
            res.write(`"${bucket.key}"\t${bucket.doc_count}\t"${bucket.MinAno.value_as_string}"\t"${bucket.MaxAno.value_as_string}"\r\n`);
        });
        res.end();
    }).catch( err => {
        console.log(req.originalUrl, err)
        res.write(`"Erro"\r\n`);
        res.write(`"${err.message}"\r\n`)
        res.end();
    });
})


app.get("/Q:itemid(\\d+)", (req, res) => {
    let itemId = req.params.itemid;
    search({term: {Id: `Q${itemId}`}}, {pre:[], after:[]}, 0, {}, 100).then((body) => {
        if( body.hits.total.value == 0 ){
            res.render("document", {itemId});
        }
        else{
            res.render("document", {itemId, source: body.hits.hits[0]._source, fields: body.hits.hits[0].fields, aggs});
        }
    }).catch(err => {
        console.log(req.originalUrl, err);
        res.render("document", {itemId, error: err});
    });
});

app.get("/datalist", (req, res) => {
    let aggKey = req.query.agg;
    let agg = aggs[aggKey];
    let id = req.query.id || "";
    if( aggKey == "Campos" ){
        client.indices.getMapping({index: INDEXNAME}).then(body => {
            res.render("datalist", {aggs: Object.keys(body[INDEXNAME].mappings.properties).map(o => ({key: o})), id: id});
        });
        return;
    }
    if( !agg ) {
        res.render("datalist", {aggs: [], error: "Aggregation not found", id: req.query.id});
        return;
    }
    let finalAgg = {
        terms: {
            field: agg.terms.field.replace("keyword","raw"),
            size: agg.terms.size
        }
    }
    const sfilters = {pre: [], after: []};
    populateFilters(sfilters, req.query, [aggKey]);
    search(queryObject(req.query.q), sfilters, 0, { [aggKey]: finalAgg}, 0).then(body => {
        res.render("datalist", {aggs: body.aggregations[aggKey].buckets, id: id});
    }).catch(err => {
        console.log(req.originalUrl, err.body.error);
        res.render("datalist", {aggs: [], error: err, id: id});
    });
});

app.use(express.static(path.join(__dirname, "static"), {extensions: ["html"]}));
app.listen(parseInt(process.env.PORT) || 9100)