from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Lesson, Module, Section
from .serializers import LessonSerializer, ModuleSerializer, SectionSerializer

SUPPORTED_LANGUAGES = {'kk', 'ru', 'en'}


def get_language(request):
    language = request.query_params.get('lang', 'kk')
    if language not in SUPPORTED_LANGUAGES:
        return 'kk'
    return language


class ContentView(APIView):
    def get(self, request):
        language = get_language(request)
        modules = Module.objects.prefetch_related(
            'translations',
            'sections__translations',
            'sections__voice_aliases',
            'sections__lessons__translations',
            'sections__lessons__exercises',
        )
        serializer = ModuleSerializer(modules, many=True, context={'language': language})
        return Response({'modules': serializer.data})


class ModuleDetailView(APIView):
    def get(self, request, module_id):
        language = get_language(request)
        try:
            module = Module.objects.prefetch_related(
                'translations',
                'sections__translations',
                'sections__voice_aliases',
                'sections__lessons__translations',
                'sections__lessons__exercises',
            ).get(pk=module_id)
        except Module.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        serializer = ModuleSerializer(module, context={'language': language})
        return Response(serializer.data)


class SectionDetailView(APIView):
    def get(self, request, section_id):
        language = get_language(request)
        try:
            section = Section.objects.prefetch_related(
                'translations',
                'voice_aliases',
                'lessons__translations',
                'lessons__exercises',
            ).get(pk=section_id)
        except Section.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        serializer = SectionSerializer(section, context={'language': language})
        return Response(serializer.data)


class LessonDetailView(APIView):
    def get(self, request, lesson_id):
        language = get_language(request)
        try:
            lesson = Lesson.objects.prefetch_related(
                'translations',
                'exercises',
            ).get(pk=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)

        serializer = LessonSerializer(lesson, context={'language': language})
        return Response(serializer.data)
