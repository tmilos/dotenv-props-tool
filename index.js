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
    console.log("Usage:")
    console.log(" $ dotenv-props-tool command source destination from to [from to ...] [--save]")
    console.log("")
    console.log("Commands:")
    console.log("  e2p  Source is dotenv and destination is properties")
    console.log("  p2e  Source is properties and destination is dotenv")
    console.log("  p2p  Source is properties and destination is properties")
    console.log("  e2e  Source is dotenv and destination is dotenv")
    console.log("")
    console.log("Options:")
    console.log("  --save       Save output to destination rather then print to stdout")
    console.log("  --save file  Save output to file")
    console.log("")
    console.log("Examples:")
    console.log("")
    console.log("  Reads value of MYSQL_USERNAME from the /path/.env and adds that value as spring.datasource.username")
    console.log("  to the /path/file.properties and prints result to stdout:")
    console.log("    $ dotenv-props-tool e2p /path/.env /path/file.properties MYSQL_USERNAME spring.datasource.username")
    console.log("")
    console.log("  Reads value of MYSQL_USERNAME from the /path1/.env and adds that value as DB_USER")
    console.log("  to the /path2/.env and saves the result to stdout:")
    console.log("    $ dotenv-props-tool e2e /path1/.env /path2/.env MYSQL_USERNAME DB_USER --save /path3/.env")
    console.log("")
    process.exit(1)
}


function printError(e) {
    console.log("Error", e)
    process.exit(1)
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

var cmdReaderMap = {
    e2p: [envReader, propertiesReader, propertiesStringify],
    p2e: [propertiesReader, envReader, propertiesStringify],
    p2p: [propertiesReader, propertiesReader, propertiesStringify],
    e2e: [envReader, envReader, propertiesStringify],
}

var command = args._.shift()
if (command.toLowerCase() == 'help') printUsage()

var readers = cmdReaderMap[command]
if (!readers) {
    printError("Invalid command "+command)
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
