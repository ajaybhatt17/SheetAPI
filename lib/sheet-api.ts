import axios from "axios";
import * as cheerio from "cheerio";

interface SheetView {
  gid: string;
  name: string;
  order: number;
  rows_limit: number;
  cols_limit: number;
  data: any;
}

interface SheetMetadata {
  cosmoId: string;
  editable: boolean;
  docName: string;
  pathPrefix: string;
  revision: number;
  modelVersion: number;
  firstchunklength: number;
  topsnapshotlength: number
}

interface SnapshotData {
  range: {
    rows: number;
    cols: number;
  }
  values: any[]
}

function directFetchWebPage(url: string) {
    return axios.request({
        url: url,
        method: 'GET',
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.87 Safari/537.36",
          "Host": "docs.google.com"
        }
    }).then((response) => {
      return response.data;
    });
}

function convertObjToQueryStr(obj: any) {
  var s = "";
  for (var key in obj) {
    if (s != "") {
      s += "&";
    }
    s += (key + "=" + encodeURIComponent(obj[key]));
  }
  return s;
}

function fetchAPISheetData(docId: string, chunkIds: string[], snapshotAt: number, smv: number = 69) {
    var rowsPath = `https://docs.google.com/spreadsheets/d/${docId}/streamrows?id=${docId}&smv=${smv}`;
    var formData = {
      chunks: JSON.stringify(chunkIds),
      snapshotAt: snapshotAt,
      firstChunkHighWatermark: 0,
      cutoffBytesReturned: 5242880,
      cutoffRowsReturned: -1
    };
    return axios.request({
      url: rowsPath,
      method: "POST",
      data: convertObjToQueryStr(formData),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }).then((response) => {
      return response.data;
    });
}

function getScriptFromData(data: string) {
    const $: any = cheerio.load(data);
    const d: any = $('script[type="text/javascript"]');
    const output = [];
    let i = 0, fetch=true;
    while (d && fetch) {
      var item = d[i+''];
      if (item) {
        if (item.children && item.children.length>0 && item.children[0].data) {
          output.push(item.children[0].data);
        }
        i++;
      } else {
        fetch = false;
      }
    }
    return output.length>0 ? output[output.length-1] : "";
}

function getVariableValue(str: string, variableKey: string) {
    let regex = new RegExp(`var ${variableKey} = ([^;]+);`, 'gm');
    let m = regex.exec(str);
    return m && m.length>0 ? m[1] : null;
}


class Snapshot {

  data: SnapshotData;

  constructor(snapData: any, defaultBlankValue: any) {
    this.data = this._parseSnapshot(snapData, defaultBlankValue);
  }

  private _parseSnapshot(snapshot: any, defaultBlankValue: any): any {
    var overallData = null, maxCols = 0, maxRows = 0;
    var nonBlankD: any[] = [];
    for (const p of snapshot) {
      if (p[0] && p[1] && p[1][p[1].length-1]) {
        let refD = p[1][p[1].length-1];
        let cellData = [];
        if (refD && Array.isArray(refD)) {
          maxCols = p[1][1][5];
          maxRows = p[1][1][3];
          let colCount = 0, rowCount = 0, rowData = [];
          for (let j=0; j<refD.length; j++) {
            let k: any = refD[j];
            let cD;
            if (typeof k === "object" && Object.keys(k).length>0) {
              nonBlankD.push(k);
            }
            if (!Array.isArray(k)) {

              if (k['25']) {
                k = nonBlankD[k['25']];
              }

              // console.log('index', j, 'value', k);

              cD = (k['3']!==undefined && Array.isArray(k['3'])) ? k['3'][2] :
                ((k['3']!==undefined && !Array.isArray(k['3'])) ? k['3']['4']===1 : defaultBlankValue);
              rowData.push(cD);
              colCount++;
              if (colCount>=maxCols) {
                rowCount++;
                cellData.push(rowData);
                rowData = [];
                colCount = 0;
              }
            } else {
              if (cellData.length===0) {
                for (var i=0; i<maxRows; i++) {
                  cellData.push(Array(maxCols).fill(defaultBlankValue));
                }
              }

              if (k[3]['25']) {
                k[3]['3'] = nonBlankD[parseInt(k[3]['25'])][3]['3'];
              }

              // console.log('index', j, 'value1', k);

              cD = (k[3]['3']!==undefined && Array.isArray(k[3]['3'])) ? k[3]['3'][2] :
                ((k[3]['3']!==undefined && !Array.isArray(k[3]['3'])) ? k[3]['3']['4']===1 : defaultBlankValue);

              cellData[k[1]][k[2]] = cD;
            }

          }
          overallData = cellData;
        }
      }
    }
    return {range: {rows: maxRows, cols: maxCols}, values: overallData};
  }


}


