import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator

from .models import *


def index(request):
    page_num = request.GET.get("page", 1)
    posts_paginator = Paginator(Post.objects.all().order_by(
        '-postedAt'), 10)
    return render(request, "network/index.html",
                  {
                      "title": "Home",
                      "page": posts_paginator.get_page(page_num)
                  })


@login_required(login_url='login')
def following(request):
    user = Profile.objects.get(user=request.user)
    page_num = request.GET.get("page", 1)
    posts_paginator = Paginator(Post.objects.filter(
        owner__in=user.following.all()).order_by('-postedAt'), 10)
    return render(request, "network/index.html",
                  {
                      "title": "Folowing",
                      "page": posts_paginator.get_page(page_num)
                  })


@login_required(login_url='login')
def user(request, username):
    user = User.objects.get(username=username)
    page_num = request.GET.get("page", 1)
    posts_paginator = Paginator(Post.objects.filter(
        owner=user).order_by('-postedAt'), 10)
    return render(request, "network/user.html", {
        "page": posts_paginator.get_page(page_num),
        "profile": Profile.objects.get(user=user),
        "user_profile": Profile.objects.get(user=request.user)
    })


@login_required(login_url='login')
def post(request):
    if request.method == "POST":
        post = Post.objects.create(
            owner=request.user,
            content=request.POST["content"])
        post.save()

    return HttpResponseRedirect(reverse("index"))


@csrf_exempt
@login_required(login_url='login')
def edit(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)
    if request.user != post.owner:
        return HttpResponseRedirect(reverse("index"))

    if request.method == "PUT":
        post.content = json.loads(request.body).get("content")
        post.save()
        return HttpResponse(status=204)


@csrf_exempt
@login_required(login_url='login')
def like(request, post_id):
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found."}, status=404)

    if request.method == "PUT":
        if request.user not in post.likedBy.all():
            post.likedBy.add(request.user)
        else:
            post.likedBy.remove(request.user)
        post.save()
        return HttpResponse(status=204)


@csrf_exempt
@login_required(login_url='login')
def follow(request, username):
    try:
        user = User.objects.get(username=username)
    except Post.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    profile = Profile.objects.get(user=request.user)

    if request.method == "PUT":
        if user not in profile.following.all():
            profile.following.add(user)
        else:
            profile.following.remove(user)
        profile.save()
        return HttpResponse(status=204)

    return HttpResponseRedirect(reverse("index"))


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
            profile = Profile.objects.create(user=user)
            profile.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
