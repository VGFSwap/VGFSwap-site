from django.urls import path
from . import views


urlpatterns = [
    path('', views.index, name='index'),
    path('stake/', views.stake, name='stake'),
    path('user/', views.user, name='user'),
    path('dex/', views.dex, name='dex'),
]
