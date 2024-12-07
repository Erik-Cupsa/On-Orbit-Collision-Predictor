from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    ConjunctionListCreateView, ConjunctionDetailView,
    CollisionListCreateView, CollisionDetailView,
    ProbabilityCalcListCreateView, ProbabilityCalcDetailView,
    CDMSerializerListCreateView, CDMCalcDetailView, RegisterView, LoginView, CDMViewSet, RefreshTokenView

)
router = DefaultRouter()
router.register(r'cdm', CDMViewSet, basename='cdm')

urlpatterns = [
    path('conjunctions/', ConjunctionListCreateView.as_view(), name='conjunction-list-create'),
    path('conjunctions/<int:pk>/', ConjunctionDetailView.as_view(), name='conjunction-detail'),
    path('collisions/', CollisionListCreateView.as_view(), name='collision-list-create'),
    path('collisions/<int:pk>/', CollisionDetailView.as_view(), name='collision-detail'),
    path('probabilities/', ProbabilityCalcListCreateView.as_view(), name='probability-list-create'),
    path('probabilities/<int:pk>/', ProbabilityCalcDetailView.as_view(), name='probability-detail'),
    path('cdms/', CDMSerializerListCreateView.as_view(), name='cdm-list-create'),
    path('cdms/<int:pk>/', CDMCalcDetailView.as_view(), name='cdm-detail'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh_token'),
    path('', include(router.urls)),
]
