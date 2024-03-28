# hof-lookup-replacer

## Contents

1. [Introduction](#introduction)
2. [Script steps](#script-steps)
3. [Configuration](#configuration)
4. [Build and run](#build-and-run)
5. [Testing](#testing)

## Introduction

A Node.js script for replacing database lookup tables as a scheduled job configurable to different HOF form services.

The script retrieves a CSV formatted file from a given location, validates against given rules and then replaces a lookup table using the CSV rows. On success or failure the script will send appropriate notification messages.

This script only makes certain assumptions about the service it will update the RDS lookup table for:

1. That the service runs an RDS (e.g PostgreSQL database).
2. That the service's RDS has a named table with at least columns 'id', 'url' and 'created_at' where http(s) links to CSV data can be fetched from.
3. That the service's RDS has an existing, named table with the appropriate columns that can be dropped and replaced completely by a copy containing the latest CSV data.
4. That the script will need to autheticate with Keycloak and provide a token with its incoming data request, or the data source requires no authentication. See [Keycloak](#keycloak).

This repository currently offers either [pg-promise](https://vitaly-t.github.io/pg-promise/index.html) or [knex.js](https://knexjs.org/) to handle db connection and query building. You can configure the client and model used using environment variables.

Some [documentation of the high level design process for the lookup replacer](https://collaboration.homeoffice.gov.uk/display/DSASS/High+Level+Ellaboration+-+IMB-68) can be found in the HOF Confluence.

## Script steps

1. Scheduled job runs with service specific environment.
2. Connect and retrieve the latest uploaded file-vault URL from a SQL database.
3. Authenticate with the service's Keycloak realm and receive a bearer token to add to the request to file-vault for the CSV data.
4. Make an API Request to file-vault and bring the CSV data into this application.
5. Validate the CSV rows against rules given for the service. Remove any invalid rows before insertion and store them so they can be noted in the stakeholder confirmation email.
6. Replace the service's RDS lookup table with the validated rows from CSV.
7. Prepare and send a notification email. Confirm success or failure of the job. Add or attach a list of any invalid rows detected during validation.
8. Close connection. Job complete.

## Configuration

The `config.js` file transforms environment variables into an exported object that can be referred to throughout the app.

### Database

hof-lookup-replacer aims to be database agnostic - the main script can be passed different database clients and models. The client can be selected by setting the `DB_CLIENT` environment variable (e.g. `DB_CLIENT=pgp`). The model chosen should be can be configured by the `DB_MODEL` environment variable (e.g. `DB_MODEL=pgp-model`). Client options can be found in the /db folder and model options in the /db/models folder. Please choose a model that is prefixed with the client you have selected.

If you are adding a new database client you should add the package with `yarn add <package>`, add a db connection file in /db and adapt one of the existing models with methods useable by that client in /db/models. From there `run.js` should pick up and connect to the correct client.

In the /db folder, files will provide an exported connection to a database client with support for local, test and remote configuration.

The /db/models folder contains models for available clients providing exported classes with query methods for the given clients.

### Service

The /services folder contains service specific configuration. Setting the `SERVICE_NAME` environment variable correctly for your intended service should allow the app to run with that service's specific configurations.

If creating a new service you can add a new folder within /services named as the shortname for your service (e.g. asc, ima, acq). Within that folder add a `config.js` as follows:

```javascript
module.exports = {
  targetColumns: ['array', 'of', 'strings'], // REQUIRED
  parseHeadings: ['array', 'of', 'strings'], // OPTIONAL
  validateRecord: function (record) {return { valid: true }} // OPTIONAL
};

```

`targetColumns` is a required property of this export for each service as it defines an array of database column names the script will target to add CSV data to. If using `parseHeadings` then the target column names should be the same as the equivalent parsed object key names. If not using `parseHeadings` the target column names should be the same as the CSV column header names.

`parseHeadings` is an optional property of this export for each service. During parsing the items in `parseHeadings` will replace the CSV column headings as keys for each record object. The order of items in `parseHeadings` should be the same as the order that headings appear in the CSV. That way during parsing the data is assigned to the correct property. If used, the length of `parseHeadings` should be the same as the number of column headings with a replacement for each heading. These can be the same as the original headings if desired.

If there are columns in the CSV that do not need to be inserted to the database, include the column in `parseHeadings` (if used), this will ensure that CSV data is parsed into the correct object properties. Whether using `parseHeadings` or not you can remove additional properties from parsed records before insertion in a `validateRecord` function. Ensure that `targetColumns` only includes database columns you want to insert, and that record objects have a key/value for each of those columns.

If the `validateRecord` property is defined as a function with one `record` argument the script will use that function to validate records row by row. The function must return at least an object with a bool type `valid` property. e.g. `{ valid: true }`. Records returning `{ valid: true }` from this function are added to the `records` array, those that return `{ valid: false }` are added to the `invalidRecords` array. Check existing implementation for examples.

If no `validateRecord` propery is defined then the script will add all CSV rows to `records` without validation.

### Keycloak

This script must authenticate with the service's Keycloak realm and receive a bearer token to allow authorised requests to the service's file-vault. Keycloak auth secrets are configured as environment variables.

It is possible to use a data source that is not protected by Keycloak as long as it either a) supports the same auth protocols as Keycloak in which case environment variables can be substituted like for like, or b) if your data source does not require auth at all. In this case if no Keycloak token URL is provided to the environment the script will not attempt to auth and will pass `undefined` into the Axios data request config - meaning no auth headers are added to the outgoing request to the data URL.

## Build and run

The purpose of this service is to be run as a scheduled job from the main service that requires the lookup table replacing. The new data in CSV format will already have been uploaded to a persistent (e.g. S3) location via a the main form.

### Requirements to run locally

* Node.js (18.19.0 or above 18 LTS)
* PostgreSQL (14 or above)
* Global yarn (`npm install --global yarn`)
* This repository cloned to your local machine
* Environment variables set in a `.env` file as below

### Environment variables

```bash
NODE_ENV # Set to 'local' for local development and testing
SERVICE_NAME # Shortname for the service to configure validations e.g. ima
TARGET_TABLE # The name of the table in the service RDS where the URLs for uploaded CSV data are stored e.g. csv_urls
SOURCE_FILE_TABLE # The name of the target table to replace with the newer CSV data. e.g. cepr_lookup
KEYCLOAK_SECRET # Keycloak secrets to authenticate for retrieval from S3 via file-vault (assuming this is the CSV's persistent location)
KEYCLOAK_CLIENT_ID
KEYCLOAK_USERNAME
KEYCLOAK_PASSWORD
KEYCLOAK_TOKEN_URL
CASEWORKER_EMAIL # Email address to send pass/fail notifications to
NOTIFY_KEY # API key for a GovUK Notify service
NOTIFY_TEMPLATE_PASS # Template reference ID for GovUK Notify template for success case
NOTIFY_TEMPLATE_FAIL # Template reference ID for GovUK Notify template for failure case
DB_CLIENT # Choose a DB client to use to interact with the database e.g. 'pgp' or 'knex'. Options are in the /db folder
DB_MODEL # Choose a DB model appropriate to the client you selected. Options are in the /db/models folder
```

* `yarn install` to download node modules
* `yarn start:dev` to run the app in dev mode (allowing variables from `.env` file)

`run.js` is the entrypoint to the app.

Note that PGP pools remain open for 10 seconds and Knex pools remain open for 30 seconds by default after use unless directly terminated.

## Testing

Some test scripts are provided to run unit tests, linting and so on

* `yarn test:lint`: Code linting against HOF eslint config
* `yarn test:unit`: Unit tests
* `yarn test:integration`: Integration tests
* `yarn test:snyk`: Module security scan with Snyk (requires API key)
* `yarn test:all`: Runs both unit and integration tests.
