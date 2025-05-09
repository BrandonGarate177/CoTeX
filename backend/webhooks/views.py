from django.shortcuts import render
import hmac, hashlib, json
from django.conf import settings
from django.http import HttpResponse, HttpResponseForbidden
from rest_framework.decorators import api_view
from .models import FileEvent


@api_view(["POST"])
def github_push_hook(request):

    
    # signature = request.headers.get("X-Hub-Signature-256", "")
    # body = request.body
    # mac = hmac.new(
    #     settings.GITHUB_WEBHOOK_SECRET.encode(),
    #     msg=body,
    #     digestmod=hashlib.sha256
    # ).hexdigest()
    # expected = f"sha256={mac}"
    # if not hmac.compare_digest(expected, signature):
    #     return HttpResponseForbidden("Invalid signature")


    body = request.body
    payload = json.loads(body)
    if payload.get("ref") == "refs/heads/main":
        for commit in payload.get("commits", []):
            for new_file in commit.get("added", []):
                print("New file detected:", new_file)
                FileEvent.objects.create(file=new_file)


    return HttpResponse(status=204)
