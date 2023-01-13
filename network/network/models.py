from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Profile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    following = models.ManyToManyField(
        User, blank=True, related_name="followers")


class Post(models.Model):
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField()
    likedBy = models.ManyToManyField(
        User, blank=True, related_name="likedPosts")
    postedAt = models.DateTimeField(auto_now_add=True)
