# dotenv-props-tool

CLI tool that produces dotenv or properties format by mergin values and adding arbitrary values from given dotenv or properties sources

# Install 

```bash
$ npm install -g dotenv-props-tool
```

# Usage

```bash
 $ dotenv-props-tool command source destination from to [from to ...] [--save]
```

Commands:
* e2p - Source is dotenv and destination is properties
* p2e - Source is properties and destination is dotenv
* p2p - Source is properties and destination is properties
* e2e - Source is dotenv and destination is dotenv

Options:
* --save       Save output to destination rather then print to stdout
* --save file  Save output to file

## Examples

Reads value of MYSQL_USERNAME from the /path/.env and adds that value as spring.datasource.username 
to the /path/file.properties and prints result to stdout:

```bash
$ dotenv-props-tool e2p /path/.env /path/file.properties MYSQL_USERNAME spring.datasource.username
```

Reads value of MYSQL_USERNAME from the /path1/.env and adds that value as DB_USER
to the /path2/.env and saves the result to stdout:

```bash
$ dotenv-props-tool e2e /path1/.env /path2/.env MYSQL_USERNAME DB_USER --save /path3/.env
```
