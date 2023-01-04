# Dissertacao-OCR

# Next steps
- [ ] Remover logotipos
- [ ] Sessão - pasta com imagens e resultados e conf do OCR

- [ ] Corrigir erros de OCR


# How to setup
## Change the `nginx.conf` file to match your directory
```
location / {
    root path/to/Dissertacao-OCR/website/build;
    index index.html;
}
```

```
location /images/ {
    alias path/to/Dissertacao-OCR/server/file_uploads/;
}
```

This 2 routes need to be changed. Everything else should be the same.

## Start the backend server
```
$ cd server
$ python app.py
```

## Build the OCR Server
```
$ cd website
$ npm run build
```

## Start the elastic search server
```
$ cd elastic_search
$ node server.js
```

# How to run
Start the NGINX and access the url `http://localhost`.

# How to use the website
Press the button "Insert File" and select a PDF file.  
The file will be uploaded to the server and the text will be extracted.  
The extracted text will be displayed in the text area and the corresponding page image will be shown on its left.

Now you can fix the text and press the button "Save Text" to save the changes.