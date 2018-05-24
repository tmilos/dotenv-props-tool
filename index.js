#!/usr/bin/env node

var fs = require("fs")
var properties = require("properties")
var dotenv = require("dotenv")
var args = require("minimist")(process.argv.slice(2))

if (args.help || args._.length < 1) {
    printUsage()
}

function printUsage(err) {
    if (err) console.log(err)
    console.log("")
    console.log("Mapping usage:")
    console.log("  $ dotenv-props-tool command source destination from to [from to ...] [--save [file]]")
    console.log("")
    console.log("  Commands:")
    console.log("    e2p  Source is dotenv and destination is properties")
    console.log("    p2e  Source is properties and destination is dotenv")
    console.log("    p2p  Source is properties and destination is properties")
    console.log("    e2e  Source is dotenv and destination is dotenv")
    console.log("")
    console.log("  Arguments after command come in pairs, first is the key from the source and second is the key in destination")
    console.log("  If source key does not exist in the source that the key value as provided is written to destination")
    console.log("  wich might be hanndy in setting fixed string literals to the destination")
    console.log("")
    console.log("  Options:")
    console.log("    --save       Save output to destination rather then print to stdout")
    console.log("    --save file  Save output to file")
    console.log("")
    console.log("Readig usage:")
    console.log("   $ dotenv-props-tool command key")
    console.log("")
    console.log("  Commands:")
    console.log("    re  Read dotenv")
    console.log("    rp  Read properties")
    console.log("")
    console.log("Merge usage:")
    console.log("   $ dotenv-props-tool command target ...sources [--save [file]]")
    console.log("")
    console.log("  Commands:")
    console.log("    me  Merge dotenv")
    console.log("    mp  Merge properties")
    console.log("")
    console.log("Examples:")
    console.log("")
    console.log("  Reads value of MYSQL_USERNAME from the /path/.env and adds that value as spring.datasource.username")
    console.log("  to the /path/file.properties and prints result to stdout:")
    console.log("")
    console.log("    $ dotenv-props-tool e2p /path/.env /path/file.properties \\")
    console.log("        MYSQL_USERNAME spring.datasource.username")
    console.log("")
    console.log("  Reads value of MYSQL_USERNAME from the /path1/.env and adds that value as DB_USER")
    console.log("  to the /path2/.env and saves the result to stdout:")
    console.log("")
    console.log("    $ dotenv-props-tool e2e /path1/.env /path2/.env \\")
    console.log("        MYSQL_USERNAME DB_USER \\")
    console.log("        --save /path3/.env")
    console.log("")
    console.log("  Set value of MYSQL_USERNAME to \"john\" in /path/.env:")
    console.log("")
    console.log("    $ dotenv-props-tool e2e - /path/.env \\")
    console.log("        MYSQL_USERNAME john \\")
    console.log("        --save")
    console.log("")
    console.log("  Merge .env and .env.dist and print to stdout:")
    console.log("")
    console.log("    $ dotenv-props-tool me .env .env.dist ")
    console.log("")
    console.log("  Merge .env and .env.dist and save result to .env:")
    console.log("")
    console.log("    $ dotenv-props-tool me .env .env.dist --save")
    console.log("")
    process.exit(1)
}


function printError(e) {
    console.error("Error", e)
    process.exit(1)
}

function fileExists(filename) {
    try {
        return fs.statSync(filename).isFile()
    } catch (e) { }
    return false;
}

function envReader(file, callback) {
    if (!file || file == "-") {
        callback(null, {})
    } else if (!fs.existsSync(file)) {
        printError("Dotenv file "+file+" does not exist")
    } else {
        var env = dotenv.parse(fs.readFileSync(file))
        callback(null, env)
    }
}

function propertiesReader(file, callback) {
    if (!file || file == "-") {
        callback(null, {})
    } else if (!fs.existsSync(file)) {
        printError("Properties file "+file+" does not exist")
    } else {
        properties.parse(file, { path: true }, function (error, props) {
            callback(error, props)
        })
    }
}

function propertiesStringify(obj) {
    return properties.stringify(obj)
}

var cmdMap = {
    help: printUsage,
    e2p: mapping,
    p2e: mapping,
    p2p: mapping,
    e2e: mapping,
    re: reading,
    rp: reading,
    me: merge
}


