from rest_framework import status
from .permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuthToken, LessonProgress, User, UserPreferences
from .serializers import LoginSerializer, UserPreferencesSerializer, UserSerializer


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        nickname = serializer.validated_data['nickname']

        user, _created = User.objects.get_or_create(nickname=nickname)
        token, _ = AuthToken.objects.get_or_create(user=user)
        UserPreferences.objects.get_or_create(user=user)

        return Response(
            {
                'token': str(token.token),
                'user': UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        preferences, _ = UserPreferences.objects.get_or_create(user=request.user)
        return Response(
            {
                'user': UserSerializer(request.user).data,
                'preferences': UserPreferencesSerializer(preferences).data,
            }
        )

    def patch(self, request):
        preferences, _ = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rows = LessonProgress.objects.filter(user=request.user)
        progress = {
            row.lesson_id: {'completed': row.completed, 'score': row.score}
            for row in rows
        }
        return Response(progress)

    def put(self, request, lesson_id):
        completed = bool(request.data.get('completed', False))
        score = int(request.data.get('score', 0))

        row, _ = LessonProgress.objects.update_or_create(
            user=request.user,
            lesson_id=lesson_id,
            defaults={'completed': completed, 'score': score},
        )
        return Response({'completed': row.completed, 'score': row.score})