export class SheetAPI {

    views: SheetView[];
    baseUrl: string;
    metadata: SheetMetadata;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.metadata = {} as SheetMetadata;
        this.views = [];
    }

    async fetchData() {
      var data = await directFetchWebPage(this.baseUrl);
      try {
        this._parseSheetConfig(data);
      } catch (e) {
        throw new Error("Not able to fetch data for provided link");
      }
      var allPromises: any[] = [];
      this.views.forEach((e) => {
        allPromises.push(this._fetchSheetDataOneByOne(this.metadata.cosmoId, this.metadata.revision, e));
      });
      await Promise.all(allPromises);
      return {
        docName: this.metadata.docName,
        version: this.metadata.revision,
        sheets: this.views.map((e: SheetView) => { return {...e.data, name: e.name} })
      };
    }

    _parseSheetConfig(data: any) {
      const setScript = getScriptFromData(data);
      const mergedConfig = JSON.parse(getVariableValue(setScript, 'mergedConfig'));
      if (!mergedConfig) {
        throw new Error("Not able to config data");
      }
      this.metadata.cosmoId = mergedConfig.appConfig.cosmoId;
      this.metadata.docName = mergedConfig.appConfig.docName;
      this.metadata.editable = mergedConfig.appConfig.editable;
      this.metadata.pathPrefix = mergedConfig.appConfig.pathPrefix;
      const settings = JSON.parse(getVariableValue(setScript, 'bootstrapData'));
      this.metadata.revision = settings.changes.revision;
      this.metadata.modelVersion = settings.changes.modelVersion;
      this.metadata.firstchunklength = settings.changes.firstchunklength;
      this.metadata.topsnapshotlength = settings.changes.topsnapshotlength;
      this.views = this._extractSheetsInfo(settings);
    }

    _extractSheetsInfo(settings: any) {
        if (!settings || !settings.changes || !settings.changes.topsnapshot) return [];
      const output = [];
        var sets: any = {};
        for(const k of settings.changes.topsnapshot) {
          if (!sets[k[0]]) sets[k[0]] = [];
          sets[k[0]].push(JSON.parse(k[1]));
        }
        for (const arr of sets[Object.keys(sets)[0]]) {
            const v = {} as SheetView;
            v.order = arr[0];
            v.gid = arr[2];
            v.name = arr[3][0]['1'][0][2];
            v.rows_limit = arr[4];
            v.cols_limit = arr[5];
            output.push(v);
        }
        return output;
    }

    _fetchSheetDataOneByOne(docId: string, revision: number, e: SheetView) {
        return fetchAPISheetData(docId, [e.gid], revision)
                    .then((data) => {
                        e.data = this._parseSheetDataRowWise(this._correctData(data));
                    });
    }

    private _correctData(str: any) {
        str = str.replace(/}[0-9]+&{/gm, '},{');
        str = str.replace(/\)]}'\n0&[0-9]+&/gm, '[');
        return str+']';
    }

    private _parseSheetDataRowWise(data: any, defaultBlankValue: any = null) {
        var ref;
        try {
            ref = JSON.parse(data);
        } catch (e) {
            throw new Error("Not able to parse provided data");
        }
        var overallD: any = {};
        for (const item of ref) {
            overallD[item['gridRange'][1]] = [...(overallD[item['gridRange'][1]] || []), ...item['snapshot']];
        }
        // const output: any[] = [];
        // for(const key of Object.keys(overallD)) {
        //     const item = overallD[key];
        //     output.push(new Snapshot(item, defaultBlankValue).data);
        // }
        return new Snapshot(overallD[Object.keys(overallD)[0]], defaultBlankValue).data;
    }

}

// @ts-ignore
if (typeof window != "undefined") {
  // @ts-ignore
  window.SheetAPI = SheetAPI;
}

