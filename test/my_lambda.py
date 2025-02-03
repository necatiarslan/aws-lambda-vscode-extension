
def handler(event, context):
    print("Received event: " + str(event))
    print("Received context: " + str(context))
    return {
        'statusCode': 200,
        'body': 'Hello from Lambda!'
    }