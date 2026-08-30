from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import AuthToken


class TokenAuthentication(BaseAuthentication):
    keyword = 'Token'

    def authenticate(self, request):
        header = request.headers.get('Authorization', '')
        if not header.startswith(f'{self.keyword} '):
            return None

        raw_token = header[len(self.keyword) + 1 :].strip()
        if not raw_token:
            return None

        try:
            token = AuthToken.objects.select_related('user').get(token=raw_token)
        except (AuthToken.DoesNotExist, ValueError):
            raise AuthenticationFailed('Invalid token.') from None

        return token.user, token
