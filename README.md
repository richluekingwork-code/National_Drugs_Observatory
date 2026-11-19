# National_Drugs_Observatory

## Configuration

Set the `DJANGO_SECRET_KEY` environment variable to a unique secret before starting Django. Do not commit the secret to source control.

For deployment, set `DJANGO_ALLOWED_HOSTS` to a comma-separated list of the site's hostnames. It defaults to the Sevalla hostname and local development hosts. `DJANGO_DEBUG` defaults to `False`; set it to `True` only for local debugging.

For PostgreSQL deployments, set `DATABASE_URL` to the database connection URL as a protected environment variable in Sevalla. When `DATABASE_URL` is unset, Django uses the local SQLite database. The Procfile applies Django migrations at service startup.
