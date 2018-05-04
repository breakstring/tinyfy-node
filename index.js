const fs = require("fs");
const path = require("path");
const nconf = require("nconf");
const tinify = require("tinify");
const util = require("util");
const Promise = require("promise");

const keysMap = new Map();
let keyIterator;
let failedFileCount = 0;
let successFileCount = 0;
let skipedFileCount = 0;
var currentKey;
const timestamp = (new Date()).valueOf();
const run = async() => {
    nconf.argv()
        .env({
            arraySeparator: ',',
            allowSingleValueArray: true
        })
        .file({ file: "./config.json" })
        .required(["tinifykey", "sourcedir", "distdir"]);

    await checkKeys();
    keyIterator = keysMap.entries();
    const logfolder = path.resolve(".", "log");
    if (fs.existsSync(logfolder) === false) {
        fs.mkdirSync(logfolder);
    }
    if (keysMap.size > 0) {
        console.log("Starting...........................");

        const currentPath = path.resolve(nconf.get("sourcedir"));
        const distPath = path.resolve(nconf.get("distdir"));
        await processFolders(distPath, currentPath);

    } else {
        console.error("No valided tinify key, please request a tinify api key from https://tinypng.com/");
    }
    console.log("Successed file count:" + successFileCount);
    console.log("Failed file count:" + failedFileCount);
    console.log("Skiped file count:" + skipedFileCount);
    process.exitCode = 0;
}


async function checkKeys() {
    const tinifykey = nconf.get("tinifykey");
    if (util.isArray(tinifykey)) {
        for (let index = 0; index < tinifykey.length; index++) {
            const element = tinifykey[index];
            try {
                const kcount = await verifyTinifyKey(element);
                keysMap.set(element, kcount);
            } catch (error) {
                console.error(error);
            }
        }
    } else {
        try {
            const kcount = await verifyTinifyKey(tinifykey);
            keysMap.set(tinifykey, kcount);
        } catch (error) {
            console.error(error);
        }
    }
}

async function processFolders(distPath, currentPath) {
    if (fs.existsSync(distPath) === false) {
        fs.mkdirSync(distPath);
    }

    const files = fs.readdirSync(currentPath);
    for (let index = 0; index < files.length; index++) {
        const sourceFile = path.resolve(currentPath, files[index]);
        const sourceState = fs.statSync(sourceFile);
        if (sourceState.isFile()) {
            const elementExtention = path.extname(sourceFile).toLowerCase();
            if (elementExtention === ".png" || elementExtention === ".jpeg" || elementExtention === ".jpg") {
                const distFile = path.resolve(distPath, files[index]);
                try {
                    if (currentKey === undefined || (keysMap.get(currentKey) >= 500)) {
                        currentKey = pickupNextKey();
                    }

                    if (currentKey === undefined) {
                        console.error("No valided tinify key, please request a tinify api key from https://tinypng.com/");
                        process.exitCode = 0;
                    }
                    tinify.key = currentKey;

                    if (fs.existsSync(distFile)) {
                        console.log(sourceFile + "......skiped.");
                        fs.appendFileSync("./log/" + timestamp + "-skiped.txt", sourceFile + "\n");
                        skipedFileCount++;
                    } else {
                        const result = await processFile(sourceFile, distFile);
                        keysMap.set(currentKey, result);
                        console.log(sourceFile + "......compressed.");
                        fs.appendFileSync("./log/" + timestamp + "-compressed.txt", sourceFile + "\n");
                        successFileCount++;
                    }

                } catch (error) {
                    console.error(sourceFile + "......failed");
                    fs.appendFileSync("./log/" + timestamp + "-failed.txt", sourceFile + "\n");
                    failedFileCount++;
                }
            }
        } else if (sourceState.isDirectory()) {
            const subDist = path.resolve(distPath, files[index]);
            const subSource = path.resolve(currentPath, files[index]);
            await processFolders(subDist, subSource);
        }
    }
}

async function processFile(sourceFile, targetFile) {
    return await new Promise(function(resolve, reject) {
        try {
            const source = tinify.fromFile(sourceFile);
            let tmp = source;
            if (nconf.get("resizemethod")) {
                const resizeParams = {

                };
                switch (nconf.get("resizemethod")) {
                    case "scale_width":
                        resizeParams.method = "scale";
                        resizeParams.width = nconf.get("width");
                        break;
                    case "scale_height":
                        resizeParams.method = "scale";
                        resizeParams.height = nconf.get("height");
                        break;
                    default:
                        resizeParams.method = nconf.get("resizemethod");
                        resizeParams.width = nconf.get("width");
                        resizeParams.height = nconf.get("height");
                        break;
                }
                tmp = source.resize(resizeParams);
            }
            tmp.toFile(targetFile)
                .then((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        var compressionsThisMonth = tinify.compressionCount;
                        resolve(compressionsThisMonth);
                    }
                });
        } catch (error) {
            reject(error);
        }

    });



};


function pickupNextKey() {

    // 如果为空 获取下一个
    const currentKeyItem = keyIterator.next().value;
    if (currentKeyItem) {
        if (currentKeyItem["1"] < 500) {
            return currentKeyItem["0"];
        } else {
            return pickupNextKey();
        }
    } else {
        return undefined;
    }

}

async function verifyTinifyKey(tk) {
    return await new Promise(function(resolve, reject) {
        tinify.key = tk;
        try {
            tinify.validate((err) => {
                if (err) {
                    reject(err)
                }
                var compressionsThisMonth = tinify.compressionCount;
                resolve(compressionsThisMonth);
            });
        } catch (error) {
            reject(error);
        }
    });
}

run();