
from rest_framework import generics, status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from ..permissions import IsAdmin, IsCollisionAnalyst, IsUser, CanViewCDM
from ..serializers import (
    UserSerializer, 
    LoginSerializer, 
    CDMSerializer, 
    RefreshTokenSerializer
)
from ..models import User, CDM

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Public access

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if User.objects.filter(email=email).exists():
            return Response(
                {'email': 'A user with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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


# NEW: UserViewSet
class UserViewSet(viewsets.ModelViewSet):
    """
    Allows admins to view/update all users, and normal users to view/update only themselves.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'admin':
            return User.objects.all()
        # Otherwise, normal user sees only themselves
        if self.action == 'list':
            # either show themselves in the list, or deny listing
            return User.objects.filter(id=user.id)
        return User.objects.filter(id=user.id)

    def update(self, request, *args, **kwargs):
        # Non-admin user can only update their own record
        if not (request.user.is_staff or request.user.role == 'admin'):
            if kwargs.get('pk') != str(request.user.id):
                return Response({'detail': 'Not allowed to update other users.'}, status=403)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        # Non-admin user can only partial update their own record
        if not (request.user.is_staff or request.user.role == 'admin'):
            if kwargs.get('pk') != str(request.user.id):
                return Response({'detail': 'Not allowed to update other users.'}, status=403)
        return super().partial_update(request, *args, **kwargs)
