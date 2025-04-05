from .grc import app
from asgiref.wsgi import WsgiToAsgi
from flask import Flask

if not isinstance(app, Flask):
    raise TypeError(f"Expected Flask app, got {type(app)} → {repr(app)}")

asgi_app = WsgiToAsgi(app)  # Expose the ASGI handler

# Vercel requires a function named 'handler'
handler = asgi_app