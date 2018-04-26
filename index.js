const fs = require("fs");
const path = require("path");
const nconf = require("nconf");
const tinify = require("tinify");
const util = require("util");
const Promise = require("promise");


const keysMap = new Array();
let keyPointer = -1;

const run = async() => {
    nconf.argv()
        .env({
            arraySeparator: ',',
            allowSingleValueArray: true
        })
        .file({ file: "./config.json" })
        .required(["tinifykey", "sourcedir", "distdir"]);

    await checkKeys();
    console.log(JSON.stringify(keysMap));
    if (keysMap.length > 0) {
        const currentPath = path.resolve(nconf.get("sourcedir"));
        const distPath = path.resolve(nconf.get("distdir"));
        const currentKey = pickupKey();
        tinify.key = currentKey;
        console.log("Starting...........................");
        processFolders(distPath, currentPath);
    } else {
        console.error("No valided tinify key, please request a tinify api key from https://tinypng.com/");
    }
    process.exitCode = 0;
}


async function checkKeys() {
    const tinifykey = nconf.get("tinifykey");
    if (util.isArray(tinifykey)) {
        for (let index = 0; index < tinifykey.length; index++) {
            const element = tinifykey[index];
            try {
                await verifyTinifyKey(element);
                keysMap.push(element);
            } catch (error) {
                console.error(error);
            }
        }
    } else {
        try {
            await verifyTinifyKey(tinifykey);
            keysMap.push(tinifykey);
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
                    const result = await processFile(sourceFile, distFile);
                    console.log("ok:" + sourceFile);
                } catch (error) {
                    console.error("false:" + sourceFile + error);
                    process.exitCode = 1;
                }
            }
        } else if (sourceState.isDirectory()) {
            console.warn("处理目录：" + sourceFile);
            const subDist = path.resolve(distPath, files[index]);
            const subSource = path.resolve(currentPath, files[index]);
            processFolders(subDist, subSource);
        }
    }
}

function processFile(sourceFile, targetFile) {
    return new Promise((resolve, reject) => {
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
            .then(function(err) {
                if (err) {
                    if (err instanceof tinify.AccountError) {
                        const newKey = pickupKey();
                        if (newKey) {
                            tinify.key = newKey;
                            return processFile(sourceFile, targetFile);
                        } else {
                            reject("No more valided tinifykey");
                        }
                    } else {
                        reject(err);
                    }
                } else {
                    resolve();
                }
            })

    });
}

function pickupKey() {
    keyPointer++;
    if (keyPointer == keysMap.length) {
        return undefined;
    } else {
        console.info("Using key:" + keysMap[keyPointer]);
        return keysMap[keyPointer];
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
                resolve();
            });

        } catch (error) {
            reject(error);
        }
    });
}

run();