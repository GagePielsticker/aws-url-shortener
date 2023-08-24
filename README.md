# AWS-URL-Shortener

There are two routes for this service

`POST /shorten?=https://test.com`

returns: 
```json
{
    "meta": {
        "region": "us-east-1"
    },
    "status": "Successfully shortened URL.",
    "data": "5x2yeuSUNfwED7NoFiSs49"
}
```

`GET /s/{UUID}` 

UUID is the data recieved above. So in this case going to api.com/s/`5x2yeuSUNfwED7NoFiSs49` would redirect us to `test.com`

returns: `REDIRECT 307 TO STORED URL`
