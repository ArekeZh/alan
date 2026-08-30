from django.db import models


class Module(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'modules'
        ordering = ['sort_order', 'id']
        managed = False


class ModuleTranslation(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='translations')
    language = models.CharField(max_length=5)
    title = models.CharField(max_length=255)
    description = models.TextField()

    class Meta:
        db_table = 'module_translations'
        unique_together = [('module', 'language')]
        managed = False


class Section(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='sections')
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'sections'
        ordering = ['sort_order', 'id']
        managed = False


class SectionTranslation(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='translations')
    language = models.CharField(max_length=5)
    title = models.CharField(max_length=255)
    description = models.TextField()

    class Meta:
        db_table = 'section_translations'
        unique_together = [('section', 'language')]
        managed = False


class SectionVoiceAlias(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='voice_aliases')
    alias = models.CharField(max_length=100)

    class Meta:
        db_table = 'section_voice_aliases'
        managed = False


class Lesson(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='lessons')
    sort_order = models.IntegerField(default=0)
    video_url = models.CharField(max_length=500, null=True, blank=True)

    class Meta:
        db_table = 'lessons'
        ordering = ['sort_order', 'id']
        managed = False


class LessonTranslation(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='translations')
    language = models.CharField(max_length=5)
    title = models.CharField(max_length=255)
    description = models.TextField()

    class Meta:
        db_table = 'lesson_translations'
        unique_together = [('lesson', 'language')]
        managed = False


class Exercise(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='exercises')
    type = models.CharField(max_length=20)
    a = models.IntegerField()
    b = models.IntegerField()
    code = models.TextField(null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'exercises'
        ordering = ['sort_order', 'id']
        managed = False
