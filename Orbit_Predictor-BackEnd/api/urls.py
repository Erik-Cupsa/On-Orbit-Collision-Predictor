from django.urls import path
from .views import (
    CollisionListCreateView, CollisionDetailView,
    ProbabilityCalcListCreateView, ProbabilityCalcDetailView,
    CDMSerializerListCreateView, CDMCalcDetailView, RegisterView, LoginView

)

urlpatterns = [
    path('collisions/', CollisionListCreateView.as_view(), name='collision-list-create'),
    path('collisions/<int:pk>/', CollisionDetailView.as_view(), name='collision-detail'),
    path('probabilities/', ProbabilityCalcListCreateView.as_view(), name='probability-list-create'),
    path('probabilities/<int:pk>/', ProbabilityCalcDetailView.as_view(), name='probability-detail'),
    path('cdms/', CDMSerializerListCreateView.as_view(), name='cdm-list-create'),
    path('cdms/<int:pk>/', CDMCalcDetailView.as_view(), name='cdm-detail'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
]
