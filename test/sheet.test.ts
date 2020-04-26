import {SheetAPI} from "../lib/sheet-api";

describe("sheet", function() {

    beforeEach(() => {
        jest.setTimeout(500000);
    });

    it("sheet", function (done) {
        var sheet = new SheetAPI("");
        sheet.fetchData().then((data) => {
          console.log(data);
          done();
        }).catch((err) => {
          console.log(err);
          done();
        });
    });

});
