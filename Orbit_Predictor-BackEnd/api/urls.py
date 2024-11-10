# api/urls.py
from django.urls import path
from .views import (
    ConjunctionListCreateView, ConjunctionDetailView,
    CollisionListCreateView, CollisionDetailView,
    ProbabilityCalcListCreateView, ProbabilityCalcDetailView,
    CDMSerializerListCreateView, CDMCalcDetailView
)

urlpatterns = [
    # Conjunction URLs
    path('conjunctions/', ConjunctionListCreateView.as_view(), name='conjunction-list-create'),
    path('conjunctions/<int:pk>/', ConjunctionDetailView.as_view(), name='conjunction-detail'),

    # Collision URLs
    path('collisions/', CollisionListCreateView.as_view(), name='collision-list-create'),
    path('collisions/<int:pk>/', CollisionDetailView.as_view(), name='collision-detail'),

    # Probability Calculation URLs
    path('probabilities/', ProbabilityCalcListCreateView.as_view(), name='probability-list-create'),
    path('probabilities/<int:pk>/', ProbabilityCalcDetailView.as_view(), name='probability-detail'),

    path('/cdms/', CDMSerializerListCreateView.as_view(), name='cdm-list-create'),
    path('/cdms/<int:pk>/', CDMCalcDetailView.as_view(), name='cdm-detail')
]
