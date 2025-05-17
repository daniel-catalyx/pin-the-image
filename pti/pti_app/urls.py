from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello_api, name='hello_api'),
    # New URL patterns for image serving
    path('annotation-image/', views.serve_annotation_image, name='serve_annotation_image'),
    path('annotation-image/<str:image_name>', views.serve_annotation_image, name='serve_specific_annotation_image'),
    path('available-images/', views.get_available_images, name='get_available_images'),
]