#!/bin/bash

set -e

npm run build
rsync -avp package* uber:html/plantool/
rsync -avp build uber:html/plantool/
cat <<EOT | ssh uber
cd html/plantool
npm ci --omit dev
supervisorctl restart plantool
EOT
