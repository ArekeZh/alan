from rest_framework import serializers

from .models import Exercise, Lesson, Module, Section


def pick_translation(translations, language):
    by_lang = {item.language: item for item in translations.all()}
    if language in by_lang:
        return by_lang[language]
    if 'en' in by_lang:
        return by_lang['en']
    return next(iter(by_lang.values()), None)


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'type', 'a', 'b', 'code']


class LessonSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    exercises = ExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'description', 'video_url', 'exercises']

    def get_title(self, lesson):
        translation = pick_translation(lesson.translations, self.context['language'])
        return translation.title if translation else lesson.id

    def get_description(self, lesson):
        translation = pick_translation(lesson.translations, self.context['language'])
        return translation.description if translation else ''


class SectionSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    voice_aliases = serializers.SerializerMethodField()
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'title', 'description', 'voice_aliases', 'lessons']

    def get_title(self, section):
        translation = pick_translation(section.translations, self.context['language'])
        return translation.title if translation else section.id

    def get_description(self, section):
        translation = pick_translation(section.translations, self.context['language'])
        return translation.description if translation else ''

    def get_voice_aliases(self, section):
        return [alias.alias for alias in section.voice_aliases.all()]


class ModuleSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'sections']

    def get_title(self, module):
        translation = pick_translation(module.translations, self.context['language'])
        return translation.title if translation else module.id

    def get_description(self, module):
        translation = pick_translation(module.translations, self.context['language'])
        return translation.description if translation else ''
