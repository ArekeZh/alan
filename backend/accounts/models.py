import uuid

from django.db import models


class User(models.Model):
    id = models.AutoField(primary_key=True)
    nickname = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'
        managed = False

    def __str__(self):
        return self.nickname


class AuthToken(models.Model):
    token = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='auth_token')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'auth_tokens'
        managed = False


class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='preferences')
    language = models.CharField(max_length=5, default='kk')
    last_opened_module = models.ForeignKey(
        'curriculum.Module',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='last_opened_module_id',
    )

    class Meta:
        db_table = 'user_preferences'
        managed = False


class LessonProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey('curriculum.Lesson', on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    score = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lesson_progress'
        unique_together = [('user', 'lesson')]
        managed = False
