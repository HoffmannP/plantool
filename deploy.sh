#!/bin/bash

set -e

SERVER=uber
HTML_DIR=html/plantool

# # only once
# cp plantool.ini $SERVER:etc/services.d/plantool.ini
# supervisorctl update
# supervisorctl start
# uberspace web backend set /plantool --http --port 3010

# # sync todos
# rsync -avp todos $SERVER:$HTML_DIR/todos

npm run build
rsync -avp package* $SERVER:$HTML_DIR/
rsync -avp build $SERVER:$HTML_DIR/

cat <<EOT | ssh $SERVER
    cd $HTML_DIR
    npm ci --omit dev
    supervisorctl restart plantool
EOT
