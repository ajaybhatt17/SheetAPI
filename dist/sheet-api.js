"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var cheerio = require("cheerio");
function directFetchWebPage(url) {
    if (!url) {
        throw new Error("Provide valid url");
    }
    return axios_1.default.request({
        url: url,
        method: 'GET',
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.87 Safari/537.36",
            "Host": "docs.google.com"
        }
    }).then(function (response) {
        return response.data;
    });
}
function convertObjToQueryStr(obj) {
    var s = "";
    for (var key in obj) {
        if (s != "") {
            s += "&";
        }
        s += (key + "=" + encodeURIComponent(obj[key]));
    }
    return s;
}
function fetchAPISheetData(docId, chunkIds, snapshotAt, smv) {
    if (smv === void 0) { smv = 69; }
    if (!docId) {
        throw new Error("Provide valid docId");
    }
    var rowsPath = "https://docs.google.com/spreadsheets/d/" + docId + "/streamrows?id=" + docId + "&smv=" + smv;
    var formData = {
        chunks: JSON.stringify(chunkIds),
        snapshotAt: snapshotAt,
        firstChunkHighWatermark: 0,
        cutoffBytesReturned: 5242880,
        cutoffRowsReturned: -1
    };
    return axios_1.default.request({
        url: rowsPath,
        method: "POST",
        data: convertObjToQueryStr(formData),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(function (response) {
        return response.data;
    });
}
function getScriptFromData(data) {
    var $ = cheerio.load(data);
    var d = $('script[type="text/javascript"]');
    var output = [];
    var i = 0, fetch = true;
    while (d && fetch) {
        var item = d[i + ''];
        if (item) {
            if (item.children && item.children.length > 0 && item.children[0].data) {
                output.push(item.children[0].data);
            }
            i++;
        }
        else {
            fetch = false;
        }
    }
    return output.length > 0 ? output[output.length - 1] : "";
}
function getVariableValue(str, variableKey) {
    var regex = new RegExp("var " + variableKey + " = ([^;]+);", 'gm');
    var m = regex.exec(str);
    return m && m.length > 0 ? m[1] : null;
}
var Snapshot = /** @class */ (function () {
    function Snapshot(snapData, defaultBlankValue) {
        this.data = this._parseSnapshot(snapData, defaultBlankValue);
    }
    Snapshot.prototype._parseSnapshot = function (snapshot, defaultBlankValue) {
        var overallData = null, maxCols = 0, maxRows = 0;
        var nonBlankD = [];
        for (var _i = 0, snapshot_1 = snapshot; _i < snapshot_1.length; _i++) {
            var p = snapshot_1[_i];
            if (p[0] && p[1] && p[1][p[1].length - 1]) {
                var refD = p[1][p[1].length - 1];
                var cellData = [];
                if (refD && Array.isArray(refD)) {
                    maxCols = p[1][1][5];
                    maxRows = p[1][1][3];
                    var colCount = 0, rowCount = 0, rowData = [];
                    for (var j = 0; j < refD.length; j++) {
                        var k = refD[j];
                        var cD = void 0;
                        if (typeof k === "object" && Object.keys(k).length > 0) {
                            nonBlankD.push(k);
                        }
                        if (!Array.isArray(k)) {
                            if (k['25']) {
                                k = nonBlankD[k['25']];
                            }
                            // console.log('index', j, 'value', k);
                            cD = (k['3'] !== undefined && Array.isArray(k['3'])) ? k['3'][2] :
                                ((k['3'] !== undefined && !Array.isArray(k['3'])) ? k['3']['4'] === 1 : defaultBlankValue);
                            rowData.push(cD);
                            colCount++;
                            if (colCount >= maxCols) {
                                rowCount++;
                                cellData.push(rowData);
                                rowData = [];
                                colCount = 0;
                            }
                        }
                        else {
                            if (cellData.length === 0) {
                                for (var i = 0; i < maxRows; i++) {
                                    cellData.push(Array(maxCols).fill(defaultBlankValue));
                                }
                            }
                            if (k[3]['25']) {
                                k[3]['3'] = nonBlankD[parseInt(k[3]['25'])][3]['3'];
                            }
                            // console.log('index', j, 'value1', k);
                            cD = (k[3]['3'] !== undefined && Array.isArray(k[3]['3'])) ? k[3]['3'][2] :
                                ((k[3]['3'] !== undefined && !Array.isArray(k[3]['3'])) ? k[3]['3']['4'] === 1 : defaultBlankValue);
                            cellData[k[1]][k[2]] = cD;
                        }
                    }
                    overallData = cellData;
                }
            }
        }
        return { range: { rows: maxRows, cols: maxCols }, values: overallData };
    };
    return Snapshot;
}());
var SheetAPI = /** @class */ (function () {
    function SheetAPI(baseUrl) {
        this.baseUrl = baseUrl;
        this.metadata = {};
        this.views = [];
    }
    SheetAPI.prototype.fetchData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, allPromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, directFetchWebPage(this.baseUrl)];
                    case 1:
                        data = _a.sent();
                        try {
                            this._parseSheetConfig(data);
                        }
                        catch (e) {
                            throw new Error("Not able to fetch data for provided link");
                        }
                        allPromises = [];
                        this.views.forEach(function (e) {
                            allPromises.push(_this._fetchSheetDataOneByOne(_this.metadata.cosmoId, _this.metadata.revision, e));
                        });
                        return [4 /*yield*/, Promise.all(allPromises)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, {
                                docName: this.metadata.docName,
                                version: this.metadata.revision,
                                sheets: this.views.map(function (e) { return __assign(__assign({}, e.data), { name: e.name }); })
                            }];
                }
            });
        });
    };
    SheetAPI.prototype._parseSheetConfig = function (data) {
        var setScript = getScriptFromData(data);
        var mergedConfig = JSON.parse(getVariableValue(setScript, 'mergedConfig'));
        if (!mergedConfig) {
            throw new Error("Not able to config data");
        }
        this.metadata.cosmoId = mergedConfig.appConfig.cosmoId;
        this.metadata.docName = mergedConfig.appConfig.docName;
        this.metadata.editable = mergedConfig.appConfig.editable;
        this.metadata.pathPrefix = mergedConfig.appConfig.pathPrefix;
        var settings = JSON.parse(getVariableValue(setScript, 'bootstrapData'));
        this.metadata.revision = settings.changes.revision;
        this.metadata.modelVersion = settings.changes.modelVersion;
        this.metadata.firstchunklength = settings.changes.firstchunklength;
        this.metadata.topsnapshotlength = settings.changes.topsnapshotlength;
        this.views = this._extractSheetsInfo(settings);
    };
    SheetAPI.prototype._extractSheetsInfo = function (settings) {
        if (!settings || !settings.changes || !settings.changes.topsnapshot)
            return [];
        var output = [];
        var sets = {};
        for (var _i = 0, _a = settings.changes.topsnapshot; _i < _a.length; _i++) {
            var k = _a[_i];
            if (!sets[k[0]])
                sets[k[0]] = [];
            sets[k[0]].push(JSON.parse(k[1]));
        }
        for (var _b = 0, _c = sets[Object.keys(sets)[0]]; _b < _c.length; _b++) {
            var arr = _c[_b];
            var v = {};
            v.order = arr[0];
            v.gid = arr[2];
            v.name = arr[3][0]['1'][0][2];
            v.rows_limit = arr[4];
            v.cols_limit = arr[5];
            output.push(v);
        }
        return output;
    };
    SheetAPI.prototype._fetchSheetDataOneByOne = function (docId, revision, e) {
        var _this = this;
        return fetchAPISheetData(docId, [e.gid], revision)
            .then(function (data) {
            e.data = _this._parseSheetDataRowWise(_this._correctData(data));
        });
    };
    SheetAPI.prototype._correctData = function (str) {
        str = str.replace(/}[0-9]+&{/gm, '},{');
        str = str.replace(/\)]}'\n0&[0-9]+&/gm, '[');
        return str + ']';
    };
    SheetAPI.prototype._parseSheetDataRowWise = function (data, defaultBlankValue) {
        if (defaultBlankValue === void 0) { defaultBlankValue = null; }
        var ref;
        try {
            ref = JSON.parse(data);
        }
        catch (e) {
            throw new Error("Not able to parse provided data");
        }
        var overallD = {};
        for (var _i = 0, ref_1 = ref; _i < ref_1.length; _i++) {
            var item = ref_1[_i];
            overallD[item['gridRange'][1]] = __spreadArrays((overallD[item['gridRange'][1]] || []), item['snapshot']);
        }
        // const output: any[] = [];
        // for(const key of Object.keys(overallD)) {
        //     const item = overallD[key];
        //     output.push(new Snapshot(item, defaultBlankValue).data);
        // }
        return new Snapshot(overallD[Object.keys(overallD)[0]], defaultBlankValue).data;
    };
    return SheetAPI;
}());
exports.SheetAPI = SheetAPI;
// @ts-ignore
if (typeof window != "undefined") {
    // @ts-ignore
    window.SheetAPI = SheetAPI;
}
