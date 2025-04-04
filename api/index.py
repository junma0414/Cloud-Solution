from .grc import app
from asgiref.wsgi import WsgiToAsgi

asgi_app = WsgiToAsgi(app)  # Expose the ASGI handler

# Vercel requires a function named 'handler'
handler = asgi_app

'''async def main(request):
    # This makes it work with Vercel's serverless environment
    return await app(request.scope, request.receive, request.send)
    '''