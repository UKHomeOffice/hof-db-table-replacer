# hof-lookup-replacer

A Node.js script for replacing db lookup tables as a scheduled job configurable to different HOF form services.

The script retrieves a CSV formatted file from a given location, validates against given rules and then replaces a lookup table using the CSV rows. On success or failure the script will send appropriate notification messages.

This service uses either [pg-promise](https://vitaly-t.github.io/pg-promise/index.html) or [knex.js](https://knexjs.org/) to handle db connection and query building. You can configure the client and model used using environment variables.

## Script steps

1. Scheduled job runs with service specific environment.
2. Connect to database and retrieve the latest uploaded data's S3/file-vault URL from an SQL database.
3. Authenticate with the service's file-vault.
4. Use the data URL to bring the CSV file data into the application.
5. Validate the CSV rows against rules given for the service. Log, note and remove erroring rows.
6. Replace the SQL db's lookup table with the validated rows from CSV.
7. Prepare a and send a notification email of pass or fail including erroring rows noted in validation.
8. Close connection. Job complete.

## Configuration

The `config.js` file turns most of the service's environment variables into an exported object that can be referred to throughout the app. Some defaults are configured here.

### Database

hof-lookup-replacer aims to be database agnostic - the main script should run given different database models. The model chosen can be configured by the `DB_MODEL` environment variable being one of the filenames of the models provided (e.g. `DB_MODEL=knex-postgres-model`). The default is pgp-model which uses pg-promise.

If you are adding a new database client you should add the package with `yarn add <package>`, add a db connection file in /db and adapt one of the existing models with methods useable by that client in /db/models. From there `run.js` should pick up and connect to the correct client.

In the /db folder, files will provide an exported connection to a database client with support for local, test and remote configuration.

The /db/models folder contains models for available clients providing exported classes with query methods for the given clients.

### Service

The /services folder contains service specific configuration that is difficult to inject as environment variables - such as validation rules. Setting the `SERVICE_NAME` environment variable to one of the service name subfolders in /services should allow the app to run with that folder's specific configurations.

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
SERVICE_NAME # Shortname for the service to configure validations etc
TARGET_TABLE # Target lookup table name to be replaced
SOURCE_FILE_TABLE # DB table name where this service can get the CSV file's URL from
KEYCLOAK_SECRET # Keycloak secrets to authenticate for retrieval from S3 (assuming this is the CSV's persistent location)
KEYCLOAK_CLIENT_ID
KEYCLOAK_USERNAME
KEYCLOAK_PASSWORD
KEYCLOAK_TOKEN_URL
CASEWORKER_EMAIL # Email address to send pass/fail notifications to
NOTIFY_KEY # API key for a GovUK Notify service
NOTIFY_TEMPLATE_KEYS # References for specific GovUK Notify templates you would want to send e.g. pass/fail cases
SNYK_TOKEN # Optional if you want to run scans on node modules locally
DB_CLIENT # Defaults to pgp (using the pg-promise library). Set this value if you want to use a different client from /db e.g. knex
DB_MODEL # Defaults to pgp-model. Set this value to use a different database model e.g. knex-postgres-model.
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
