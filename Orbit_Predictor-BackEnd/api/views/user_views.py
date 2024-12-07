# api/views.py

from rest_framework import generics, status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .permissions import IsAdmin, IsCollisionAnalyst, IsUser, CanViewCDM
from .serializers import UserSerializer, LoginSerializer, CDMSerializer, RefreshTokenSerializer
from .models import User, CDM
from ratelimit.decorators import ratelimit


class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Public access

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'created_at': user.created_at
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]  # Public access

    @ratelimit(key='ip', rate='5/m', block=True)
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(generics.GenericAPIView):
    serializer_class = RefreshTokenSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CDMViewSet(viewsets.ModelViewSet):
    serializer_class = CDMSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]  # Only admins can create, update, or delete
        elif self.action in ['list', 'retrieve']:
            permission_classes = [CanViewCDM]  # Custom permission for viewing
        else:
            permission_classes = [permissions.IsAuthenticated]  # Default
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'collision_analyst']:
            return CDM.objects.all()
        elif user.role == 'user':
            return CDM.objects.filter(privacy=True)
        return CDM.objects.none()
