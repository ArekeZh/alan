from django.urls import path

from .views import ContentView, LessonDetailView, ModuleDetailView, SectionDetailView

urlpatterns = [
    path('content/', ContentView.as_view(), name='content'),
    path('modules/<str:module_id>/', ModuleDetailView.as_view(), name='module-detail'),
    path('sections/<str:section_id>/', SectionDetailView.as_view(), name='section-detail'),
    path('lessons/<str:lesson_id>/', LessonDetailView.as_view(), name='lesson-detail'),
]
