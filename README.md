# SheetApi

Get google spreadsheet data as api response.

```
import {SheetAPI} from "sheet-api";

var spreadSheetUrl = "";

var sheet = new Sheet(spreadSheetUrl);
       sheet.fetchData().then((responseData) => {
          console.log(responseData);
        });

``` 

spreadSheetUrl Format - https://docs.google.com/spreadsheets/d/{DOCID}/edit

``` 
<script src="sheet-min.js"/>
<script>
var spreadSheetUrl = "";
var data = new Sheet(spreadSheetUrl).fetchData();
</script>

``` 

```
ResponseData {
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

## Author

[Ajay Bhatt](@ajaybhatt17)

## License

[BSD](./LICENSE)
