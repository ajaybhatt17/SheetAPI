# SheetAPI

Get google spreadsheet data as api response.

[![npm module](https://d25lcipzij17d.cloudfront.net/badge.svg?id=js&type=6&v=0.0.1&x2=0)](https://www.npmjs.org/package/sheet-api)


## Setup

To use with node:

```
$ npm install sheet-api@latest
```

Then in the console:

```
var SheetAPI = require('sheet-api').SheetAPI;
```

To use directly in the browser:

```
<script src="/path/to/yourCopyOf/sheet-api.bundle.min.js"></script>
```

## Usage

SpreadSheetUrl Format - https://docs.google.com/spreadsheets/d/{DOCID}/edit

To use with node:

```
import {SheetAPI} from "sheet-api";

var spreadSheetUrl = "";

var sheet = new Sheet(spreadSheetUrl);
       sheet.fetchData().then((responseData) => {
          console.log(responseData);
        });

``` 

To use directly in the browser:

``` 
<script src="sheet-min.js"></script>
<script>
var spreadSheetUrl = "";
new Sheet(spreadSheetUrl).fetchData().then(function(data) {
    console.log(data);
});
</script>

``` 

## Documentation

Api Response format:

```
{
    docName: string,
    version: number,
    sheets: [{
        range: {rows: number, cols: number},
        values: [Array]
    }]
} 
```

## Note : 
- Spreadsheet should be open accessed by default (no private doc is supported). 
- Private doc can be accessed only if session is opened in browser and using this library at client side.

## Demo

Refer to demo folder

## License

[BSD](./LICENSE)