var command = args._.shift()
if (!cmdMap[command]) {
    printError("Invalid command "+command)
}

cmdMap[command]()

function merge() {
    var cmdReaderMap = {
        'me': [envReader, propertiesStringify],
        'mp': [propertiesReader, propertiesStringify]
    }
    var set = cmdReaderMap[command]
    if (!set) {
        printError("Invalid merge command "+command)
    }
    var reader = set[0]
    var stringify = set[1]

    var sourceFile = args._[0]

    load({})

    function load(merged) {
        merged = merged || {}
        if (args._.length < 1) {
            done(merged)
        } else {
            var file = args._.shift()
            if (file == '-') {
                load(merged)
            } else if (!fileExists(file)) {
                console.error("Warning: Skipping file that does not exist: "+file)
                load(merged)
            } else {
                reader(file, function(err, obj) {
                    if (err) printError(err)
                    merged = Object.assign(obj, merged)
                    load(merged)
                })
            }
        }
    }

    function done(merged) {
        var string = stringify(merged)
        if (typeof args.save == "boolean") {
            fs.writeFileSync(sourceFile, string)
        } else if (typeof args.save == "string") {
            fs.writeFileSync(args.save, string)
        } else {
            console.log(string)
        }        
    }

    // function mergeObjects(sourceObj, destinationObj) {
    //     var merged = Object.assign(sourceObj, destinationObj);

    //     var string = stringify(merged)

    //     if (typeof args.save == "boolean") {
    //         fs.writeFileSync(destinationFile, string)
    //     } else if (typeof args.save == "string") {
    //         fs.writeFileSync(args.save, string)
    //     } else {
    //         console.log(string)
    //     }
    // }

    // function loadDestination(sourceObj) {
    //     if (destinationFile == '' || !fileExists(destinationFile)) {
    //         mergeObjects(sourceObj, {})
    //     } else {
    //         reader(destinationFile, function (err, destinationObj) {
    //             if (err) printError(err)                
    //             mergeObjects(sourceObj, destinationObj)
    //         })
    //     }
    // }

    // if (sourceFile == '-' || !fileExists(sourceFile)) {
    //     loadDestination({})
    // } else {
    //     reader(sourceFile, function (err, sourceObj) {
    //         if (err) printError(err)
    //         loadDestination(sourceObj)
    //     })
    // }
}

function mapping() {
    var cmdReaderMap = {
        e2p: [envReader, propertiesReader, propertiesStringify],
        p2e: [propertiesReader, envReader, propertiesStringify],
        p2p: [propertiesReader, propertiesReader, propertiesStringify],
        e2e: [envReader, envReader, propertiesStringify],
    }
    var readers = cmdReaderMap[command]
    if (!readers) {
        printError("Invalid mapping command "+command)
    }
    var sourceReader = readers[0]
    var destinationReader = readers[1]
    var stringify = readers[2]
    
    var sourceFile = args._.shift()
    var destinationFile = args._.shift()
    
    sourceReader(sourceFile, function(err, sourceObj) {
        if (err) printError(err)
    
        destinationReader(destinationFile, function(err, destinationObj) {
            if (err) printError(err)
    
            while (args._.length > 0) {
                var from = args._.shift()
                var to  = args._.shift()
    
                if (typeof sourceObj[from] != "undefined") {
                    destinationObj[to] = sourceObj[from]
                } else {
                    destinationObj[to] = from
                }
            }
    
            var string = stringify(destinationObj)
    
            if (typeof args.save == "boolean") {
                fs.writeFileSync(destinationFile, string)
            } else if (typeof args.save == "string") {
                fs.writeFileSync(args.save, string)
            } else {
                console.log(string)
            }
        })
    })    
}

function reading() {
    var readMap = {
        re: envReader,
        rp: propertiesReader,
    }

    var reader = readMap[command]
    if (!reader) {
        printError("Invalid reading command "+command)
    }

    var sourceFile = args._.shift()

    reader(sourceFile, function (err, obj) {
        if (err) printError(err)

        var key = args._.shift()
        if (obj.hasOwnProperty(key)) {
            console.log(obj[key])
        }
    })
}
