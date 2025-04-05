from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    CollisionListCreateView, CollisionDetailView, CollisionAvoidanceView, UserViewSet,
    ProbabilityCalcListCreateView, ProbabilityCalcDetailView, CDMSerializerListCreateView, 
    CDMCalcDetailView, RegisterView, LoginView, CDMViewSet, RefreshTokenView, CDMCreateView, 
    OrganizationViewSet, CollisionTradespaceView, CollisionLinearTradespaceView,
)

router = DefaultRouter()
router.register(r'cdms', CDMViewSet, basename='cdm')
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('collisions/', CollisionListCreateView.as_view(), name='collision-list-create'),
    path('collisions/<int:pk>/', CollisionDetailView.as_view(), name='collision-detail'),
    path('probabilities/', ProbabilityCalcListCreateView.as_view(), name='probability-list-create'),
    path('probabilities/<int:pk>/', ProbabilityCalcDetailView.as_view(), name='probability-detail'),
    path('collisions/avoidance/', CollisionAvoidanceView.as_view(), name='collision-avoidance'),
    path('cdms/<int:pk>/', CDMCalcDetailView.as_view(), name='cdm-detail'),
    path('cdms/create/', CDMCreateView.as_view(), name='cdm-create'),
    path('tradespace/', CollisionTradespaceView.as_view(), name='collision-tradespace'),
    path('tradespace/linear/', CollisionLinearTradespaceView.as_view(), name='collision-linear-tradespace'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh_token'),
    path('', include(router.urls)),
]
