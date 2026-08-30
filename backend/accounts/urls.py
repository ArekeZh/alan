from django.urls import path

from .views import LoginView, MeView, ProgressView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('me/', MeView.as_view(), name='me'),
    path('progress/', ProgressView.as_view(), name='progress'),
    path('progress/<str:lesson_id>/', ProgressView.as_view(), name='progress-lesson'),
]
