package:
    vsce package
    mv *.vsix ./vsix/

build:
    vsce package
    mv *.vsix ./vsix/

publish:
    vsce publish

npm-doctor:
    npm doctor

npm-outdated:
    npm outdated

npm-update:
    npm update

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