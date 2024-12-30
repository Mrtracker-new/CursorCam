from flask import Flask
import sys
import traceback
from app import app

@app.errorhandler(500)
def handle_500_error(error):
    return {
        "error": str(error),
        "stacktrace": traceback.format_exc()
    }, 500

@app.route('/debug')
def debug_info():
    return {
        "python_version": sys.version,
        "installed_packages": sys.modules.keys(),
    }

# This is for Vercel serverless deployment
if __name__ == '__main__':
    app.run()