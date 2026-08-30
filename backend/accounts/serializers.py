from rest_framework import serializers

from .models import User, UserPreferences


class LoginSerializer(serializers.Serializer):
    nickname = serializers.CharField(max_length=50, trim_whitespace=True)

    def validate_nickname(self, value):
        nickname = value.strip()
        if not nickname:
            raise serializers.ValidationError('Nickname is required.')
        if len(nickname) < 2:
            raise serializers.ValidationError('Nickname must be at least 2 characters.')
        return nickname


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'nickname', 'created_at']


class UserPreferencesSerializer(serializers.ModelSerializer):
    last_opened_module_id = serializers.CharField(allow_null=True, required=False)

    class Meta:
        model = UserPreferences
        fields = ['language', 'last_opened_module_id']
