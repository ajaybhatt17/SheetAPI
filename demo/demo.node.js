var SheetAPI = require('../dist/sheet-api').SheetAPI;

var spreadSheetUrl = "";
if (!spreadSheetUrl) {
  console.log("Please provide url in code");
} else {
  new SheetAPI(spreadSheetUrl).fetchData().then(function (data) {
    console.log(JSON.stringify(data, null, 2));
  });
}
