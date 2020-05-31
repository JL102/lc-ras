mongo lc_ras --eval "db.categorylayout.remove({});"
mongoimport --db lc_ras --collection categorylayout --file categorylayout.json
