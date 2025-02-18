package:
    vsce package
    mv *.vsix ./vsix/

build:
    vsce package
    mv *.vsix ./vsix/

publish:
    vsce publish

npm-doctor:
    npm doctor # check dependencies
    npm prune # remove unused dependencies
    npx depcheck # check dependencies
    npm-check # check dependencies


npm-outdated:
    npm outdated
    npx npm-check-updates

npm-update:
    npm update

npm-install:
    rm -rf node_modules package-lock.json
    npm install
    npx tsc --noEmit

list-lambda:
    aws --endpoint-url=http://localhost:4566 lambda list-functions

add-lambda:
    cd test/ && zip my_lambda.zip my_lambda.py && cd ../..

    aws --endpoint-url=http://localhost:4566 lambda create-function \
    --function-name my-lambda \
    --runtime python3.9 \
    --zip-file fileb://test/my_lambda.zip \
    --handler my_lambda.handler \
    --role arn:aws:iam::000000000000:role/lambda-role