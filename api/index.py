from grc import handler
from asgiref.wsgi import WsgiToAsgi

app = handler  # Expose the ASGI handler

async def main(request):
    # This makes it work with Vercel's serverless environment
    return await app(request.scope, request.receive, request.send)